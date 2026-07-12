import type { ConceptId, PlatformId, Resolution } from './types'
import { pathSegments } from './parse'

/**
 * 生成URLから、そのサイト自身の検索ボックスにそのまま貼れる生のクエリテキストを取り出す。
 * buildPartsのUrlPart列は概念への帰属を持つが、コピー対象の範囲(q=等のパラメータ値、
 * またはパス埋め込みの検索語)はサイトごとに構造が異なるため、ここで個別に読み解く
 * (各サイトのparseUrlが同じ値を読む場所と揃えてある)。テキスト欄を持たない翻訳結果
 * (パラメータもパスも無いなど)は null
 */
function extractText(platformId: PlatformId, url: URL): string | null {
  const segs = pathSegments(url)
  switch (platformId) {
    case 'x':
    case 'bluesky':
    case 'hatebu':
    case 'reddit':
    case 'fivech':
    case 'pinterest':
    case 'google':
    case 'github':
    case 'qiita':
    case 'zenn':
      return url.searchParams.get('q')
    case 'twitch':
      return url.searchParams.get('term')
    case 'fantia':
    case 'bilibili':
      return url.searchParams.get('keyword')
    case 'youtube':
      // /results?search_query= が通常検索、/@handle/search?query= がチャンネル内検索
      return url.pathname.startsWith('/results')
        ? url.searchParams.get('search_query')
        : url.searchParams.get('query')
    case 'note':
    case 'misskey':
    case 'mastodon':
      // /tags/{タグ}(note は /hashtag/{タグ})はパス埋め込み、それ以外は q=
      return segs[0] === 'tags' || segs[0] === 'hashtag'
        ? (segs[1] ?? null)
        : url.searchParams.get('q')
    case 'pixiv':
      // /tags/{q}/{section} はパス埋め込み、/search?q=(タグ・タイトル・キャプション)は q=
      return segs[0] === 'tags' ? (segs[1] ?? null) : url.searchParams.get('q')
    case 'instagram':
      // /explore/tags/{タグ}/ はパス埋め込み、/explore/search/keyword/?q= は q=
      return segs[1] === 'tags' ? (segs[2] ?? null) : url.searchParams.get('q')
    case 'seiga':
      // マンガ(manga.nicovideo.jp)は別ドメイン・別エンジンで q=、イラストはパス埋め込み
      return url.hostname === 'manga.nicovideo.jp' ? url.searchParams.get('q') : (segs[1] ?? null)
    case 'niconico':
    case 'tumblr':
    case 'animanch':
    case 'fanbox':
      // いずれも検索語は常にパスの2番目のセグメント(タブ・タグ切替のパスがあっても位置は揃う)
      return segs[1] ?? null
  }
}

/**
 * このサイトでは絶対にコピーテキストへ載らない概念(並び順・種類の切替パス・
 * サイト固有の別パラメータなど)。resolution.applied と突き合わせて
 * 「コピーに含まれない条件」を求めるための静的な表(各buildPartsを読んで洗い出した)
 */
const STRUCTURAL_EXCLUDE: Partial<Record<PlatformId, ReadonlySet<ConceptId>>> = {
  x: new Set(['sortOrder']),
  bluesky: new Set(['sortOrder', 'language', 'mediaOnly', 'resultType']),
  youtube: new Set([
    'sortOrder',
    'resultType',
    'videoLength',
    'liveOnly',
    'fourK',
    'hdOnly',
    'captionsOnly',
    'creativeCommons',
    'threeSixty',
    'vr180',
    'threeD',
    'hdr',
    'locationOnly',
    'purchased',
    'fromUser',
  ]),
  note: new Set(['resultType', 'sortOrder', 'paidOnly']),
  pixiv: new Set([
    'sortOrder',
    'period',
    'ageRating',
    'excludeAi',
    'workType',
    'titleOnly',
    'exactTag',
    'tagTitleCaption',
  ]),
  niconico: new Set(['sortOrder', 'period', 'videoLength', 'genre', 'nicoKind', 'resultType']),
  seiga: new Set(['sortOrder', 'workType']),
  tumblr: new Set(['sortOrder', 'mediaOnly', 'linksOnly']),
  hatebu: new Set(['sortOrder', 'period', 'minLikes', 'safeSearchOff', 'titleOnly']),
  reddit: new Set(['sortOrder', 'period', 'resultType']),
  twitch: new Set(['resultType']),
  fantia: new Set(['fantiaAudience', 'fantiaCategory', 'sortOrder', 'titleOnly']),
  bilibili: new Set(['resultType', 'sortOrder', 'videoLength', 'period']),
  pinterest: new Set(['resultType']),
  animanch: new Set(['titleOnly']),
  misskey: new Set(['fromUser']),
  google: new Set([
    'language',
    'region',
    'license',
    'exactMatchMode',
    'period',
    'safeSearchOff',
    'resultType',
  ]),
  github: new Set(['resultType']),
  qiita: new Set(['resultType', 'sortOrder']),
  zenn: new Set(['resultType', 'sortOrder', 'semanticSearch']),
}

export interface RawQuery {
  /** そのサイトの検索ボックスに貼れる生テキスト(URLデコード済み) */
  text: string
  /** applied のうち、この text には載らない条件(並び順など別パラメータ側の条件) */
  excluded: ConceptId[]
}

/** コピー対象のテキストが取れないとき(パラメータもパスも無いURL形状など)は null */
export function rawQuery(platformId: PlatformId, resolution: Resolution): RawQuery | null {
  if (!resolution.url) return null
  let url: URL
  try {
    url = new URL(resolution.url)
  } catch {
    return null
  }
  const text = extractText(platformId, url)
  if (!text) return null
  const excludeSet = STRUCTURAL_EXCLUDE[platformId]
  if (!excludeSet) return { text, excluded: [] }
  // 近似(partial)扱いの条件(例: misskeyのfromUser)も、実際に画面へ「効いている」と
  // 見せている以上は同じ基準で拾う(applied単独だと見落とす)
  const effective = [...resolution.applied, ...resolution.approximated.map((a) => a.concept)]
  const excluded = effective.filter((c) => excludeSet.has(c))
  return { text, excluded }
}
