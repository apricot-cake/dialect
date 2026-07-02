import type { PlatformDef, QueryState } from '../types'
import { andTermWords, stripHash, words } from '../text'

// 出典: docs/operator-research.md(2026-07-02追加調査)
// 検索・タグページともログイン必須(未ログインは即ログイン画面)。演算子は実質ゼロ。
// タグ単独ならタグページ(人気投稿のみ)、それ以外はキーワードSERP。
function buildUrl(state: QueryState): string | null {
  const tag = stripHash(state.hashtag)
  const textParts = [...andTermWords(state), ...words(state.exactPhrase)]

  if (tag && textParts.length === 0) {
    return `https://www.instagram.com/explore/tags/${encodeURIComponent(tag)}/`
  }

  const parts = [...textParts]
  if (tag) parts.push(`#${tag}`)
  if (parts.length === 0) return null

  return `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(parts.join(' '))}`
}

export const instagram: PlatformDef = {
  id: 'instagram',
  name: 'Instagram',
  group: 'sns',
  brandColor: '#833ab4',
  requiresLogin: true,
  support: {
    keywords: { level: 'partial', noteKey: 'note.loose.and' },
    exactPhrase: { level: 'partial', noteKey: 'note.loose.exact' },
    exclude: { level: 'none' },
    fromUser: { level: 'none' },
    hashtag: { level: 'full', noteKey: 'note.instagram.hashtag' },
    period: { level: 'none' },
    mediaOnly: { level: 'none' },
    japaneseOnly: { level: 'none' },
    sortOrder: { level: 'none', noteKey: 'note.nosort' },
  },
  buildUrl,
}
