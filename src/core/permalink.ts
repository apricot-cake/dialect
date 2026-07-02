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
  if (state.exactPhrase.trim()) params.set('ph', state.exactPhrase.trim())
  if (state.exclude.trim()) params.set('ex', state.exclude.trim())
  if (state.fromUser.trim()) params.set('fr', state.fromUser.trim())
  if (state.hashtag.trim()) params.set('tag', state.hashtag.trim())
  if (state.since) params.set('since', state.since)
  if (state.until) params.set('until', state.until)
  if (state.mediaOnly) params.set('media', '1')
  if (state.japaneseOnly) params.set('ja', '1')
  if (!state.newestFirst) params.set('sort', 'top')
  return params
}

export function paramsToState(params: URLSearchParams): QueryState {
  const state = defaultState()
  if (!params.has('v')) return state
  state.keywords = params.get('kw') ?? ''
  state.exactPhrase = params.get('ph') ?? ''
  state.exclude = params.get('ex') ?? ''
  state.fromUser = params.get('fr') ?? ''
  state.hashtag = params.get('tag') ?? ''
  state.since = params.get('since') ?? ''
  state.until = params.get('until') ?? ''
  state.mediaOnly = params.get('media') === '1'
  state.japaneseOnly = params.get('ja') === '1'
  state.newestFirst = params.get('sort') !== 'top'
  return state
}

export function permalinkUrl(state: QueryState): string {
  const base = `${location.origin}${location.pathname}`
  return `${base}?${stateToParams(state).toString()}`
}
