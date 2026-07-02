import type { PlatformDef, QueryState } from '../types'
import { hasPositiveTerm, stripAt, stripHash, words } from '../text'

// 出典: docs/operator-research.md
// 演算子は公式ドキュメントあり(除外 - のみ未文書化・実測動作)。ログイン不要。
// tab=latest は未文書化だが social-app のコードに実装されている。
// メディア絞り込み(media=true)はフィーチャーゲート中のため使わない。
function buildUrl(state: QueryState): string | null {
  if (!hasPositiveTerm(state)) return null

  const parts: string[] = []
  parts.push(...words(state.keywords))
  if (state.exactPhrase.trim()) parts.push(`"${state.exactPhrase.trim()}"`)
  parts.push(...words(state.exclude).map((w) => `-${w}`))
  if (state.fromUser.trim()) parts.push(`from:${stripAt(state.fromUser)}`)
  if (state.hashtag.trim()) parts.push(`#${stripHash(state.hashtag)}`)
  if (state.since) parts.push(`since:${state.since}`)
  if (state.until) parts.push(`until:${state.until}`)
  if (state.japaneseOnly) parts.push('lang:ja')

  const tab = state.newestFirst ? '&tab=latest' : ''
  return `https://bsky.app/search?q=${encodeURIComponent(parts.join(' '))}${tab}`
}

export const bluesky: PlatformDef = {
  id: 'bluesky',
  name: 'Bluesky',
  group: 'sns',
  brandColor: '#0085ff',
  requiresLogin: false,
  support: {
    keywords: { level: 'full' },
    exactPhrase: { level: 'full' },
    exclude: { level: 'partial', noteKey: 'note.bluesky.exclude' },
    fromUser: { level: 'full', noteKey: 'note.bluesky.fromUser' },
    hashtag: { level: 'full' },
    period: { level: 'full' },
    mediaOnly: { level: 'none', noteKey: 'note.bluesky.mediaOnly' },
    japaneseOnly: { level: 'full' },
    newestFirst: { level: 'partial', noteKey: 'note.bluesky.newestFirst' },
  },
  buildUrl,
}
