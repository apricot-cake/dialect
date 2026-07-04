import type { ConceptId, PlatformDef, QueryState, Resolution } from './types'
import { activeConcepts } from './concepts'
import { andTerms, exactPhrases, quoteIfPhrase, words } from './text'

// Googleフォールバック: 本体サイトの検索で外れる条件を、Googleの site: 検索
// (サイト内検索)で補う。note公式ヘルプ自身が除外検索の代替として
// site:note.com のGoogle検索を案内しており、その一般化(docs/operator-research.md)。

/**
 * フォールバックの提示トリガーになる概念。ネイティブ検索で外れた(dropped)
 * これらの条件は、Googleの公式演算子でそのまま表現できる
 */
const RECOVERABLE: ReadonlySet<ConceptId> = new Set([
  'exactPhrase', // "..."
  'exclude', // -word
  'period', // after: / before: (2019年に公式化)
])

/**
 * Google URLに引き継げる概念の全体。トリガーにはしないが keywords は q= に、
 * language は lr=lang_* に翻訳される
 */
const CARRIED: ReadonlySet<ConceptId> = new Set([
  ...RECOVERABLE,
  'keywords',
  'language',
])

/** ネイティブ検索の代替としてのGoogleサイト内検索 */
export interface GoogleFallback {
  url: string
  /** 本体サイトでは使えないが、Googleなら効く条件 */
  recovered: ConceptId[]
  /** 本体サイトでは効くが、Googleには引き継げない条件 */
  lost: ConceptId[]
}

/** site:ドメイン のGoogle検索URL。Googleへ渡せる正の条件がなければ null */
function buildGoogleUrl(site: string, state: QueryState): string | null {
  const parts: string[] = []
  parts.push(...andTerms(state).map(quoteIfPhrase))
  parts.push(...exactPhrases(state).map((p) => `"${p}"`))
  // 除外や期間だけではサイト全ページが対象になってしまうため検索として成立しない
  if (parts.length === 0) return null

  parts.unshift(`site:${site}`)
  parts.push(...words(state.exclude).map((w) => `-${w}`))
  if (state.since) parts.push(`after:${state.since}`)
  if (state.until) parts.push(`before:${state.until}`)
  const lang = state.language ? `&lr=lang_${state.language}` : ''
  return `https://www.google.com/search?q=${encodeURIComponent(parts.join(' '))}${lang}`
}

/**
 * ネイティブ検索で外れた条件をGoogleで補えるとき、その代替検索を返す。
 * 補える条件がひとつもなければ null(=Googleボタンは出さない)
 */
export function googleFallback(
  platform: PlatformDef,
  state: QueryState,
  resolution: Resolution,
): GoogleFallback | null {
  const nativeDropped = new Set(resolution.dropped.map((d) => d.concept))
  const recovered = [...nativeDropped].filter((c) => RECOVERABLE.has(c))
  if (recovered.length === 0) return null

  const url = buildGoogleUrl(platform.googleSite, state)
  if (!url) return null

  // 本体では効いていたのにGoogle側で消える条件だけを注記する
  // (本体でも外れていた条件はどちらで開いても同じなので挙げない)
  const lost = activeConcepts(state).filter(
    (c) => !CARRIED.has(c) && !nativeDropped.has(c),
  )
  return { url, recovered, lost }
}
