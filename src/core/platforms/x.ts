import type { PlatformDef, QueryState } from '../types'
import { limitSort } from '../types'
import { andTerms, hasPositiveTerm, quoteIfPhrase, stripAt, stripHash, words } from '../text'

// 出典: docs/operator-research.md
// 演算子は全て q= に平文で埋め込む。検索ページの閲覧はログイン必須。
// f=top(既定)はアルゴリズム選別で大半を隠すため、新しい順は f=live。
// min_faves:/min_retweets:/filter:blue_verified は公式フォームから削除済みの
// 非公式演算子だが、2026-07-02にWeb UIでの動作を実機確認済み。
function buildUrl(state: QueryState): string | null {
  // 宛先・リンク先だけの検索もXでは成立するので、正の条件に数える
  if (!hasPositiveTerm(state) && !state.toUser.trim() && !state.domain.trim()) {
    return null
  }

  const parts: string[] = []
  parts.push(...andTerms(state).map(quoteIfPhrase))
  if (state.exactPhrase.trim()) parts.push(`"${state.exactPhrase.trim()}"`)
  parts.push(...words(state.exclude).map((w) => `-${w}`))
  if (state.fromUser.trim()) parts.push(`from:${stripAt(state.fromUser)}`)
  parts.push(...words(state.excludeUser).map((u) => `-from:${stripAt(u)}`))
  // 宛先は複数指定で「どれか宛て」(OR)
  const tos = words(state.toUser).map((u) => `to:${stripAt(u)}`)
  if (tos.length >= 2) parts.push(`(${tos.join(' OR ')})`)
  else parts.push(...tos)
  // リンク先ドメインは url: で絞る(部分一致)
  if (state.domain.trim()) parts.push(`url:${state.domain.trim()}`)
  parts.push(...words(state.hashtag).map((t) => `#${stripHash(t)}`))
  if (state.since) parts.push(`since:${state.since}`)
  if (state.until) parts.push(`until:${state.until}`)
  if (state.mediaOnly) parts.push('filter:media')
  if (state.linksOnly) parts.push('filter:links')
  if (state.verifiedOnly) parts.push('filter:blue_verified')
  if (state.excludeReplies) parts.push('-filter:replies')
  if (state.minLikes.trim()) parts.push(`min_faves:${state.minLikes.trim()}`)
  if (state.minReposts.trim()) parts.push(`min_retweets:${state.minReposts.trim()}`)
  if (state.japaneseOnly) parts.push('lang:ja')

  // f=live=新しい順、f=top=人気順(話題)。おまかせは指定しない(Xの既定はtop)
  const tab =
    state.sort === 'new' ? '&f=live' : state.sort === 'top' ? '&f=top' : ''
  return `https://x.com/search?q=${encodeURIComponent(parts.join(' '))}${tab}`
}

export const x: PlatformDef = {
  id: 'x',
  name: 'X',
  group: 'sns',
  brandColor: '#0f1419',
  requiresLogin: true,
  googleSite: 'x.com',
  support: {
    keywords: { level: 'full' },
    exactPhrase: { level: 'full' },
    exclude: { level: 'full' },
    fromUser: { level: 'full' },
    excludeUser: { level: 'full' },
    toUser: { level: 'full' },
    domain: { level: 'full' },
    hashtag: { level: 'full' },
    period: { level: 'full', noteKey: 'note.x.period' },
    mediaOnly: { level: 'full' },
    linksOnly: { level: 'full' },
    verifiedOnly: { level: 'partial', noteKey: 'note.x.unofficial' },
    excludeReplies: { level: 'full' },
    minLikes: { level: 'partial', noteKey: 'note.x.unofficial' },
    minReposts: { level: 'partial', noteKey: 'note.x.unofficial' },
    japaneseOnly: { level: 'full' },
    sortOrder: { level: 'full' },
  },
  buildUrl,
  // 急上昇(note専用)などはXにないので、選ばれたら並び順を非対応に落とす
  dynamicSupport: (state) => limitSort(state.sort, ['new', 'top'], 'note.sortOrder.otherSite'),
}
