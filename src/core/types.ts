import type { MessageKey } from '@/i18n'

/** ビルダーで扱う検索概念。各SNSの演算子はこの概念への翻訳として定義する */
export type ConceptId =
  | 'keywords'
  | 'orAny'
  | 'exactPhrase'
  | 'exclude'
  | 'titleOnly'
  | 'fromUser'
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
  | 'newestFirst'

export type VideoLength = '' | 'short' | 'medium' | 'long'

/** ユーザーが組み立てる検索条件 */
export interface QueryState {
  keywords: string
  /** 「いずれかを含む」行。行内の語は OR、行どうしは AND で結合する。常に1行以上 */
  orGroups: string[]
  exactPhrase: string
  exclude: string
  titleOnly: boolean
  fromUser: string
  toUser: string
  mentionsUser: string
  subreddit: string
  domain: string
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
  newestFirst: boolean
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

export type PlatformGroup = 'sns' | 'video' | 'text'

export type PlatformId =
  | 'x'
  | 'bluesky'
  | 'youtube'
  | 'note'
  | 'niconico'
  | 'threads'
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'reddit'

export interface PlatformDef {
  id: PlatformId
  name: string
  group: PlatformGroup
  /** ボタン等に使うブランドカラー */
  brandColor: string
  requiresLogin: boolean
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
