import type { PlatformDef, QueryState } from '../types'
import { andTermWords, hasOrTerms, hasPositiveTerm, orTermGroups, stripAt, stripHash, words } from '../text'

// 出典: docs/operator-research.md
// 演算子は全て q= に平文で埋め込む。検索ページの閲覧はログイン必須。
// f=top(既定)はアルゴリズム選別で大半を隠すため、新しい順は f=live。
// min_faves:/min_retweets:/filter:blue_verified は公式フォームから削除済みの
// 非公式演算子だが、2026-07-02にWeb UIでの動作を実機確認済み。
function buildUrl(state: QueryState): string | null {
  if (!hasPositiveTerm(state) && !hasOrTerms(state)) return null

  const parts: string[] = []
  parts.push(...andTermWords(state))
  // 「どれかを含む」行は括弧で結び、他の語とはスペース(AND)で並置する
  for (const group of orTermGroups(state)) {
    parts.push(`(${group.join(' OR ')})`)
  }
  if (state.exactPhrase.trim()) parts.push(`"${state.exactPhrase.trim()}"`)
  parts.push(...words(state.exclude).map((w) => `-${w}`))
  if (state.fromUser.trim()) parts.push(`from:${stripAt(state.fromUser)}`)
  parts.push(...words(state.excludeUser).map((u) => `-from:${stripAt(u)}`))
  if (state.toUser.trim()) parts.push(`to:${stripAt(state.toUser)}`)
  if (state.hashtag.trim()) parts.push(`#${stripHash(state.hashtag)}`)
  if (state.since) parts.push(`since:${state.since}`)
  if (state.until) parts.push(`until:${state.until}`)
  if (state.mediaOnly) parts.push('filter:media')
  if (state.linksOnly) parts.push('filter:links')
  if (state.verifiedOnly) parts.push('filter:blue_verified')
  if (state.excludeReplies) parts.push('-filter:replies')
  if (state.minLikes.trim()) parts.push(`min_faves:${state.minLikes.trim()}`)
  if (state.minReposts.trim()) parts.push(`min_retweets:${state.minReposts.trim()}`)
  if (state.japaneseOnly) parts.push('lang:ja')

  const tab = state.newestFirst ? 'live' : 'top'
  return `https://x.com/search?q=${encodeURIComponent(parts.join(' '))}&f=${tab}`
}

export const x: PlatformDef = {
  id: 'x',
  name: 'X',
  group: 'sns',
  brandColor: '#0f1419',
  requiresLogin: true,
  support: {
    keywords: { level: 'full' },
    orAny: { level: 'full' },
    exactPhrase: { level: 'full' },
    exclude: { level: 'full' },
    fromUser: { level: 'full' },
    excludeUser: { level: 'full' },
    toUser: { level: 'full' },
    hashtag: { level: 'full' },
    period: { level: 'full', noteKey: 'note.x.period' },
    mediaOnly: { level: 'full' },
    linksOnly: { level: 'full' },
    verifiedOnly: { level: 'partial', noteKey: 'note.x.unofficial' },
    excludeReplies: { level: 'full' },
    minLikes: { level: 'partial', noteKey: 'note.x.unofficial' },
    minReposts: { level: 'partial', noteKey: 'note.x.unofficial' },
    japaneseOnly: { level: 'full' },
    newestFirst: { level: 'full' },
  },
  buildUrl,
}
