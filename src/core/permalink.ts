import type { QueryState } from './types'
import { defaultState } from './concepts'

// 検索条件をURLクエリパラメータへ埋め込む(パーマリンク)。
// GitHub Pages でパスルーティングが使えないため、クエリパラメータ方式に固定。
// v= はフォーマットのバージョン。概念が増えたら後方互換のまま読めるようにする。
const VERSION = '1'

export function stateToParams(state: QueryState): URLSearchParams {
  const params = new URLSearchParams()
  params.set('v', VERSION)
  if (state.keywords.trim()) params.set('kw', state.keywords.trim())
  // OR グループは or= の繰り返しで1行=1パラメータ(旧形式の単一 or= もそのまま読める)
  for (const group of state.orGroups) {
    if (group.trim()) params.append('or', group.trim())
  }
  if (state.exactPhrase.trim()) params.set('ph', state.exactPhrase.trim())
  if (state.exclude.trim()) params.set('ex', state.exclude.trim())
  if (state.titleOnly) params.set('title', '1')
  if (state.fromUser.trim()) params.set('fr', state.fromUser.trim())
  if (state.toUser.trim()) params.set('to', state.toUser.trim())
  if (state.mentionsUser.trim()) params.set('men', state.mentionsUser.trim())
  if (state.subreddit.trim()) params.set('sub', state.subreddit.trim())
  if (state.domain.trim()) params.set('dom', state.domain.trim())
  if (state.hashtag.trim()) params.set('tag', state.hashtag.trim())
  if (state.since) params.set('since', state.since)
  if (state.until) params.set('until', state.until)
  if (state.mediaOnly) params.set('media', '1')
  if (state.videoLength) params.set('vlen', state.videoLength)
  if (state.linksOnly) params.set('links', '1')
  if (state.verifiedOnly) params.set('ver', '1')
  if (state.excludeReplies) params.set('norep', '1')
  if (state.minLikes.trim()) params.set('likes', state.minLikes.trim())
  if (state.minReposts.trim()) params.set('rts', state.minReposts.trim())
  if (state.japaneseOnly) params.set('ja', '1')
  if (!state.newestFirst) params.set('sort', 'top')
  return params
}

export function paramsToState(params: URLSearchParams): QueryState {
  const state = defaultState()
  if (!params.has('v')) return state
  state.keywords = params.get('kw') ?? ''
  const orGroups = params.getAll('or').filter((g) => g.trim())
  if (orGroups.length > 0) state.orGroups = orGroups
  state.exactPhrase = params.get('ph') ?? ''
  state.exclude = params.get('ex') ?? ''
  state.titleOnly = params.get('title') === '1'
  state.fromUser = params.get('fr') ?? ''
  state.toUser = params.get('to') ?? ''
  state.mentionsUser = params.get('men') ?? ''
  state.subreddit = params.get('sub') ?? ''
  state.domain = params.get('dom') ?? ''
  state.hashtag = params.get('tag') ?? ''
  state.since = params.get('since') ?? ''
  state.until = params.get('until') ?? ''
  state.mediaOnly = params.get('media') === '1'
  const vlen = params.get('vlen')
  if (vlen === 'short' || vlen === 'medium' || vlen === 'long') {
    state.videoLength = vlen
  }
  state.linksOnly = params.get('links') === '1'
  state.verifiedOnly = params.get('ver') === '1'
  state.excludeReplies = params.get('norep') === '1'
  state.minLikes = params.get('likes') ?? ''
  state.minReposts = params.get('rts') ?? ''
  state.japaneseOnly = params.get('ja') === '1'
  state.newestFirst = params.get('sort') !== 'top'
  return state
}

export function permalinkUrl(state: QueryState): string {
  const base = `${location.origin}${location.pathname}`
  return `${base}?${stateToParams(state).toString()}`
}
