import type { QueryState, TermRow } from './types'
import { defaultState } from './concepts'

// 検索条件をURLクエリパラメータへ埋め込む(パーマリンク)。
// GitHub Pages でパスルーティングが使えないため、クエリパラメータ方式に固定。
// v= はフォーマットのバージョン。概念が増えたら後方互換のまま読めるようにする。
const VERSION = '1'

export function stateToParams(state: QueryState): URLSearchParams {
  const params = new URLSearchParams()
  params.set('v', VERSION)
  // ことば行は1行=1パラメータの繰り返し。「すべて含む」行は kw=、「どれかを含む」行は or=。
  // 旧形式(kw= 単一 + or= 繰り返し)もこの読み書きにそのまま収まる。
  // 復元時は kw 行が先にまとまるが、行どうしはANDなので意味は変わらない
  for (const row of state.terms) {
    if (row.text.trim()) {
      params.append(row.mode === 'any' ? 'or' : 'kw', row.text.trim())
    }
  }
  if (state.exactPhrase.trim()) {
    params.set('ph', state.exactPhrase.trim())
    if (state.exactPhraseMode === 'any') params.set('phm', 'any')
  }
  if (state.exclude.trim()) params.set('ex', state.exclude.trim())
  if (state.titleOnly) params.set('title', '1')
  if (state.fromUser.trim()) params.set('fr', state.fromUser.trim())
  if (state.excludeUser.trim()) params.set('exfr', state.excludeUser.trim())
  if (state.toUser.trim()) params.set('to', state.toUser.trim())
  if (state.mentionsUser.trim()) params.set('men', state.mentionsUser.trim())
  if (state.subreddit.trim()) params.set('sub', state.subreddit.trim())
  if (state.domain.trim()) params.set('dom', state.domain.trim())
  if (state.hashtag.trim()) {
    params.set('tag', state.hashtag.trim())
    if (state.hashtagMode === 'any') params.set('tagm', 'any')
  }
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
  // 既定(新しい順)のときは省略。旧形式(v1初期)の sort=top もそのまま人気順として読める
  if (state.sort !== 'new') params.set('sort', state.sort)
  return params
}

export function paramsToState(params: URLSearchParams): QueryState {
  const state = defaultState()
  if (!params.has('v')) return state
  const terms: TermRow[] = [
    ...params
      .getAll('kw')
      .filter((s) => s.trim())
      .map((text): TermRow => ({ text, mode: 'all' })),
    ...params
      .getAll('or')
      .filter((s) => s.trim())
      .map((text): TermRow => ({ text, mode: 'any' })),
  ]
  if (terms.length > 0) state.terms = terms
  state.exactPhrase = params.get('ph') ?? ''
  state.exactPhraseMode = params.get('phm') === 'any' ? 'any' : 'all'
  state.exclude = params.get('ex') ?? ''
  state.titleOnly = params.get('title') === '1'
  state.fromUser = params.get('fr') ?? ''
  state.excludeUser = params.get('exfr') ?? ''
  state.toUser = params.get('to') ?? ''
  state.mentionsUser = params.get('men') ?? ''
  state.subreddit = params.get('sub') ?? ''
  state.domain = params.get('dom') ?? ''
  state.hashtag = params.get('tag') ?? ''
  state.hashtagMode = params.get('tagm') === 'any' ? 'any' : 'all'
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
  const sort = params.get('sort')
  if (sort === 'top' || sort === 'auto') state.sort = sort
  return state
}

export function permalinkUrl(state: QueryState): string {
  const base = `${location.origin}${location.pathname}`
  return `${base}?${stateToParams(state).toString()}`
}
