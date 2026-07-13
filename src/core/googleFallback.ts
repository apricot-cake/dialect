import type { ConceptId, PlatformCtx, PlatformDef, PlatformId, QueryState } from './types'
import { supportOf } from './types'
import { andTerms, exactPhrases, words } from './text'
import { joinParts } from './urlParts'
import { google } from './platforms/google'
import { DEFAULT_HOST as MASTODON_DEFAULT_HOST } from './platforms/mastodon'
import { DEFAULT_HOST as MISSKEY_DEFAULT_HOST } from './platforms/misskey'

/**
 * site:検索フォールバック(#42)専用のドメイン対応表。各プラットフォームの検索ページの
 * ホストではなく、コンテンツ本体が実際に置かれているホストを持つ(例: bilibiliの検索は
 * search.bilibili.com という専用サブドメインだが、フォールバックはbilibili.com全体を
 * 対象にしたほうが有用)。mastodon/misskeyはインスタンス切替(issue #32)があるため表に持たず、
 * fallbackDomain() でインスタンスホストを都度解決する
 */
const SITE_DOMAINS: Partial<Record<PlatformId, string>> = {
  x: 'x.com',
  bluesky: 'bsky.app',
  youtube: 'youtube.com',
  instagram: 'instagram.com',
  tumblr: 'tumblr.com',
  pixiv: 'pixiv.net',
  niconico: 'nicovideo.jp',
  seiga: 'seiga.nicovideo.jp',
  fanbox: 'fanbox.cc',
  fantia: 'fantia.jp',
  bilibili: 'bilibili.com',
}

function fallbackDomain(platformId: PlatformId, ctx?: PlatformCtx): string | null {
  if (platformId === 'mastodon') return ctx?.instanceHost ?? MASTODON_DEFAULT_HOST
  if (platformId === 'misskey') return ctx?.instanceHost ?? MISSKEY_DEFAULT_HOST
  return SITE_DOMAINS[platformId] ?? null
}

export interface GoogleFallback {
  url: string
  /** このフォールバックで表現できる、ネイティブ検索では丸ごと落ちていた条件 */
  rescued: ConceptId[]
}

/**
 * ネイティブ検索で丸ごと落ちた条件(droppedReal)のうち、Googleのsite:検索で
 * 表現できるものがあれば迂回路のURLを組む(issue #42)。domain概念は、site:を
 * このフォールバックが専有するためユーザー指定のドメイン絞り込みと両立できず、
 * 対象から除く。近似(approximated)は対象外(ネイティブ側で一応動くため)
 */
export function buildGoogleFallback(
  platform: PlatformDef,
  state: QueryState,
  droppedReal: Array<{ concept: ConceptId }>,
  nativeUrl: string | null,
  ctx?: PlatformCtx,
): GoogleFallback | null {
  if (platform.id === 'google') return null
  const domain = fallbackDomain(platform.id, ctx)
  if (!domain) return null

  const rescued = droppedReal
    .map((d) => d.concept)
    .filter((concept) => concept !== 'domain' && supportOf(google, concept).level !== 'none')
  if (rescued.length === 0 && nativeUrl !== null) return null

  // site: 単独で全ページが対象になるのを防ぐため、Googleへ渡せる正の条件が要る
  const hasPositiveQuery =
    andTerms(state).length > 0 ||
    exactPhrases(state).length > 0 ||
    words(state.keywordsOr).length > 0
  if (!hasPositiveQuery) return null

  const parts = google.buildParts({ ...state, domain })
  if (!parts) return null
  return { url: joinParts(parts), rescued }
}
