import type { ConceptId, ConceptSupport, PlatformDef, QueryState, ResultType, SortOrder } from '../types'
import { andTerms, exactPhrases } from '../text'

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

function buildUrl(state: QueryState): string | null {
  // 引用符の完全一致は効かないので、語句をそのままキーワードとして扱う(近似)
  const terms = [...andTerms(state), ...exactPhrases(state)]
  if (terms.length === 0) return null

  const tab = tabOf(state)
  const params = new URLSearchParams()
  params.set('keyword', terms.join(' '))
  const order = ORDER_PARAM[tab][state.sort]
  if (order) params.set('order', order)
  // 日付範囲と動画の長さは動画系タブ(総合・动画)だけが受け付ける
  if (tab === 'all' || tab === 'video') {
    if (state.videoLength === 'short') params.set('duration', '1')
    else if (state.videoLength === 'medium') params.set('duration', '2')
    else if (state.videoLength === 'long') params.set('duration', '4')
    if (state.since) params.set('pubtime_begin_s', String(cstEpoch(state.since, false)))
    if (state.until) params.set('pubtime_end_s', String(cstEpoch(state.until, true)))
  }
  return `https://search.bilibili.com/${tab}?${params.toString()}`
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
  buildUrl,
  dynamicSupport,
}
