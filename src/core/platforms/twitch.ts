import type { PlatformDef, QueryState } from '../types'
import { andTerms } from '../text'

// 出典: docs/operator-research.md(2026-07-03調査、実ブラウザ実測)
// 検索は /search?term=(あいまい一致)。引用符・除外などの演算子は一切効かない。
// type= で検索対象を切り替えられる(channels/categories/videos。実測で有効)。
// 「配信中のみ」のtypeは存在しない。言語絞り込みはURL不可(UIの内部状態のみ)。
function buildUrl(state: QueryState): string | null {
  const parts = [...andTerms(state)]
  // 演算子がないため語句もそのままキーワードとして埋め込む
  if (state.exactPhrase.trim()) parts.push(state.exactPhrase.trim())
  if (parts.length === 0) return null

  const params = new URLSearchParams({ term: parts.join(' ') })
  if (state.resultType === 'video') params.set('type', 'videos')
  else if (state.resultType === 'channel') params.set('type', 'channels')
  return `https://www.twitch.tv/search?${params.toString()}`
}

export const twitch: PlatformDef = {
  id: 'twitch',
  name: 'Twitch',
  group: 'video',
  brandColor: '#9146FF',
  requiresLogin: false,
  googleSite: 'twitch.tv',
  support: {
    keywords: { level: 'partial', noteKey: 'note.loose.and' },
    exactPhrase: { level: 'partial', noteKey: 'note.loose.exact' },
    resultType: { level: 'full' },
    mediaOnly: { level: 'none', noteKey: 'note.videoOnly' },
    japaneseOnly: { level: 'none', noteKey: 'note.twitch.japaneseOnly' },
    sortOrder: { level: 'none', noteKey: 'note.nosort' },
  },
  buildUrl,
}
