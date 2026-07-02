import type { PlatformDef, QueryState } from '../types'
import { hasPositiveTerm, stripAt, stripHash, words } from '../text'

// 出典: docs/operator-research.md
// search_query は検索ボックスと等価。before:/after: は非公式だが2026年時点で動作。
// sp=CAI%3D(アップロード日順)は2026-01にUIから削除されたがURL直指定はまだ有効。
// ユーザー指定はチャンネル内検索ページ(/@handle/search)への切り替えで近似する。
function buildUrl(state: QueryState): string | null {
  if (!hasPositiveTerm(state)) return null

  const parts: string[] = []
  parts.push(...words(state.keywords))
  if (state.exactPhrase.trim()) parts.push(`"${state.exactPhrase.trim()}"`)
  parts.push(...words(state.exclude).map((w) => `-${w}`))
  if (state.hashtag.trim()) parts.push(`#${stripHash(state.hashtag)}`)
  if (state.since) parts.push(`after:${state.since}`)
  if (state.until) parts.push(`before:${state.until}`)
  const query = parts.join(' ')

  const handle = stripAt(state.fromUser)
  if (handle) {
    // チャンネル内検索。sp(並び順)は適用できない
    return `https://www.youtube.com/@${encodeURIComponent(handle)}/search?query=${encodeURIComponent(query)}`
  }

  const sp = state.newestFirst ? '&sp=CAI%3D' : ''
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}${sp}`
}

export const youtube: PlatformDef = {
  id: 'youtube',
  name: 'YouTube',
  group: 'video',
  brandColor: '#ff0033',
  requiresLogin: false,
  support: {
    keywords: { level: 'full' },
    exactPhrase: { level: 'partial', noteKey: 'note.youtube.exactPhrase' },
    exclude: { level: 'partial', noteKey: 'note.youtube.exclude' },
    fromUser: { level: 'partial', noteKey: 'note.youtube.fromUser' },
    hashtag: { level: 'partial', noteKey: 'note.youtube.hashtag' },
    period: { level: 'partial', noteKey: 'note.youtube.period' },
    mediaOnly: { level: 'none', noteKey: 'note.youtube.mediaOnly' },
    japaneseOnly: { level: 'none', noteKey: 'note.youtube.japaneseOnly' },
    newestFirst: { level: 'partial', noteKey: 'note.youtube.newestFirst' },
  },
  buildUrl,
}
