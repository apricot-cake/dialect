import type { PlatformDef, QueryState } from '../types'
import { stripHash, words } from '../text'

// 出典: docs/operator-research.md(2026-07-02追加調査)
// PCブラウザはログイン不要(サインアップモーダルは閉じられる)。
// 除外・期間・ソートはURLで指定できない。タグ単独ならタグページが確実。
function buildUrl(state: QueryState): string | null {
  const tag = stripHash(state.hashtag)
  const textParts = [...words(state.keywords)]
  if (state.exactPhrase.trim()) textParts.push(`"${state.exactPhrase.trim()}"`)

  if (tag && textParts.length === 0) {
    return `https://www.tiktok.com/tag/${encodeURIComponent(tag)}`
  }

  const parts = [...textParts]
  if (tag) parts.push(`#${tag}`)
  if (parts.length === 0) return null

  return `https://www.tiktok.com/search?q=${encodeURIComponent(parts.join(' '))}`
}

export const tiktok: PlatformDef = {
  id: 'tiktok',
  name: 'TikTok',
  group: 'video',
  brandColor: '#fe2c55',
  requiresLogin: false,
  support: {
    keywords: { level: 'partial', noteKey: 'note.loose.and' },
    exactPhrase: { level: 'partial', noteKey: 'note.exact.unreliable' },
    exclude: { level: 'none' },
    fromUser: { level: 'none' },
    hashtag: { level: 'full', noteKey: 'note.tagPage.combined' },
    period: { level: 'none' },
    mediaOnly: { level: 'none', noteKey: 'note.videoOnly' },
    japaneseOnly: { level: 'none' },
    newestFirst: { level: 'none', noteKey: 'note.nosort' },
  },
  buildUrl,
}
