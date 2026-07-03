import type { PlatformDef, QueryState } from '../types'
import { stripHash, words } from '../text'

// 出典: docs/operator-research.md(2026-07-03調査)
// mstdn.jp は Mastodon v4.3系で、検索ページの ?q= を読む機能がない(v4.4.0で追加予定)。
// そのためキーワード入りの検索URLは組めず、ログインなしで機能する公開URLは
// タグページ /tags/{タグ} のみ。全文検索は要ログインのうえ、対象もオプトインした
// ユーザーの公開投稿に限られる。キーワード検索はGoogleフォールバックで補う。
function buildUrl(state: QueryState): string | null {
  const tagNames = words(state.hashtag).map(stripHash)
  if (tagNames.length === 0) return null
  // タグページは1タグのみ。2つ目以降は翻訳できず落ちる(注記済み)
  return `https://mstdn.jp/tags/${encodeURIComponent(tagNames[0])}`
}

export const mastodon: PlatformDef = {
  id: 'mastodon',
  name: 'Mastodon',
  group: 'sns',
  brandColor: '#6364FF',
  requiresLogin: false,
  googleSite: 'mstdn.jp',
  support: {
    keywords: { level: 'none', noteKey: 'note.mastodon.keywords' },
    exactPhrase: { level: 'none', noteKey: 'note.mastodon.keywords' },
    exclude: { level: 'none', noteKey: 'note.mastodon.keywords' },
    hashtag: { level: 'partial', noteKey: 'note.mastodon.hashtag' },
    japaneseOnly: { level: 'none' },
    sortOrder: { level: 'none', noteKey: 'note.nosort' },
  },
  buildUrl,
}
