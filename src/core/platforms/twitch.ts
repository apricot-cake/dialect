import type { ConceptId, ConceptSupport, ParsedSearch, PlatformDef, QueryState } from '../types'
import { andTerms, exactPhrases, words } from '../text'
import { hostMatches, leftoverParams, pathSegments } from '../parse'

// 出典: docs/operator-research.md(2026-07-03調査、実ブラウザ実測)
// 検索は /search?term=(あいまい一致)。引用符・除外などの演算子は一切効かない。
// type= で検索対象を切り替えられる(channels/categories/videos。実測で有効)。
// 「配信中のみ」のtypeは存在しない。言語絞り込みはURL不可(UIの内部状態のみ)。
function buildUrl(state: QueryState): string | null {
  const parts = [...andTerms(state)]
  // 演算子がないため語句もそのままキーワードとして埋め込む
  parts.push(...exactPhrases(state))
  if (parts.length === 0) return null

  const params = new URLSearchParams({ term: parts.join(' ') })
  if (state.resultType === 'video') params.set('type', 'videos')
  else if (state.resultType === 'channel') params.set('type', 'channels')
  return `https://www.twitch.tv/search?${params.toString()}`
}

// 逆翻訳: twitch.tv/search?term=…(&type=videos|channels)
function parseUrl(url: URL): ParsedSearch | null {
  if (!hostMatches(url, 'twitch.tv')) return null
  if (pathSegments(url)[0] !== 'search') return null
  const term = url.searchParams.get('term')
  if (!term) return null

  const patch: Partial<QueryState> = {}
  const ignored: string[] = []
  const terms = words(term)
  if (terms.length > 0) patch.terms = terms
  const type = url.searchParams.get('type')
  if (type === 'videos') patch.resultType = 'video'
  else if (type === 'channels') patch.resultType = 'channel'
  else if (type !== null) ignored.push(`type=${type}`)
  leftoverParams(url, new Set(['term', 'type']), ignored)
  return { patch, ignored }
}

// Twitchで探せるのは動画とチャンネルだけ。それ以外(ショート/再生リスト/Reddit専用の値)が
// 選ばれたら落とす
function dynamicSupport(
  state: QueryState,
): Partial<Record<ConceptId, ConceptSupport>> {
  if (state.resultType && state.resultType !== 'video' && state.resultType !== 'channel') {
    return { resultType: { level: 'none', noteKey: 'note.twitch.resultType' } }
  }
  return {}
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
    sortOrder: { level: 'none', noteKey: 'note.nosort' },
  },
  buildUrl,
  parseUrl,
  dynamicSupport,
}
