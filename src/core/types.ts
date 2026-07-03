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

/** 作品の種類。イラスト/マンガの投稿サイト(pixiv・ニコニコ静画)向け */
export type WorkType = '' | 'illust' | 'manga'

/** 探すものの種類。動画=投稿された動画、チャンネル=投稿者・配信者 */
export type ResultType = '' | 'video' | 'channel'

/** 並び順。new=新しい順、top=人気順、auto=サイトにおまかせ(URLで指定しない) */
export type SortOrder = 'new' | 'top' | 'auto'

/** ユーザーが組み立てる検索条件 */
export interface QueryState {
  /**
   * キーワードの語の並び。1要素=1語で、語の中身は分割しない(スペースを含む語はフレーズ)。
   * 語どうしは常にAND。常に1要素以上
   */
  terms: string[]
  /** 1つの語句をこの語順のまま探す。分割しない */
  exactPhrase: string
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
  | 'threads'
  | 'instagram'
  | 'tiktok'
  | 'reddit'
  | 'pixiv'
  | 'misskey'
  | 'hatebu'
  | 'mastodon'
  | 'twitch'
  | 'fivech'
  | 'animanch'
  | 'seiga'

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
}

export const NO_SUPPORT: ConceptSupport = { level: 'none' }

export function supportOf(
  platform: PlatformDef,
  concept: ConceptId,
): ConceptSupport {
  return platform.support[concept] ?? NO_SUPPORT
}

/** ある条件セットをあるSNSへ翻訳した結果 */
export interface Resolution {
  url: string | null
  applied: ConceptId[]
  approximated: Array<{ concept: ConceptId; noteKey?: MessageKey }>
  dropped: Array<{ concept: ConceptId; noteKey?: MessageKey }>
}
