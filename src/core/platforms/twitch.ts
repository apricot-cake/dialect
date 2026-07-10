import type { ConceptId, ConceptSupport, ParsedSearch, PlatformDef, QueryState, UrlPart } from '../types'
import { andTerms, words } from '../text'
import { lit, ParamParts } from '../urlParts'
import { hostMatches, leftoverParams, pathSegments } from '../parse'

// 出典: docs/operator-research.md(2026-07-03調査、実ブラウザ実測)
// 検索は /search?term=(あいまい一致)。引用符・除外などの演算子は一切効かない。
// type= で検索対象を切り替えられる(channels/categories/videos。実測で有効)。
// 「配信中のみ」のtypeは存在しない。言語絞り込みはURL不可(UIの内部状態のみ)。
function buildParts(state: QueryState): UrlPart[] | null {
  // 完全一致は引用符構文が無く、送っても素のワード検索に化けるだけ。
  // 意図を別の意味(ワード検索)に付け替えて送ることはしない=非対応として送らない
  const kw = andTerms(state)
  if (kw.length === 0) return null

  const params = new ParamParts()
  params.set('term', kw.join(' '), 'keywords')
  if (state.resultType === 'video') params.set('type', 'videos', 'resultType')
  else if (state.resultType === 'channel') params.set('type', 'channels', 'resultType')
  return [lit('https://www.twitch.tv/search'), ...params.parts('?')]
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
    exactPhrase: { level: 'none', noteKey: 'note.exactPhrase.dropped' },
    resultType: { level: 'full' },
    mediaOnly: { level: 'none', noteKey: 'note.videoOnly' },
    sortOrder: { level: 'none', noteKey: 'note.nosort' },
  },
  buildParts,
  parseUrl,
  dynamicSupport,
}
