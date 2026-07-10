import type { ConceptId, ConceptSupport, ParsedSearch, PlatformDef, QueryState, ResultType, SortOrder, UrlPart } from '../types'
import { andTerms, exactPhrases, words } from '../text'
import { lit, ParamParts, part } from '../urlParts'
import { hostIs, leftoverParams, pathSegments } from '../parse'

// 出典: 2026-07-08 実機確認(未ログイン、GUI操作+URL叩き)。search.bilibili.com はログイン不要で
// 検索できる(日本からのアクセスで地域ブロックなし)。タブ= 综合/all・视频/video・番剧/bangumi・
// 影视/pgc・直播/live・专栏/article・用户/upuser。並び順はタブごとに違い、動画系(all/video)=
// order=click(最多播放)/pubdate(最新发布)/dm(最多弹幕)/stow(最多收藏)、コラム(article)=
// pubdate/click(最多点击)/attention(最多喜欢)/scores(最多评论)、直播(live)=live_time(最新开播)、
// 番剧/影视/用户は並び順なし(用户の粉丝数・Lv順はDialectの概念に対応しないため見送り)。
// 「更多筛选」に日付範囲(pubtime_begin_s/pubtime_end_s=エポック秒、任意期間)と動画の長さ
// (duration=1:10分未満/2:10-30分/3:30-60分/4:60分超)がある(all/videoのみ。2026-06指定で
// 6/30が新着順の先頭になることを実測)。除外(-語)は文字として検索語に混入し(猫 -狗 で犬の
// 動画が残る)、引用符の完全一致も効かない(語順無視の緩い一致)ことを実測。
/** 探すものの種類 → 検索タブのパス。未対応の値と未指定は総合(all) */
const TAB_PATH: Partial<Record<ResultType, string>> = {
  video: 'video',
  bangumi: 'bangumi',
  pgc: 'pgc',
  live: 'live',
  article: 'article',
  channel: 'upuser',
}

/** タブごとの並び順 → order= 値。表に無い組み合わせは送らない(dynamicSupportで落とす) */
const ORDER_PARAM: Record<string, Partial<Record<SortOrder, string>>> = {
  all: { new: 'pubdate', top: 'click', danmaku: 'dm', favorites: 'stow' },
  video: { new: 'pubdate', top: 'click', danmaku: 'dm', favorites: 'stow' },
  article: { new: 'pubdate', top: 'click', likes: 'attention', comments: 'scores' },
  live: { new: 'live_time' },
  bangumi: {},
  pgc: {},
  upuser: {},
}

function tabOf(state: QueryState): string {
  return (state.resultType && TAB_PATH[state.resultType]) || 'all'
}

/** 'YYYY-MM-DD' を中国標準時(UTC+8)のエポック秒へ。endOfDay で同日 23:59:59 */
function cstEpoch(date: string, endOfDay: boolean): number {
  const [y, m, d] = date.split('-').map(Number)
  return Date.UTC(y, m - 1, d) / 1000 - 8 * 3600 + (endOfDay ? 86399 : 0)
}

function buildParts(state: QueryState): UrlPart[] | null {
  // 引用符の完全一致は効かないので、語句をそのままキーワードとして扱う(近似)
  const kw = andTerms(state)
  const phrases = exactPhrases(state)
  const terms = [...kw, ...phrases]
  if (terms.length === 0) return null

  const tab = tabOf(state)
  const params = new ParamParts()
  // keyword= は1ペアにAND語と完全一致語句が合流する複合断片
  const kwConcepts: ConceptId[] = []
  if (kw.length > 0) kwConcepts.push('keywords')
  if (phrases.length > 0) kwConcepts.push('exactPhrase')
  params.set('keyword', terms.join(' '), ...kwConcepts)
  const order = ORDER_PARAM[tab][state.sort]
  if (order) params.set('order', order, 'sortOrder')
  // 日付範囲と動画の長さは動画系タブ(総合・动画)だけが受け付ける
  if (tab === 'all' || tab === 'video') {
    if (state.videoLength === 'short') params.set('duration', '1', 'videoLength')
    else if (state.videoLength === 'medium') params.set('duration', '2', 'videoLength')
    else if (state.videoLength === 'long') params.set('duration', '4', 'videoLength')
    if (state.since) params.set('pubtime_begin_s', String(cstEpoch(state.since, false)), 'period')
    if (state.until) params.set('pubtime_end_s', String(cstEpoch(state.until, true)), 'period')
  }
  return [
    lit('https://search.bilibili.com/'),
    // タブ切り替えのパスは「探すもの」の指定が生む断片(既定の all は無帰属。
    // 未対応の値で all に落ちたときも既定のままなので帰属させない)
    state.resultType && TAB_PATH[state.resultType] ? part(tab, 'resultType') : lit(tab),
    ...params.parts('?'),
  ]
}

