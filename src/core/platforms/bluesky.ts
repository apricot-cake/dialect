import type { ConceptId, ConceptSupport, PlatformDef, QueryState } from '../types'
import { limitSort } from '../types'
import {
  andTerms,
  exactPhrases,
  hasPositiveTerm,
  minusExcludes,
  quotedTerms,
  stripAt,
  stripHash,
  words,
} from '../text'

// 出典: docs/operator-research.md
// 演算子は公式ドキュメントあり(除外 - のみ未文書化・実測動作)。ログイン不要。
// tab=latest は未文書化だが social-app のコードに実装されている。
// media=true(メディアのみ)は2026-07-09にURL叩きで再検証: 以前は
// フィーチャーゲート中で保留していたが、現在は検索フォームにトグルは出ないものの
// URLへ付けると実際に絞り込まれ、ユーザー/フィードタブも隠れる(サーバー側が認識する
// 挙動)ことを確認できたため採用する。GUI上に対応するトグルはまだ無いため
// 出所は「URL叩き」(フォーム操作での採取ではない)
function buildUrl(state: QueryState): string | null {
  // ユーザー検索(tab=user)はアカウント名/ハンドルへのゆるい一致で、本文演算子が効かない。
  // 2026-07-09 GUI操作で確認: 「猫 -犬」で検索しても「犬猫」を含むアカウントが普通に
  // 返る(除外が効かない)、引用符も無視して同じ結果になる(完全一致にならない)。
  // よって語句はそのまま連結するだけにし、他の演算子は使わない
  if (state.resultType === 'people') {
    const terms = [...andTerms(state), ...exactPhrases(state)]
    if (terms.length === 0) return null
    return `https://bsky.app/search?q=${encodeURIComponent(terms.join(' '))}&tab=user`
  }

  // メンション先・リンク先だけの検索もBlueskyでは成立するので、正の条件に数える
  if (!hasPositiveTerm(state) && !state.mentionsUser.trim() && !state.domain.trim()) {
    return null
  }

  const parts: string[] = []
  parts.push(...quotedTerms(state))
  parts.push(...minusExcludes(state))
  if (state.fromUser.trim()) parts.push(`from:${stripAt(state.fromUser)}`)
  if (state.mentionsUser.trim()) parts.push(`mentions:${stripAt(state.mentionsUser)}`)
  if (state.domain.trim()) parts.push(`domain:${state.domain.trim()}`)
  parts.push(...words(state.hashtag).map((t) => `#${stripHash(t)}`))
  if (state.since) parts.push(`since:${state.since}`)
  if (state.until) parts.push(`until:${state.until}`)

  // tab=latest=新しい順。人気順・指定なしは既定のTopタブのまま開く
  const tab = state.sort === 'new' ? '&tab=latest' : ''
  // 言語は &lang= のURLパラメータで送る(2026-07-09 GUI採取: 検索ページの言語ドロップダウンが
  // 生成する形。lang: 演算子もAPIレベルでは効くが、UIは lang: をクエリ文字扱いする=実プロダクトの
  // 生成形に揃える)。クエリ本体とは別枠なので他演算子と自由に合成できる
  const lang = state.language ? `&lang=${state.language}` : ''
  const media = state.mediaOnly ? '&media=true' : ''
  return `https://bsky.app/search?q=${encodeURIComponent(parts.join(' '))}${tab}${lang}${media}`
}

// resultType=people(アカウント検索)は許可リスト方式(Blueskyが対応する1値のみ)。
// 選ばれたら、アカウント検索では効かない演算子をまとめて「使えない」に落とす
const PEOPLE_CONFLICT: ConceptSupport = {
  level: 'none',
  noteKey: 'note.bluesky.peopleConflict',
}
function dynamicSupport(
  state: QueryState,
): Partial<Record<ConceptId, ConceptSupport>> {
  const overrides: Partial<Record<ConceptId, ConceptSupport>> = {}
  if (state.resultType === 'people') {
    // 語句どうしのANDも保証されない、ふつうの部分一致(note.loose.and)
    overrides.keywords = { level: 'partial', noteKey: 'note.loose.and' }
    overrides.exactPhrase = PEOPLE_CONFLICT
    overrides.exclude = PEOPLE_CONFLICT
    overrides.fromUser = PEOPLE_CONFLICT
    overrides.mentionsUser = PEOPLE_CONFLICT
    overrides.domain = PEOPLE_CONFLICT
    overrides.hashtag = PEOPLE_CONFLICT
    overrides.period = PEOPLE_CONFLICT
    overrides.mediaOnly = PEOPLE_CONFLICT
    overrides.language = PEOPLE_CONFLICT
    overrides.sortOrder = PEOPLE_CONFLICT
  } else if (state.resultType) {
    // Bluesky が対応しない値(他サイト専用)
    overrides.resultType = { level: 'none', noteKey: 'note.resultType.otherSite' }
  }
  return {
    ...overrides,
    ...(state.resultType !== 'people'
      ? limitSort(state.sort, ['new', 'top'], 'note.sortOrder.otherSite')
      : {}),
  }
}

export const bluesky: PlatformDef = {
  id: 'bluesky',
  name: 'Bluesky',
  group: 'sns',
  brandColor: '#0085ff',
  requiresLogin: false,
  googleSite: 'bsky.app',
  support: {
    keywords: { level: 'full' },
    exactPhrase: { level: 'full' },
    exclude: { level: 'partial' },
    fromUser: { level: 'full', noteKey: 'note.bluesky.fromUser' },
    mentionsUser: { level: 'full', noteKey: 'note.bluesky.fromUser' },
    domain: { level: 'full' },
    hashtag: { level: 'full' },
    period: { level: 'full' },
    mediaOnly: { level: 'full' },
    language: { level: 'full' },
    resultType: { level: 'full' },
    sortOrder: { level: 'partial' },
  },
  buildUrl,
  dynamicSupport,
}
