import type { QueryState } from './types'
import { defaultState } from './concepts'
import { words } from './text'

// 検索条件をURLクエリパラメータへ埋め込む(パーマリンク)。
// GitHub Pages でパスルーティングが使えないため、クエリパラメータ方式に固定。
// v= はフォーマットのバージョン。概念が増えたら後方互換のまま読めるようにする。
// v=3: 1要素=1語で kw= の繰り返し。語は分割しないため、スペースを含むフレーズも保持される。
// 廃止された古い形式も読み込みだけは対応する:
//   v=1: kw=/or= の語はスペース区切り。読み込み時に変換する
//   v=2: 条件セット(セット間OR)。セットごとのクエリ文字列が q= に入れ子で並ぶ。
//        条件セット廃止後は先頭のセットだけを読む
//   or= / tagm=any: 「または」指定。ORは廃止したため、各グループの先頭の語だけを残す
const VERSION = '3'
const VERSION_LEGACY = '1'
const OR_SEPARATOR = '\t'

export function stateToParams(state: QueryState): URLSearchParams {
  const params = new URLSearchParams()
  params.set('v', VERSION)
  for (const term of state.terms) {
    if (term.trim()) params.append('kw', term.trim())
  }
  // 完全一致も1枠=1語句で ph= を繰り返す(kw と同じ形式)
  for (const phrase of state.exactPhrase) {
    if (phrase.trim()) params.append('ph', phrase.trim())
  }
  if (state.exclude.trim()) params.set('ex', state.exclude.trim())
  if (state.titleOnly) params.set('title', '1')
  if (state.fromUser.trim()) params.set('fr', state.fromUser.trim())
  if (state.excludeUser.trim()) params.set('exfr', state.excludeUser.trim())
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
  if (state.liveOnly) params.set('live', '1')
  if (state.minLikes.trim()) params.set('likes', state.minLikes.trim())
  if (state.minReposts.trim()) params.set('rts', state.minReposts.trim())
  if (state.language) params.set('lang', state.language)
  if (state.workType) params.set('wt', state.workType)
  if (state.resultType) params.set('rt', state.resultType)
  if (state.pixivPopular) params.set('pxu', state.pixivPopular)
  if (state.ageRating) params.set('age', state.ageRating)
  if (state.excludeAi) params.set('noai', '1')
  // 既定(新しい順)のときは省略。旧形式(v1初期)の sort=top もそのまま人気順として読める。
  // おまかせ(auto)は「サイト任せ=既定と機能的に等価」で条件に数えない(activeConcepts)ため
  // URLにも出さない。出すと他条件ゼロでも hasConditions が立ち、共有先で並び順バーだけ
  // 復元されない非対称が起きる
  if (state.sort !== 'new' && state.sort !== 'auto') params.set('sort', state.sort)
  return params
}

/** 1条件分のパラメータを読む。廃止された「または」指定(or=)は先頭の語だけ残す */
function paramsToState(params: URLSearchParams): QueryState {
  const state = defaultState()
  if (!params.has('v')) return state
  const legacy = params.get('v') !== VERSION
  const terms: string[] = []
  for (const s of params.getAll('kw')) {
    // 旧形式の kw はスペース区切りのAND。1語=1要素に分けると意味が保たれる
    if (legacy) terms.push(...words(s))
    else if (s.trim()) terms.push(s.trim())
  }
  for (const s of params.getAll('or')) {
    const texts = legacy
      ? words(s)
      : s.split(OR_SEPARATOR).map((t) => t.trim()).filter(Boolean)
    if (texts.length > 0) terms.push(texts[0])
  }
  const phrases = params.getAll('ph').map((s) => s.trim()).filter(Boolean)
  if (legacy && params.get('phm') === 'any' && words(phrases[0] ?? '').length >= 2) {
    // 旧形式の「どれかを含む」複数語句も先頭だけ残す
    terms.push(words(phrases[0])[0])
  } else if (phrases.length > 0) {
    state.exactPhrase = phrases
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
  state.liveOnly = params.get('live') === '1'
  state.minLikes = params.get('likes') ?? ''
  state.minReposts = params.get('rts') ?? ''
  const lang = params.get('lang')
  if (lang === 'ja' || lang === 'en') state.language = lang
  // 旧形式(「日本語の投稿だけ」トグル時代)の ja=1 は日本語指定として読む
  else if (params.get('ja') === '1') state.language = 'ja'
  const wt = params.get('wt')
  if (wt === 'illust' || wt === 'manga') state.workType = wt
  const rt = params.get('rt')
  if (rt === 'video' || rt === 'short' || rt === 'channel' || rt === 'playlist') {
    state.resultType = rt
  }
  const pxu = params.get('pxu')
  if (pxu === '00users' || pxu === '000users' || pxu === '0000users') {
    state.pixivPopular = pxu
  }
  const age = params.get('age')
  if (age === 'safe' || age === 'r18') state.ageRating = age
  state.excludeAi = params.get('noai') === '1'
  const sort = params.get('sort')
  if (sort === 'top' || sort === 'hot' || sort === 'auto') state.sort = sort
  return state
}

/** パラメータから条件を読む。旧v2(条件セット)のリンクは先頭のセットだけを読む */
export function paramsToQuery(params: URLSearchParams): QueryState {
  const nested = params.getAll('q')
  if (nested.length > 0) {
    // 各セットは自分のバージョンを持って入れ子になっていた(旧v2のvなし入れ子はv1形式)
    const inner = new URLSearchParams(nested[0])
    if (!inner.has('v')) inner.set('v', VERSION_LEGACY)
    return paramsToState(inner)
  }
  return paramsToState(params)
}

export function permalinkUrl(state: QueryState): string {
  const base = `${location.origin}${location.pathname}`
  return `${base}?${stateToParams(state).toString()}`
}
