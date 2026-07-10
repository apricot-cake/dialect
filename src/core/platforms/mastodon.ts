import type { PlatformDef, QueryState } from '../types'
import { hasPositiveTerm, minusExcludes, quotedTerms, stripAt, stripHash, words } from '../text'

// 出典: 2026-07-08 実機確認(ログイン済みブラウザ、GUI操作)。mastodon.social/search?q=&type=statuses
// はSPAだがURL遷移だけで検索が自動実行される(Misskeyと違い手動ボタン不要)。ハッシュタグ単独は
// /tags/{tag} でログアウトでも閲覧可能。本文検索(投稿タブ)は未ログインだと"hello"のような
// 一般語でも0件になり実質ログイン必須(検索オプションパネルも「ログイン時のみ利用できます」と表示)。
// ログイン後に演算子を実測(from:/-語/"..."/before:/after:/-is:reply/language:/has:media/has:link):
// 除外語を足すと該当投稿が結果から消える、完全一致は語順を入れ替えると0件になる(真の完全一致)、
// from:は投稿者で絞り込む、before:/after:は日付の前後で正しく絞られる、-is:replyでリプライが
// 除外される、language:で言語が絞られる、has:media/has:linkはそれぞれ独立に結果を変える、
// をすべて実際の投稿の増減で確認済み。
function buildUrl(state: QueryState): string | null {
  const tagNames = words(state.hashtag).map(stripHash)
  const handle = stripAt(state.fromUser)

  const hasOtherConditions =
    quotedTerms(state).length > 0 ||
    minusExcludes(state).length > 0 ||
    Boolean(handle) ||
    Boolean(state.since) ||
    Boolean(state.until) ||
    state.mediaOnly ||
    state.linksOnly ||
    state.excludeReplies ||
    Boolean(state.language)
  // 単一タグのみ(他の条件が何もない)ならタグページ(ログアウトでも見られる唯一の経路)
  if (tagNames.length === 1 && !hasOtherConditions) {
    return `https://mastodon.social/tags/${encodeURIComponent(tagNames[0])}`
  }

  if (!hasPositiveTerm(state)) return null

  const parts = [...quotedTerms(state), ...tagNames.map((t) => `#${t}`)]
  parts.push(...minusExcludes(state))
  if (handle) {
    // リモートユーザー(@user@host)は from:user@host の形でそのまま送れる(実機確認済み)
    parts.push(`from:${handle}`)
  }
  if (state.since) parts.push(`after:${state.since}`)
  if (state.until) parts.push(`before:${state.until}`)
  if (state.mediaOnly) parts.push('has:media')
  if (state.linksOnly) parts.push('has:link')
  if (state.excludeReplies) parts.push('-is:reply')
  if (state.language) parts.push(`language:${state.language}`)

  const query = encodeURIComponent(parts.join(' '))
  return `https://mastodon.social/search?q=${query}&type=statuses`
}

export const mastodon: PlatformDef = {
  id: 'mastodon',
  name: 'Mastodon',
  group: 'sns',
  brandColor: '#6364FF',
  requiresLogin: true,
  googleSite: 'mastodon.social',
  support: {
    keywords: { level: 'full', noteKey: 'note.mastodon.keywords' },
    exactPhrase: { level: 'full' },
    exclude: { level: 'full' },
    fromUser: { level: 'full' },
    hashtag: { level: 'full', noteKey: 'note.tagPage.combined' },
    period: { level: 'full' },
    mediaOnly: { level: 'full' },
    linksOnly: { level: 'full' },
    excludeReplies: { level: 'full' },
    language: { level: 'full' },
    sortOrder: { level: 'none', noteKey: 'note.nosort' },
  },
  buildUrl,
}
