import type { PlatformDef, QueryState } from '../types'
import { andTerms, modedWords, quoteIfPhrase, stripHash } from '../text'

// 出典: docs/operator-research.md(2026-07-02追加調査)
// PCブラウザはログイン不要(サインアップモーダルは閉じられる)。
// 除外・期間・ソートはURLで指定できない。タグ単独ならタグページが確実。
function buildUrl(state: QueryState): string | null {
  // OR構文がないため「どれかを含む」指定のフィールドは丸ごと外す
  const textParts = [...andTerms(state).map(quoteIfPhrase)]
  if (state.exactPhrase.trim()) textParts.push(`"${state.exactPhrase.trim()}"`)
  const tags = modedWords(state.hashtag, state.hashtagMode)
  const tagNames = tags.or ? [] : tags.words.map(stripHash)

  if (tagNames.length === 1 && textParts.length === 0) {
    return `https://www.tiktok.com/tag/${encodeURIComponent(tagNames[0])}`
  }

  const parts = [...textParts, ...tagNames.map((t) => `#${t}`)]
  if (parts.length === 0) return null

  return `https://www.tiktok.com/search?q=${encodeURIComponent(parts.join(' '))}`
}

export const tiktok: PlatformDef = {
  id: 'tiktok',
  name: 'TikTok',
  group: 'video',
  brandColor: '#fe2c55',
  requiresLogin: false,
  googleSite: 'tiktok.com',
  support: {
    keywords: { level: 'partial', noteKey: 'note.loose.and' },
    exactPhrase: { level: 'partial', noteKey: 'note.exact.unreliable' },
    exclude: { level: 'none' },
    fromUser: { level: 'none' },
    hashtag: { level: 'full', noteKey: 'note.tagPage.combined' },
    period: { level: 'none' },
    mediaOnly: { level: 'none', noteKey: 'note.videoOnly' },
    japaneseOnly: { level: 'none' },
    sortOrder: { level: 'none', noteKey: 'note.nosort' },
  },
  buildUrl,
}
