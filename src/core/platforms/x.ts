import type { PlatformDef, QueryState } from '../types'
import { limitSort } from '../types'
import { hasPositiveTerm, minusExcludes, quotedTerms, stripAt, stripHash, words } from '../text'

// 出典: docs/operator-research.md
// 演算子は全て q= に平文で埋め込む。検索ページの閲覧はログイン必須。
// f=top(既定)はアルゴリズム選別で大半を隠すため、新しい順は f=live。
// min_faves:/min_retweets:/filter:blue_verified は公式フォームから削除済みの
// 非公式演算子だが、2026-07-02にWeb UIでの動作を実機確認済み。
// リストのURL(例 https://x.com/i/lists/123)またはIDから数値のリストIDを取り出す。
// list: 演算子は非公式だが実機確認済み(2026-07-06、リストのメンバー投稿に絞られる)。取れなければ null
function listId(raw: string): string | null {
  const s = raw.trim()
  if (!s) return null
  const m = s.match(/lists\/(\d+)/)
  if (m) return m[1]
  return /^\d+$/.test(s) ? s : null
}

function buildUrl(state: QueryState): string | null {
  const list = listId(state.xList)
  // 宛先・リンク先・リスト内だけの検索もXでは成立するので、正の条件に数える
  if (!hasPositiveTerm(state) && !state.toUser.trim() && !state.domain.trim() && !list) {
    return null
  }

  const parts: string[] = []
  parts.push(...quotedTerms(state))
  parts.push(...minusExcludes(state))
  if (state.fromUser.trim()) parts.push(`from:${stripAt(state.fromUser)}`)
  parts.push(...words(state.excludeUser).map((u) => `-from:${stripAt(u)}`))
  // 宛先は複数指定で「どれか宛て」(OR)
  const tos = words(state.toUser).map((u) => `to:${stripAt(u)}`)
  if (tos.length >= 2) parts.push(`(${tos.join(' OR ')})`)
  else parts.push(...tos)
  // リンク先ドメインは url: で絞る(部分一致)
  if (state.domain.trim()) parts.push(`url:${state.domain.trim()}`)
  // リスト内検索。list:<id> でそのリストのメンバーの投稿だけに絞る(他条件とAND可)
  if (list) parts.push(`list:${list}`)
  parts.push(...words(state.hashtag).map((t) => `#${stripHash(t)}`))
  if (state.since) parts.push(`since:${state.since}`)
  if (state.until) parts.push(`until:${state.until}`)
  if (state.mediaOnly) parts.push('filter:media')
  if (state.linksOnly) parts.push('filter:links')
  if (state.verifiedOnly) parts.push('filter:blue_verified')
  if (state.excludeReplies) parts.push('-filter:replies')
  if (state.minLikes.trim()) parts.push(`min_faves:${state.minLikes.trim()}`)
  if (state.minReposts.trim()) parts.push(`min_retweets:${state.minReposts.trim()}`)
  if (state.minReplies.trim()) parts.push(`min_replies:${state.minReplies.trim()}`)
  if (state.language) parts.push(`lang:${state.language}`)

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
    xList: { level: 'partial', noteKey: 'note.x.unofficial' },
    hashtag: { level: 'full' },
    period: { level: 'full', noteKey: 'note.x.period' },
    mediaOnly: { level: 'full' },
    linksOnly: { level: 'full' },
    verifiedOnly: { level: 'partial', noteKey: 'note.x.unofficial' },
    excludeReplies: { level: 'full' },
    minLikes: { level: 'partial', noteKey: 'note.x.unofficial' },
    minReposts: { level: 'partial', noteKey: 'note.x.unofficial' },
    minReplies: { level: 'partial', noteKey: 'note.x.unofficial' },
    language: { level: 'full' },
    sortOrder: { level: 'full' },
  },
  buildUrl,
  dynamicSupport: (state) => ({
    // 急上昇(note専用)などはXにないので、選ばれたら並び順を非対応に落とす
    ...limitSort(state.sort, ['new', 'top'], 'note.sortOrder.otherSite'),
    // リスト欄に入力はあるが数値IDを取り出せない(スラッグURL等)ときは送れないので、
    // 「使えない」に落として直し方を注記する(適用と出るのに効かない、を防ぐ)
    ...(state.xList.trim() && !listId(state.xList)
      ? { xList: { level: 'none' as const, noteKey: 'note.x.listInvalid' as const } }
      : {}),
  }),
}