function dynamicSupport(state: QueryState): Partial<Record<ConceptId, ConceptSupport>> {
  const overrides: Partial<Record<ConceptId, ConceptSupport>> = {}
  if (state.resultType && !TAB_PATH[state.resultType]) {
    overrides.resultType = { level: 'none', noteKey: 'note.resultType.otherSite' }
  }
  const tab = tabOf(state)
  if (state.sort !== 'auto' && !(state.sort in ORDER_PARAM[tab])) {
    // 急上昇はbilibiliのどのタブにも無い。それ以外はタブを変えれば使える並び順
    overrides.sortOrder = {
      level: 'none',
      noteKey: state.sort === 'hot' ? 'note.sortOrder.otherSite' : 'note.bilibili.tabSort',
    }
  }
  if (tab !== 'all' && tab !== 'video') {
    if (state.videoLength) {
      overrides.videoLength = { level: 'none', noteKey: 'note.bilibili.tabOnly' }
    }
    if (state.since || state.until) {
      overrides.period = { level: 'none', noteKey: 'note.bilibili.tabOnly' }
    }
  }
  return overrides
}

/** タブのパス → resultType(総合は既定='') */
const TAB_RESULT_TYPE: Record<string, QueryState['resultType']> = {
  all: '',
  video: 'video',
  bangumi: 'bangumi',
  pgc: 'pgc',
  live: 'live',
  article: 'article',
  upuser: 'channel',
}

/** 中国標準時(UTC+8)のエポック秒 → YYYY-MM-DD(cstEpochの逆方向) */
function isoFromCstEpoch(sec: number): string {
  return new Date((sec + 8 * 3600) * 1000).toISOString().slice(0, 10)
}

// 逆翻訳: search.bilibili.com/{タブ}?keyword=…。order=はタブごとの対応表を逆引きする
function parseUrl(url: URL): ParsedSearch | null {
  if (!hostIs(url, 'search.bilibili.com')) return null
  const segs = pathSegments(url)
  const tab = segs[0] ?? 'all'
  if (!(tab in TAB_RESULT_TYPE)) return null
  const keyword = url.searchParams.get('keyword')
  if (!keyword) return null

  const patch: Partial<QueryState> = {}
  const ignored: string[] = []
  if (TAB_RESULT_TYPE[tab]) patch.resultType = TAB_RESULT_TYPE[tab]
  const terms = words(keyword)
  if (terms.length > 0) patch.terms = terms

  const order = url.searchParams.get('order')
  if (order !== null) {
    const sort = Object.entries(ORDER_PARAM[tab]).find(([, v]) => v === order)?.[0]
    if (sort) patch.sort = sort as SortOrder
    else ignored.push(`order=${order}`)
  }
  const duration = url.searchParams.get('duration')
  if (duration === '1') patch.videoLength = 'short'
  else if (duration === '2') patch.videoLength = 'medium'
  else if (duration === '4') patch.videoLength = 'long'
  else if (duration !== null) ignored.push(`duration=${duration}`)
  const begin = url.searchParams.get('pubtime_begin_s')
  if (begin !== null) {
    if (/^\d+$/.test(begin)) patch.since = isoFromCstEpoch(Number(begin))
    else ignored.push(`pubtime_begin_s=${begin}`)
  }
  const end = url.searchParams.get('pubtime_end_s')
  if (end !== null) {
    if (/^\d+$/.test(end)) patch.until = isoFromCstEpoch(Number(end))
    else ignored.push(`pubtime_end_s=${end}`)
  }
  leftoverParams(url, new Set(['keyword', 'order', 'duration', 'pubtime_begin_s', 'pubtime_end_s']), ignored)
  return { patch, ignored }
}

export const bilibili: PlatformDef = {
  id: 'bilibili',
  name: 'bilibili',
  group: 'video',
  brandColor: '#00A1D6',
  requiresLogin: false,
  googleSite: 'bilibili.com',
  support: {
    keywords: { level: 'partial', noteKey: 'note.loose.and' },
    exactPhrase: { level: 'partial', noteKey: 'note.loose.exact' },
    exclude: { level: 'none', noteKey: 'note.exclude.literal' },
    resultType: { level: 'full' },
    sortOrder: { level: 'full' },
    videoLength: { level: 'partial', noteKey: 'note.bilibili.videoLength' },
    period: { level: 'full' },
  },
  buildParts,
  parseUrl,
  dynamicSupport,
}
