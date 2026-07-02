import type { PlatformDef, QueryState } from '../types'
import { stripAt, stripHash, words } from '../text'

// 出典: docs/operator-research.md
// 演算子は from:@noteID のみ(公式機能)。除外・完全一致・期間は非対応。
// ハッシュタグ単独ならタグページ(厳密一致)、他条件と併用時はキーワードとして検索。
function buildUrl(state: QueryState): string | null {
  const tag = stripHash(state.hashtag)
  const handle = stripAt(state.fromUser)
  // 完全一致は効かないため、語句をそのままキーワードとして扱う(近似)
  const textParts = [...words(state.keywords), ...words(state.exactPhrase)]

  if (tag && !handle && textParts.length === 0) {
    return `https://note.com/hashtag/${encodeURIComponent(tag)}`
  }

  const parts = [...textParts]
  if (tag) parts.push(tag)
  if (handle) parts.push(`from:@${handle}`)
  if (parts.length === 0) return null

  const sort = state.newestFirst ? 'new' : 'popular'
  return `https://note.com/search?context=note&q=${encodeURIComponent(parts.join(' '))}&sort=${sort}`
}

export const note: PlatformDef = {
  id: 'note',
  name: 'note',
  brandColor: '#13b5b1',
  requiresLogin: false,
  support: {
    keywords: { level: 'partial', noteKey: 'note.note.keywords' },
    exactPhrase: { level: 'partial', noteKey: 'note.note.exactPhrase' },
    exclude: { level: 'none', noteKey: 'note.note.exclude' },
    fromUser: { level: 'full', noteKey: 'note.note.fromUser' },
    hashtag: { level: 'full', noteKey: 'note.note.hashtag' },
    period: { level: 'none', noteKey: 'note.note.period' },
    mediaOnly: { level: 'none', noteKey: 'note.note.mediaOnly' },
    japaneseOnly: { level: 'none', noteKey: 'note.note.japaneseOnly' },
    newestFirst: { level: 'full' },
  },
  buildUrl,
}
