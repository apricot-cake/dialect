import type { QueryState, TermRow } from './types'
import { defaultState } from './concepts'
import { termValues, words } from './text'

// 検索条件をURLクエリパラメータへ埋め込む(パーマリンク)。
// GitHub Pages でパスルーティングが使えないため、クエリパラメータ方式に固定。
// v= はフォーマットのバージョン。概念が増えたら後方互換のまま読めるようにする。
// v=3: 1枠=1語。kw= が「かつ」の枠1つ、or= が「または」行(枠をタブ区切りで連結)。
//      語は分割しないため、スペースを含むフレーズもそのまま保持される。
// v=1(旧): kw=/or= の語はスペース区切り、ph はスペース区切り+phm。読み込み時に変換する。
// 条件セットが2つ以上のときは v=2 で、セットごとのクエリ文字列を q= に入れ子にして繰り返す
const VERSION = '3'
const VERSION_LEGACY = '1'
const VERSION_SETS = '2'
const OR_SEPARATOR = '\t'

export function stateToParams(state: QueryState): URLSearchParams {
  const params = new URLSearchParams()
  params.set('v', VERSION)
  for (const row of state.terms) {
    const values = termValues(row)
    if (values.length === 1) params.append('kw', values[0])
    else if (values.length >= 2) params.append('or', values.join(OR_SEPARATOR))
  }
  if (state.exactPhrase.trim()) params.set('ph', state.exactPhrase.trim())
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
  const legacy = params.get('v') !== VERSION
  const terms: TermRow[] = []
  for (const s of params.getAll('kw')) {
    // 旧形式の kw はスペース区切りのAND。1語=1枠に分けると意味が保たれる
    if (legacy) terms.push(...words(s).map((w): TermRow => ({ texts: [w] })))
    else if (s.trim()) terms.push({ texts: [s.trim()] })
  }
  for (const s of params.getAll('or')) {
    const texts = legacy
      ? words(s)
      : s.split(OR_SEPARATOR).map((t) => t.trim()).filter(Boolean)
    if (texts.length > 0) terms.push({ texts })
  }
  const ph = (params.get('ph') ?? '').trim()
  if (legacy && params.get('phm') === 'any' && words(ph).length >= 2) {
    // 旧形式の「どれかを含む」複数語句は、ことば行の「または」へ引き継ぐ
    terms.push({ texts: words(ph) })
  } else {
    state.exactPhrase = ph
  }
  if (terms.length > 0) state.terms = terms
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

/**
 * 条件セット(セット内AND・セット間OR)をパラメータへ。
 * 1セットのときはフラットな形式そのまま(リンクが短い)
 */
export function setsToParams(sets: QueryState[]): URLSearchParams {
  if (sets.length === 1) return stateToParams(sets[0])
  const params = new URLSearchParams()
  params.set('v', VERSION_SETS)
  for (const state of sets) {
    // 各セットは自分のバージョンを持って入れ子になる(旧v2のvなし入れ子はv1形式)
    params.append('q', stateToParams(state).toString())
  }
  return params
}

export function paramsToSets(params: URLSearchParams): QueryState[] {
  const nested = params.getAll('q')
  if (nested.length > 0) {
    return nested.map((q) => {
      const inner = new URLSearchParams(q)
      if (!inner.has('v')) inner.set('v', VERSION_LEGACY)
      return paramsToState(inner)
    })
  }
  // v=1 (旧形式・単一セット) はそのまま1セットとして読む
  return [paramsToState(params)]
}

export function permalinkUrl(sets: QueryState[]): string {
  const base = `${location.origin}${location.pathname}`
  return `${base}?${setsToParams(sets).toString()}`
}
