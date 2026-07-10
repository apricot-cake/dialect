import type { ParsedSearch, PlatformDef, PostLanguage, QueryState } from '../types'
import { limitSort, POST_LANGUAGE_CODES } from '../types'
import { hasPositiveTerm, minusExcludes, quotedTerms, stripAt, stripHash, words } from '../text'
import {
  applyBins,
  emptyBins,
  hostMatches,
  isIsoDate,
  leftoverParams,
  pathSegments,
  tokenize,
  unquote,
} from '../parse'

// 出典: docs/operator-research.md
// 演算子は全て q= に平文で埋め込む。検索ページの閲覧はログイン必須。
// f=top(既定)はアルゴリズム選別で大半を隠すため、新しい順は f=live。
// min_faves:/min_retweets:/min_replies: は「高度な検索」フォームの
// エンゲージメント欄(返信/いいね/リポストの最小件数)に実在する公式演算子と
// 2026-07-08にGUI操作で確認済み(x.com/search-advancedで入力→生成URLを確認)。
// filter:blue_verified(認証済みトグル)は同フォームから消滅済みで非公式のまま。
// メンション検索(「次のアカウントへの@ツイート」欄)は独自演算子ではなく、
// (@user) というカッコ付きの生テキストをクエリに混ぜる形。2026-07-07にx.com/search-advanced
// をGUI操作で実測: 1件=`(@user)`、複数件=`(@user1 OR @user2)`(OR結合)。
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
  // 宛先・メンション・リンク先・リスト内だけの検索もXでは成立するので、正の条件に数える
  if (
    !hasPositiveTerm(state) &&
    !state.toUser.trim() &&
    !state.mentionsUser.trim() &&
    !state.domain.trim() &&
    !list
  ) {
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
  // メンション。to: と違い演算子ではなく素の@テキストなので、1件でも公式フォーム同様
  // 常にカッコで囲む(実機確認: 1件でも`(@user)`、複数件は`(@user1 OR @user2)`)
  const mentions = words(state.mentionsUser).map((u) => `@${stripAt(u)}`)
  if (mentions.length > 0) parts.push(`(${mentions.join(' OR ')})`)
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

  // f=live=新しい順、f=top=人気順(話題)。指定なしは何も送らない(Xの既定はtop)
  const tab =
    state.sort === 'new' ? '&f=live' : state.sort === 'top' ? '&f=top' : ''
  return `https://x.com/search?q=${encodeURIComponent(parts.join(' '))}${tab}`
}

// 逆翻訳: x.com/search?q=…(旧 twitter.com も受ける)。q内の演算子トークンを
// buildUrl と対応する概念へ戻す。読めない演算子・パラメータは ignored へ
function parseUrl(url: URL): ParsedSearch | null {
  if (!hostMatches(url, 'x.com', 'twitter.com')) return null
  if (pathSegments(url)[0] !== 'search') return null
  const q = url.searchParams.get('q')
  if (!q) return null

  const patch: Partial<QueryState> = {}
  const ignored: string[] = []
  const bins = emptyBins()
  const toUsers: string[] = []
  const mentions: string[] = []
  const excludeUsers: string[] = []
  for (const token of tokenize(q)) {
    if (token === '-filter:replies') patch.excludeReplies = true
    else if (token === 'filter:media') patch.mediaOnly = true
    else if (token === 'filter:links') patch.linksOnly = true
    else if (token === 'filter:blue_verified') patch.verifiedOnly = true
    else if (token.startsWith('filter:') || token.startsWith('-filter:')) ignored.push(token)
    else if (token.startsWith('-from:')) excludeUsers.push(token.slice('-from:'.length))
    else if (token.startsWith('from:')) patch.fromUser = token.slice('from:'.length)
    else if (token.startsWith('to:')) toUsers.push(token.slice('to:'.length))
    else if (token.startsWith('url:')) patch.domain = token.slice('url:'.length)
    else if (token.startsWith('list:')) patch.xList = token.slice('list:'.length)
    else if (token.startsWith('since:')) {
      const v = token.slice('since:'.length)
      if (isIsoDate(v)) patch.since = v
      else ignored.push(token)
    } else if (token.startsWith('until:')) {
      const v = token.slice('until:'.length)
      if (isIsoDate(v)) patch.until = v
      else ignored.push(token)
    } else if (token.startsWith('min_faves:')) {
      const v = token.slice('min_faves:'.length)
      if (/^\d+$/.test(v)) patch.minLikes = v
      else ignored.push(token)
    } else if (token.startsWith('min_retweets:')) {
      const v = token.slice('min_retweets:'.length)
      if (/^\d+$/.test(v)) patch.minReposts = v
      else ignored.push(token)
    } else if (token.startsWith('min_replies:')) {
      const v = token.slice('min_replies:'.length)
      if (/^\d+$/.test(v)) patch.minReplies = v
      else ignored.push(token)
    } else if (token.startsWith('lang:')) {
      const code = token.slice('lang:'.length)
      if ((POST_LANGUAGE_CODES as readonly string[]).includes(code)) patch.language = code as PostLanguage
      else ignored.push(token)
    } else if (token.startsWith('(') && token.endsWith(')')) {
      // (to:a OR to:b)=宛先 / (@a OR @b)=メンション。それ以外のグループは読めない
      const inner = token
        .slice(1, -1)
        .split(/\s+OR\s+/i)
        .map((s) => s.trim())
        .filter(Boolean)
      if (inner.length > 0 && inner.every((p) => p.startsWith('to:'))) {
        toUsers.push(...inner.map((p) => p.slice('to:'.length)))
      } else if (inner.length > 0 && inner.every((p) => p.startsWith('@'))) {
        mentions.push(...inner.map((p) => p.slice(1)))
      } else ignored.push(token)
    } else if (token.startsWith('#') && token.length > 1) bins.hashtags.push(token.slice(1))
    // 素の @user もメンション扱い(公式フォームはカッコ付きで生成するが単体でも同義)
    else if (token.startsWith('@') && token.length > 1) mentions.push(token.slice(1))
    else if (token.startsWith('"')) bins.phrases.push(unquote(token))
    else if (token.startsWith('-') && token.length > 1) bins.excludes.push(token.slice(1))
    else bins.terms.push(token)
  }
  applyBins(patch, bins)
  if (toUsers.length > 0) patch.toUser = toUsers.join(' ')
  if (mentions.length > 0) patch.mentionsUser = mentions.join(' ')
  if (excludeUsers.length > 0) patch.excludeUser = excludeUsers.join(' ')

  const f = url.searchParams.get('f')
  if (f === 'live') patch.sort = 'new'
  else if (f === 'top') patch.sort = 'top'
  else if (f) ignored.push(`f=${f}`)
  leftoverParams(url, new Set(['q', 'f']), ignored)
  return { patch, ignored }
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
    mentionsUser: { level: 'full' },
    domain: { level: 'full' },
    xList: { level: 'partial' },
    hashtag: { level: 'full' },
    period: { level: 'full', noteKey: 'note.x.period' },
    mediaOnly: { level: 'full' },
    linksOnly: { level: 'full' },
    verifiedOnly: { level: 'partial' },
    excludeReplies: { level: 'full' },
    minLikes: { level: 'full' },
    minReposts: { level: 'full' },
    minReplies: { level: 'full' },
    language: { level: 'full' },
    sortOrder: { level: 'full' },
  },
  buildUrl,
  parseUrl,
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
