import Fuse from 'fuse.js'
import { translate, type Lang } from '@/i18n'
import type { ConceptId } from './types'
import {
  CONCEPT_DEFS,
  SELECT_OPTIONS,
  SORT_OPTIONS,
  SUPPORT_COUNT,
  type SelectOption,
} from './conceptDefs'
import { CONCEPT_TAGS, TAG_DEFS, VALUE_TAGS, type TagId } from './conceptTags'
import { normalizeForSearch } from './searchNormalize'

/**
 * ピッカー内検索の1概念ぶんの索引レコード。フィールド別に重み・段を変えたいので、
 * コーパスを用途別に分けて持つ。文字列はすべて normalizeForSearch 済み。
 */
interface IndexRecord {
  id: ConceptId
  /** 同義語(概念タグ＋値レベルタグ、日英)をスペース連結した文字列 */
  synonyms: string
  /** 同義語を1語ずつに割った配列(完全一致判定用) */
  synonymTokens: string[]
  /** 表示ラベル */
  label: string
  /** ヘルプ文 */
  help: string
  /** 選択肢の値ラベル群(例: 「人気順 新しい順 …」) */
  values: string
  /** 静的対応サイト数。ランキングのタイブレークに使う */
  supportCount: number
}

export interface SearchIndex {
  records: IndexRecord[]
  fuse: Fuse<IndexRecord>
}

export type MatchTier = 'exact' | 'synonym' | 'partial' | 'fuzzy'
export interface RankedHit {
  id: ConceptId
  tier: MatchTier
  score: number
}

/** その概念が持つ選択肢(select は SELECT_OPTIONS、並び順は SORT_OPTIONS)。無ければ空 */
function optionsFor(id: ConceptId): SelectOption[] {
  if (id === 'sortOrder') return SORT_OPTIONS as SelectOption[]
  return SELECT_OPTIONS[id] ?? []
}

/** 概念に効くタグ(概念レベル＋各値レベル)を重複なく集める */
function tagsFor(id: ConceptId): TagId[] {
  const set = new Set<TagId>(CONCEPT_TAGS[id] ?? [])
  for (const opt of optionsFor(id)) {
    if (opt.value === '') continue // 「指定なし」は意図を持たない
    for (const tag of VALUE_TAGS[`${id}:${opt.value}`] ?? []) set.add(tag)
  }
  return [...set]
}

/** タグ集合の同義語(日英)を正規化済みトークンの配列にする */
function synonymTokensFor(id: ConceptId): string[] {
  const tokens: string[] = []
  for (const tag of tagsFor(id)) {
    const { ja, en } = TAG_DEFS[tag].synonyms
    for (const term of [...ja, ...en]) {
      const norm = normalizeForSearch(term)
      if (norm) tokens.push(norm)
    }
  }
  return [...new Set(tokens)]
}

/** 値ラベル群を正規化して連結(「指定なし」は除く) */
function valueCorpus(id: ConceptId, lang: Lang): string {
  return optionsFor(id)
    .filter((o) => o.value !== '')
    .map((o) => normalizeForSearch(translate(lang, o.labelKey)))
    .join(' ')
}

/**
 * 指定した言語で検索インデックスを構築する。ラベル・ヘルプ・値ラベルは言語依存なので
 * 言語ごとに作り直す(呼び側で useMemo の依存に言語を入れる)。同義語は日英を常に両方
 * 入れるため言語には依存しない。
 */
export function buildSearchIndex(lang: Lang): SearchIndex {
  const records: IndexRecord[] = CONCEPT_DEFS.map((def) => {
    const synonymTokens = synonymTokensFor(def.id)
    return {
      id: def.id,
      synonyms: synonymTokens.join(' '),
      synonymTokens,
      label: normalizeForSearch(translate(lang, def.labelKey)),
      help: normalizeForSearch(translate(lang, def.helpKey)),
      values: valueCorpus(def.id, lang),
      supportCount: SUPPORT_COUNT[def.id],
    }
  })

  // fuzzy(段4)専用の Fuse。あいまい照合はここだけに閉じ込め、他の段は自前の
  // 部分一致で確定的に判定する(「同義語=緩く・fuzzy=締める」の実装的表現)。
  const fuse = new Fuse(records, {
    keys: [
      { name: 'synonyms', weight: 0.45 },
      { name: 'label', weight: 0.3 },
      { name: 'values', weight: 0.15 },
      { name: 'help', weight: 0.1 },
    ],
    threshold: 0.25,
    ignoreLocation: true,
    minMatchCharLength: 2,
    includeScore: true,
  })

  return { records, fuse }
}

/** q が索引レコードの何個のフィールドに部分一致するか(複数同時ヒットを上位に上げる) */
function matchBreadth(r: IndexRecord, q: string): number {
  let n = 0
  if (r.synonyms.includes(q)) n++
  if (r.label.includes(q)) n++
  if (r.values.includes(q)) n++
  if (r.help.includes(q)) n++
  return n
}

/** 同一段内の並べ替え: 一致の広さ→対応サイト数(既存タイブレーク) */
function rank(hits: IndexRecord[], tier: MatchTier, q: string): RankedHit[] {
  return hits
    .map((r) => ({ r, breadth: matchBreadth(r, q) }))
    .sort((a, b) => b.breadth - a.breadth || b.r.supportCount - a.r.supportCount)
    .map(({ r, breadth }) => ({ id: r.id, tier, score: breadth }))
}

/**
 * クエリ→順位付き概念。段階緩和ラダー: 上の段でヒットがある限り下へ緩めない。
 * 空クエリは [](呼び側で既定の対応数ソートに戻す)。keywords も対象に含めるので、
 * 除外は呼び側で行う。
 *
 *   段1 正規化"完全"一致  … ラベル全体 or 同義語トークンが q と一致
 *   段2 同義語ヒット       … 同義語列に q を含む(人がレビュー済みなので緩い)
 *   段3 ラベル/値の部分一致 … ラベル or 値ラベルに q を含む
 *   段3.5 ヘルプの部分一致  … ヘルプ文に q を含む
 *   段4 fuzzy(Fuse.js)    … 2文字以下はスキップ(漢字2字の偶然ヒット封じ)
 */
export function searchConcepts(index: SearchIndex, rawQuery: string): RankedHit[] {
  const q = normalizeForSearch(rawQuery)
  if (!q) return []
  const { records, fuse } = index

  const exact = records.filter((r) => r.label === q || r.synonymTokens.includes(q))
  if (exact.length) return rank(exact, 'exact', q)

  const syn = records.filter((r) => r.synonyms.includes(q))
  if (syn.length) return rank(syn, 'synonym', q)

  const partial = records.filter((r) => r.label.includes(q) || r.values.includes(q))
  if (partial.length) return rank(partial, 'partial', q)

  const helpHit = records.filter((r) => r.help.includes(q))
  if (helpHit.length) return rank(helpHit, 'partial', q)

  if (q.length <= 2) return []
  return fuse
    .search(q)
    .map((h) => ({ id: h.item.id, tier: 'fuzzy' as const, score: h.score ?? 1 }))
}
