import type {
  FantiaCategory,
  GithubLicense,
  GoogleFileType,
  GoogleLicense,
  NicoGenre,
  PostLanguage,
  QueryState,
} from './types'
import {
  FANTIA_CATEGORIES,
  GITHUB_LICENSES,
  GOOGLE_FILE_TYPES,
  NICO_GENRES,
  POST_LANGUAGE_CODES,
} from './types'
import { defaultState } from './concepts'
import { words } from './text'

// 検索条件をURLクエリパラメータへ埋め込む(パーマリンク)。
// GitHub Pages でパスルーティングが使えないため、クエリパラメータ方式に固定。
// v= はフォーマットのバージョン。概念が増えたら後方互換のまま読めるようにする。
// v=4: 並び順の既定が「指定なし(auto)」になり、新しい順(new)も明示的に sort=new で持つ。
// v=3: 1要素=1語で kw= の繰り返し。語は分割しないため、スペースを含むフレーズも保持される。
//      sort= の省略は「新しい順」を意味していた(読み込みで補う)
// 廃止された古い形式も読み込みだけは対応する:
//   v=1: kw=/or= の語はスペース区切り。読み込み時に変換する
//   v=2: 条件セット(セット間OR)。セットごとのクエリ文字列が q= に入れ子で並ぶ。
//        条件セット廃止後は先頭のセットだけを読む
//   or= / tagm=any: 「または」指定。ORは廃止したため、各グループの先頭の語だけを残す
const VERSION = '4'
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
  // 廃止済みの or= とは別物(スコープ限定OR。旧「または」指定の復活ではない)
  if (state.keywordsOr.trim()) params.set('kwor', state.keywordsOr.trim())
  if (state.exclude.trim()) params.set('ex', state.exclude.trim())
  if (state.titleOnly) params.set('title', '1')
  if (state.exactTag) params.set('xtag', '1')
  if (state.tagTitleCaption) params.set('ttc', '1')
  if (state.fromUser.trim()) params.set('fr', state.fromUser.trim())
  if (state.excludeUser.trim()) params.set('exfr', state.excludeUser.trim())
  if (state.toUser.trim()) params.set('to', state.toUser.trim())
  if (state.mentionsUser.trim()) params.set('men', state.mentionsUser.trim())
  if (state.excludeMentions.trim()) params.set('exmen', state.excludeMentions.trim())
  if (state.subreddit.trim()) params.set('sub', state.subreddit.trim())
  if (state.domain.trim()) params.set('dom', state.domain.trim())
  if (state.excludeDomain.trim()) params.set('exdom', state.excludeDomain.trim())
  if (state.linkUrl.trim()) params.set('url', state.linkUrl.trim())
  if (state.excludeLinkUrl.trim()) params.set('exurl', state.excludeLinkUrl.trim())
  if (state.fileType) params.set('ftype', state.fileType)
  if (state.region.trim()) params.set('reg', state.region.trim())
  if (state.license) params.set('lic', state.license)
  if (state.exactMatchMode) params.set('exact', '1')
  if (state.codeLanguage.trim()) params.set('clang', state.codeLanguage.trim())
  if (state.minStars.trim()) params.set('stars', state.minStars.trim())
  if (state.minStocks.trim()) params.set('stocks', state.minStocks.trim())
  if (state.semanticSearch) params.set('sem', '1')
  if (state.xList.trim()) params.set('xlist', state.xList.trim())
  if (state.hashtag.trim()) params.set('tag', state.hashtag.trim())
  if (state.hashtagOr.trim()) params.set('tagor', state.hashtagOr.trim())
  if (state.excludeHashtag.trim()) params.set('extag', state.excludeHashtag.trim())
  if (state.since) params.set('since', state.since)
  if (state.until) params.set('until', state.until)
  if (state.mediaOnly) params.set('media', '1')
  if (state.videoOnly) params.set('vidon', '1')
  if (state.videoLength) params.set('vlen', state.videoLength)
  if (state.linksOnly) params.set('links', '1')
  if (state.verifiedOnly) params.set('ver', '1')
  if (state.excludeReplies) params.set('norep', '1')
  if (state.repliesOnly) params.set('rponly', '1')
  if (state.followingOnly) params.set('follo', '1')
  if (state.liveOnly) params.set('live', '1')
  if (state.fourK) params.set('k4', '1')
  if (state.hdOnly) params.set('hd', '1')
  if (state.captionsOnly) params.set('cap', '1')
  if (state.creativeCommons) params.set('cc', '1')
  if (state.threeSixty) params.set('t360', '1')
  if (state.vr180) params.set('vr180', '1')
  if (state.threeD) params.set('t3d', '1')
  if (state.hdr) params.set('hdr', '1')
  if (state.locationOnly) params.set('loc', '1')
  if (state.purchased) params.set('buy', '1')
  if (state.minLikes.trim()) params.set('likes', state.minLikes.trim())
  if (state.minReposts.trim()) params.set('rts', state.minReposts.trim())
  if (state.minReplies.trim()) params.set('reps', state.minReplies.trim())
  if (state.language) params.set('lang', state.language)
  if (state.workType) params.set('wt', state.workType)
  if (state.genre) params.set('genre', state.genre)
  if (state.nicoKind) params.set('nkind', state.nicoKind)
  if (state.paidOnly) params.set('paid', '1')
  if (state.fantiaCategory) params.set('fcat', state.fantiaCategory)
  if (state.fantiaAudience) params.set('faud', state.fantiaAudience)
  if (state.safeSearchOff) params.set('nsafe', '1')
  if (state.resultType) params.set('rt', state.resultType)
  if (state.pixivPopular) params.set('pxu', state.pixivPopular)
  if (state.ageRating) params.set('age', state.ageRating)
  if (state.excludeAi) params.set('noai', '1')
  if (state.minForks.trim()) params.set('forks', state.minForks.trim())
  if (state.minSizeKb.trim()) params.set('size', state.minSizeKb.trim())
  if (state.pushedSince) params.set('psince', state.pushedSince)
  if (state.pushedUntil) params.set('puntil', state.pushedUntil)
  if (state.codeLicense) params.set('glic', state.codeLicense)
  if (state.includeForks) params.set('fork', state.includeForks)
  if (state.visibility) params.set('vis', state.visibility)
  if (state.topic.trim()) params.set('topic', state.topic.trim())
  if (state.searchInName) params.set('inname', '1')
  if (state.searchInDescription) params.set('indesc', '1')
  if (state.searchInReadme) params.set('inreadme', '1')
  if (state.archived) params.set('arch', state.archived)
  if (state.mirror) params.set('mirror', state.mirror)
  if (state.org.trim()) params.set('org', state.org.trim())
  if (state.fileExtension.trim()) params.set('ext', state.fileExtension.trim())
  if (state.filePath.trim()) params.set('fpath', state.filePath.trim())
  if (state.fileName.trim()) params.set('fname', state.fileName.trim())
  if (state.issueState) params.set('istate', state.issueState)
  if (state.issueReason) params.set('ireason', state.issueReason)
  if (state.minComments.trim()) params.set('comments', state.minComments.trim())
  if (state.label.trim()) params.set('label', state.label.trim())
  if (state.assignee.trim()) params.set('assignee', state.assignee.trim())
  if (state.updatedSince) params.set('usince', state.updatedSince)
  if (state.updatedUntil) params.set('uuntil', state.updatedUntil)
  if (state.fullName.trim()) params.set('fullname', state.fullName.trim())
  if (state.userLocation.trim()) params.set('uloc', state.userLocation.trim())
  if (state.minFollowers.trim()) params.set('followers', state.minFollowers.trim())
  if (state.minRepos.trim()) params.set('repos', state.minRepos.trim())
  // 既定の「指定なし(auto)」のときは省略。条件に数えない(activeConcepts)選択をURLに
  // 出すと、他条件ゼロでも hasConditions が立ち、共有先で並び順バーだけ復元されない
  // 非対称が起きるため。v4からは新しい順(new)も意図的な選択なので明示的に持つ
  if (state.sort !== 'auto') params.set('sort', state.sort)
  return params
}

