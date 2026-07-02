import type { PlatformDef, QueryState } from '../types'
import { hasPositiveTerm, stripAt, stripHash, words } from '../text'

// 出典: docs/operator-research.md
// 演算子は全て q= に平文で埋め込む。検索ページの閲覧はログイン必須。
// f=top(既定)はアルゴリズム選別で大半を隠すため、新しい順は f=live。
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
  if (state.mediaOnly) parts.push('filter:media')
  if (state.japaneseOnly) parts.push('lang:ja')

  const tab = state.newestFirst ? 'live' : 'top'
  return `https://x.com/search?q=${encodeURIComponent(parts.join(' '))}&f=${tab}`
}

export const x: PlatformDef = {
  id: 'x',
  name: 'X',
  brandColor: '#0f1419',
  requiresLogin: true,
  support: {
    keywords: { level: 'full' },
    exactPhrase: { level: 'full' },
    exclude: { level: 'full' },
    fromUser: { level: 'full' },
    hashtag: { level: 'full' },
    period: { level: 'full', noteKey: 'note.x.period' },
    mediaOnly: { level: 'full' },
    japaneseOnly: { level: 'full' },
    newestFirst: { level: 'full' },
  },
  buildUrl,
}
