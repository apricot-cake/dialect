import Fuse from 'fuse.js'
import { translate, type Lang } from '@/i18n'
import type { ConceptId } from './types'
import {
  CONCEPT_DEFS,
  SELECT_OPTIONS,
  SORT_OPTIONS,
  SUPPORT_COUNT,
  type ConceptDef,
  type SelectOption,
} from './conceptDefs'
import { CONCEPT_TAGS, TAG_DEFS, VALUE_TAGS, type TagId } from './conceptTags'
import { normalizeForSearch } from './searchNormalize'
import { READINGS } from './readings.generated'

/**
 * ピッカー内検索の1概念ぶんの索引レコード。フィールド別に重み・段を変えたいので、
 * コーパスを用途別に分けて持つ。文字列はすべて normalizeForSearch 済み。
 */
interface IndexRecord {
  id: ConceptId
  /** 同義語(概念タグ＋値レベルタグ)をスペース連結した文字列。UI言語の側だけ入れる */
  synonyms: string
  /** 同義語を1語ずつに割った配列(完全一致判定用) */
  synonymTokens: string[]
  /**
   * 漢字↔かな読み一致用のトークン(同義語・ラベル・値の読み)をスペース連結した文字列。
   * ja UI のみ非空(「にんき→人気」を通す)。en UI では空。
   */
  reading: string
  /** 読みを1語ずつに割った配列(完全一致判定用) */
  readingTokens: string[]
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

/**
 * タグ集合の同義語を正規化済みトークンの配列にする。UI言語の側の語だけを入れる
 * (ja UI＝日本語のみ / en UI＝英語のみ)。かなの読みは別途 readingTokensFor が持つ。
 */
function synonymTokensFor(id: ConceptId, lang: Lang): string[] {
  const tokens: string[] = []
  for (const tag of tagsFor(id)) {
    const terms = lang === 'ja' ? TAG_DEFS[tag].synonyms.ja : TAG_DEFS[tag].synonyms.en
    for (const term of terms) {
      const norm = normalizeForSearch(term)
      if (norm) tokens.push(norm)
    }
  }
  return [...new Set(tokens)]
}

/**
 * 漢字↔かな読み一致用のトークン。同義語・ラベル・選択肢の値の「かな読み」を集める。
 * readings.generated.ts(kuromoji生成＋人手上書き)を引く。ja UI 専用で、en UI では空
 * (英語ユーザーはローマ字日本語入力をしないため、混ぜるとノイズになる)。
 */
function readingTokensFor(def: ConceptDef, lang: Lang): string[] {
  if (lang !== 'ja') return []
  const phrases = new Set<string>()
  for (const tag of tagsFor(def.id)) for (const term of TAG_DEFS[tag].synonyms.ja) phrases.add(term)
  phrases.add(translate('ja', def.labelKey))
  for (const opt of optionsFor(def.id)) {
    if (opt.value === '') continue
    phrases.add(translate('ja', opt.labelKey))
  }
  const tokens: string[] = []
  for (const phrase of phrases) {
    const reading = READINGS[phrase]
    if (!reading) continue
    for (const tok of normalizeForSearch(reading).split(' ')) if (tok) tokens.push(tok)
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
    const synonymTokens = synonymTokensFor(def.id, lang)
    const readingTokens = readingTokensFor(def, lang)
    return {
      id: def.id,
      synonyms: synonymTokens.join(' '),
      synonymTokens,
      reading: readingTokens.join(' '),
      readingTokens,
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
      { name: 'synonyms', weight: 0.4 },
      { name: 'reading', weight: 0.25 },
      { name: 'label', weight: 0.25 },
      { name: 'values', weight: 0.1 },
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
  if (r.reading.includes(q)) n++
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
 *   段1 正規化"完全"一致  … ラベル全体 or 同義語/読みトークンが q と一致
 *   段2 同義語/読みヒット   … 同義語列 or 読み列に q を含む(人がレビュー済みなので緩い)
 *   段3 ラベル/値の部分一致 … ラベル or 値ラベルに q を含む
 *   段3.5 ヘルプの部分一致  … ヘルプ文に q を含む
 *   段4 fuzzy(Fuse.js)    … 2文字以下はスキップ(漢字2字の偶然ヒット封じ)
 *
 * 読み列(reading)は ja UI のみ非空。「にんき」→ラベル「人気の目安」の読み
 * 「ニンキノメヤス」に段2で当てるなど、漢字↔かなの橋渡しを担う。
 */
export function searchConcepts(index: SearchIndex, rawQuery: string): RankedHit[] {
  const q = normalizeForSearch(rawQuery)
  if (!q) return []
  const { records, fuse } = index

  const exact = records.filter(
    (r) => r.label === q || r.synonymTokens.includes(q) || r.readingTokens.includes(q),
  )
  if (exact.length) return rank(exact, 'exact', q)

  const syn = records.filter((r) => r.synonyms.includes(q) || r.reading.includes(q))
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