/** 1条件分のパラメータを読む。廃止された「または」指定(or=)は先頭の語だけ残す */
function paramsToState(params: URLSearchParams): QueryState {
  const state = defaultState()
  if (!params.has('v')) return state
  const version = Number.parseInt(params.get('v') ?? '1', 10) || 1
  // v1/v2 だけが「kw がスペース区切り」の旧形式。v3以降は 1要素=1語
  const legacy = version < 3
  const terms: string[] = []
  for (const s of params.getAll('kw')) {
    // 旧形式の kw はスペース区切りのAND。1語=1要素に分けると意味が保たれる
    if (legacy) terms.push(...words(s))
    else if (s.trim()) terms.push(s.trim())
  }
  for (const s of params.getAll('or')) {
    const texts = legacy
      ? words(s)
      : s
          .split(OR_SEPARATOR)
          .map((t) => t.trim())
          .filter(Boolean)
    if (texts.length > 0) terms.push(texts[0])
  }
  const phrases = params
    .getAll('ph')
    .map((s) => s.trim())
    .filter(Boolean)
  if (legacy && params.get('phm') === 'any' && words(phrases[0] ?? '').length >= 2) {
    // 旧形式の「どれかを含む」複数語句も先頭だけ残す
    terms.push(words(phrases[0])[0])
  } else if (phrases.length > 0) {
    state.exactPhrase = phrases
  }
  if (terms.length > 0) state.terms = terms
  state.keywordsOr = params.get('kwor') ?? ''
  state.exclude = params.get('ex') ?? ''
  state.titleOnly = params.get('title') === '1'
  state.exactTag = params.get('xtag') === '1'
  state.tagTitleCaption = params.get('ttc') === '1'
  state.fromUser = params.get('fr') ?? ''
  state.excludeUser = params.get('exfr') ?? ''
  state.toUser = params.get('to') ?? ''
  state.mentionsUser = params.get('men') ?? ''
  state.excludeMentions = params.get('exmen') ?? ''
  state.subreddit = params.get('sub') ?? ''
  state.domain = params.get('dom') ?? ''
  state.excludeDomain = params.get('exdom') ?? ''
  state.linkUrl = params.get('url') ?? ''
  state.excludeLinkUrl = params.get('exurl') ?? ''
  const ftype = params.get('ftype')
  if (ftype && (GOOGLE_FILE_TYPES as readonly string[]).includes(ftype)) {
    state.fileType = ftype as GoogleFileType
  }
  state.region = params.get('reg') ?? ''
  const lic = params.get('lic')
  if (lic === 'f' || lic === 'fc' || lic === 'fm' || lic === 'fmc')
    state.license = lic as GoogleLicense
  state.exactMatchMode = params.get('exact') === '1'
  state.codeLanguage = params.get('clang') ?? ''
  state.minStars = params.get('stars') ?? ''
  state.minStocks = params.get('stocks') ?? ''
  state.semanticSearch = params.get('sem') === '1'
  state.xList = params.get('xlist') ?? ''
  state.hashtag = params.get('tag') ?? ''
  state.hashtagOr = params.get('tagor') ?? ''
  state.excludeHashtag = params.get('extag') ?? ''
  state.since = params.get('since') ?? ''
  state.until = params.get('until') ?? ''
  state.mediaOnly = params.get('media') === '1'
  state.videoOnly = params.get('vidon') === '1'
  const vlen = params.get('vlen')
  if (vlen === 'short' || vlen === 'medium' || vlen === 'long') {
    state.videoLength = vlen
  }
  state.linksOnly = params.get('links') === '1'
  state.verifiedOnly = params.get('ver') === '1'
  state.excludeReplies = params.get('norep') === '1'
  state.repliesOnly = params.get('rponly') === '1'
  state.followingOnly = params.get('follo') === '1'
  state.liveOnly = params.get('live') === '1'
  state.fourK = params.get('k4') === '1'
  state.hdOnly = params.get('hd') === '1'
  state.captionsOnly = params.get('cap') === '1'
  state.creativeCommons = params.get('cc') === '1'
  state.threeSixty = params.get('t360') === '1'
  state.vr180 = params.get('vr180') === '1'
  state.threeD = params.get('t3d') === '1'
  state.hdr = params.get('hdr') === '1'
  state.locationOnly = params.get('loc') === '1'
  state.purchased = params.get('buy') === '1'
  state.minLikes = params.get('likes') ?? ''
  state.minReposts = params.get('rts') ?? ''
  state.minReplies = params.get('reps') ?? ''
  const lang = params.get('lang')
  if (lang && (POST_LANGUAGE_CODES as readonly string[]).includes(lang)) {
    state.language = lang as PostLanguage
  }
  // 旧形式(「日本語の投稿だけ」トグル時代)の ja=1 は日本語指定として読む
  else if (params.get('ja') === '1') state.language = 'ja'
  const wt = params.get('wt')
  if (wt === 'illust' || wt === 'manga' || wt === 'ugoira' || wt === 'novel') {
    state.workType = wt
  }
  const genre = params.get('genre')
  if (genre && (NICO_GENRES as readonly string[]).includes(genre)) {
    state.genre = genre as NicoGenre
  }
  const nkind = params.get('nkind')
  if (nkind === 'user' || nkind === 'channel') state.nicoKind = nkind
  state.paidOnly = params.get('paid') === '1'
  const fcat = params.get('fcat')
  if (fcat && (FANTIA_CATEGORIES as readonly string[]).includes(fcat)) {
    state.fantiaCategory = fcat as FantiaCategory
  }
  const faud = params.get('faud')
  if (faud === 'male' || faud === 'female') state.fantiaAudience = faud
  state.safeSearchOff = params.get('nsafe') === '1'
  const rt = params.get('rt')
  if (
    rt === 'video' ||
    rt === 'short' ||
    rt === 'channel' ||
    rt === 'playlist' ||
    rt === 'posts' ||
    rt === 'communities' ||
    rt === 'comments' ||
    rt === 'media' ||
    rt === 'people' ||
    rt === 'board' ||
    rt === 'bangumi' ||
    rt === 'pgc' ||
    rt === 'live' ||
    rt === 'article' ||
    rt === 'series' ||
    rt === 'circle' ||
    rt === 'images' ||
    rt === 'shopping' ||
    rt === 'news' ||
    rt === 'web' ||
    rt === 'books' ||
    rt === 'repositories' ||
    rt === 'code' ||
    rt === 'issues' ||
    rt === 'pullRequests' ||
    rt === 'discussions' ||
    rt === 'questions' ||
    rt === 'scraps' ||
    rt === 'publications'
  ) {
    state.resultType = rt
  }
  const pxu = params.get('pxu')
  if (pxu === '00users' || pxu === '000users' || pxu === '0000users') {
    state.pixivPopular = pxu
  }
  const age = params.get('age')
  if (age === 'safe' || age === 'r18') state.ageRating = age
  state.excludeAi = params.get('noai') === '1'
  state.minForks = params.get('forks') ?? ''
  state.minSizeKb = params.get('size') ?? ''
  state.pushedSince = params.get('psince') ?? ''
  state.pushedUntil = params.get('puntil') ?? ''
  const glic = params.get('glic')
  if (glic && (GITHUB_LICENSES as readonly string[]).includes(glic)) {
    state.codeLicense = glic as GithubLicense
  }
  const fork = params.get('fork')
  if (fork === 'true' || fork === 'only') state.includeForks = fork
  const vis = params.get('vis')
  if (vis === 'public' || vis === 'private') state.visibility = vis
  state.topic = params.get('topic') ?? ''
  state.searchInName = params.get('inname') === '1'
  state.searchInDescription = params.get('indesc') === '1'
  state.searchInReadme = params.get('inreadme') === '1'
  const arch = params.get('arch')
  if (arch === 'true' || arch === 'false') state.archived = arch
  const mirror = params.get('mirror')
  if (mirror === 'true' || mirror === 'false') state.mirror = mirror
  state.org = params.get('org') ?? ''
  state.fileExtension = params.get('ext') ?? ''
  state.filePath = params.get('fpath') ?? ''
  state.fileName = params.get('fname') ?? ''
  const istate = params.get('istate')
  if (istate === 'open' || istate === 'closed') state.issueState = istate
  const ireason = params.get('ireason')
  if (ireason === 'completed' || ireason === 'not planned' || ireason === 'reopened') {
    state.issueReason = ireason
  }
  state.minComments = params.get('comments') ?? ''
  state.label = params.get('label') ?? ''
  state.assignee = params.get('assignee') ?? ''
  state.updatedSince = params.get('usince') ?? ''
  state.updatedUntil = params.get('uuntil') ?? ''
  state.fullName = params.get('fullname') ?? ''
  state.userLocation = params.get('uloc') ?? ''
  state.minFollowers = params.get('followers') ?? ''
  state.minRepos = params.get('repos') ?? ''
  const sort = params.get('sort')
  if (
    sort === 'new' ||
    sort === 'top' ||
    sort === 'hot' ||
    sort === 'comments' ||
    sort === 'danmaku' ||
    sort === 'favorites' ||
    sort === 'likes' ||
    sort === 'commentDate' ||
    sort === 'videoCount' ||
    sort === 'videoAdded' ||
    sort === 'followerCount' ||
    sort === 'liveCount' ||
    sort === 'auto'
  ) {
    state.sort = sort
  } else if (version < 4) {
    // v3以前は sort 省略=「新しい順」が既定だった。読み込みで当時の意味を保つ
    state.sort = 'new'
  }
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
