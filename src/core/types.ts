import type { MessageKey } from '@/i18n'

/** ビルダーで扱う検索概念。各SNSの演算子はこの概念への翻訳として定義する */
export type ConceptId =
  | 'keywords'
  | 'exactPhrase'
  | 'exclude'
  | 'titleOnly'
  | 'fromUser'
  | 'excludeUser'
  | 'toUser'
  | 'mentionsUser'
  | 'subreddit'
  | 'domain'
  | 'hashtag'
  | 'period'
  | 'mediaOnly'
  | 'videoLength'
  | 'linksOnly'
  | 'verifiedOnly'
  | 'excludeReplies'
  | 'minLikes'
  | 'minReposts'
  | 'japaneseOnly'
  | 'workType'
  | 'resultType'
  | 'sortOrder'

export type VideoLength = '' | 'short' | 'medium' | 'long'

/** 作品の種類。イラスト/マンガの投稿サイト(pixiv)向け */
export type WorkType = '' | 'illust' | 'manga'

/**
 * 探すものの種類。video=動画、short=ショート動画、channel=投稿者・配信者、
 * playlist=再生リスト。ショート/再生リストはYouTube専用(Twitchは動画・チャンネルのみ)
 */
export type ResultType = '' | 'video' | 'short' | 'channel' | 'playlist'

/**
 * 並び順。new=新しい順、top=人気順、hot=急上昇(note)、auto=サイトにおまかせ(指定しない)。
 * hot は note 専用。対応しないサイトでは dynamicSupport(limitSort)で non-対応に落とす
 */
export type SortOrder = 'new' | 'top' | 'hot' | 'auto'

/** ユーザーが組み立てる検索条件 */
export interface QueryState {
  /**
   * キーワードの語の並び。1要素=1語で、語の中身は分割しない(スペースを含む語はフレーズ)。
   * 語どうしは常にAND。常に1要素以上
   */
  terms: string[]
  /**
   * 完全一致の語句の並び。1要素=1つの語句で、語句の中身は分割しない(語順のまま探す)。
   * 語句どうしは常にAND。常に1要素以上(terms と同じ扱い)
   */
  exactPhrase: string[]
  exclude: string
  titleOnly: boolean
  fromUser: string
  excludeUser: string
  /** スペース区切りで複数可(どれか宛て=OR) */
  toUser: string
  mentionsUser: string
  /** スペース区切りで複数可(どれか=OR) */
  subreddit: string
  domain: string
  /** スペース区切りで複数のタグ(すべて含む=AND) */
  hashtag: string
  since: string // YYYY-MM-DD
  until: string // YYYY-MM-DD
  mediaOnly: boolean
  videoLength: VideoLength
  linksOnly: boolean
  verifiedOnly: boolean
  excludeReplies: boolean
  minLikes: string // 数値文字列
  minReposts: string // 数値文字列
  japaneseOnly: boolean
  workType: WorkType
  resultType: ResultType
  sort: SortOrder
}

/**
 * full    = そのまま翻訳できる(緑)
 * partial = 近似・非公式など注意つきで翻訳できる(黄)
 * none    = 翻訳できず、起動時に外される(灰)
 */
export type SupportLevel = 'full' | 'partial' | 'none'

export interface ConceptSupport {
  level: SupportLevel
  noteKey?: MessageKey
}

export type PlatformGroup = 'sns' | 'video' | 'image' | 'text'

export type PlatformId =
  | 'x'
  | 'bluesky'
  | 'youtube'
  | 'note'
  | 'niconico'
  | 'instagram'
  | 'reddit'
  | 'pixiv'
  | 'misskey'
  | 'hatebu'
  | 'twitch'
  | 'fivech'
  | 'animanch'

export interface PlatformDef {
  id: PlatformId
  name: string
  group: PlatformGroup
  /** ボタン等に使うブランドカラー */
  brandColor: string
  requiresLogin: boolean
  /** Googleフォールバック(site:検索)で使うドメイン */
  googleSite: string
  /** 対応する概念のみ記載。未記載の概念は非対応(none)として扱う */
  support: Partial<Record<ConceptId, ConceptSupport>>
  /** 対応している概念だけを検索URLへ翻訳する。検索として成立しない場合は null */
  buildUrl(state: QueryState): string | null
  /**
   * state に応じて support を上書きする(任意)。同じ概念でも入力の組み合わせ次第で
   * 実際にはURLへ送れないことがある(例: YouTubeはユーザー指定を入れると
   * チャンネル内検索に切り替わり、並び順・動画の長さ・探すものが送れない)。
   * その概念だけ level を下げて注記を差し替えるために使う。静的 support にマージされる
   */
  dynamicSupport?(state: QueryState): Partial<Record<ConceptId, ConceptSupport>>
}

export const NO_SUPPORT: ConceptSupport = { level: 'none' }

export function supportOf(
  platform: PlatformDef,
  concept: ConceptId,
): ConceptSupport {
  return platform.support[concept] ?? NO_SUPPORT
}

/**
 * dynamicSupport 用ヘルパー。選ばれた並び順が allowed に含まれないとき、sortOrder を
 * 非対応(none)に落とす。'auto'(サイト任せ)は並び順を課さないので常に許容。
 * note 専用の hot などを、その並び順を持たないサイトで「適用」に見せないために使う
 */
export function limitSort(
  sort: SortOrder,
  allowed: SortOrder[],
  noteKey: MessageKey,
): Partial<Record<ConceptId, ConceptSupport>> {
  if (sort !== 'auto' && !allowed.includes(sort)) {
    return { sortOrder: { level: 'none', noteKey } }
  }
  return {}
}

/** ある条件セットをあるSNSへ翻訳した結果 */
export interface Resolution {
  url: string | null
  applied: ConceptId[]
  approximated: Array<{ concept: ConceptId; noteKey?: MessageKey }>
  dropped: Array<{ concept: ConceptId; noteKey?: MessageKey }>
}
