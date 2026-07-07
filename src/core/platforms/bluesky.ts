import type { PlatformDef, QueryState } from '../types'
import { limitSort } from '../types'
import { hasPositiveTerm, minusExcludes, quotedTerms, stripAt, stripHash, words } from '../text'

// 出典: docs/operator-research.md
// 演算子は公式ドキュメントあり(除外 - のみ未文書化・実測動作)。ログイン不要。
// tab=latest は未文書化だが social-app のコードに実装されている。
// メディア絞り込み(media=true)はフィーチャーゲート中のため使わない。
function buildUrl(state: QueryState): string | null {
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
  if (state.language) parts.push(`lang:${state.language}`)

  // tab=latest=新しい順。人気順・指定なしは既定のTopタブのまま開く
  const tab = state.sort === 'new' ? '&tab=latest' : ''
  return `https://bsky.app/search?q=${encodeURIComponent(parts.join(' '))}${tab}`
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
    mediaOnly: { level: 'none', noteKey: 'note.bluesky.mediaOnly' },
    language: { level: 'full' },
    sortOrder: { level: 'partial' },
  },
  buildUrl,
  dynamicSupport: (state) => limitSort(state.sort, ['new', 'top'], 'note.sortOrder.otherSite'),
}
