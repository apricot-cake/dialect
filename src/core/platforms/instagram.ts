import type { PlatformDef, QueryState } from '../types'
import { andTerms, modedWords, stripHash } from '../text'

// 出典: docs/operator-research.md(2026-07-02追加調査)
// 検索・タグページともログイン必須(未ログインは即ログイン画面)。演算子は実質ゼロ。
// タグ単独ならタグページ(人気投稿のみ)、それ以外はキーワードSERP。
function buildUrl(state: QueryState): string | null {
  // OR構文がないため「どれかを含む」指定のフィールドは丸ごと外す。完全一致は近似のキーワード扱い
  const textParts = [...andTerms(state)]
  if (state.exactPhrase.trim()) textParts.push(state.exactPhrase.trim())
  const tags = modedWords(state.hashtag, state.hashtagMode)
  const tagNames = tags.or ? [] : tags.words.map(stripHash)

  if (tagNames.length === 1 && textParts.length === 0) {
    return `https://www.instagram.com/explore/tags/${encodeURIComponent(tagNames[0])}/`
  }

  const parts = [...textParts, ...tagNames.map((t) => `#${t}`)]
  if (parts.length === 0) return null

  return `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(parts.join(' '))}`
}

export const instagram: PlatformDef = {
  id: 'instagram',
  name: 'Instagram',
  group: 'sns',
  brandColor: '#833ab4',
  requiresLogin: true,
  googleSite: 'instagram.com',
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
