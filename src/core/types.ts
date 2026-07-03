import type { MessageKey } from '@/i18n'

/** ビルダーで扱う検索概念。各SNSの演算子はこの概念への翻訳として定義する */
export type ConceptId =
  | 'keywords'
  | 'orAny'
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
  | 'sortOrder'

export type VideoLength = '' | 'short' | 'medium' | 'long'

/** 並び順。new=新しい順、top=人気順、auto=サイトにおまかせ(URLで指定しない) */
export type SortOrder = 'new' | 'top' | 'auto'

/** ことば行の結合方法。all=全語を含む(AND)、any=どれか1語を含む(OR) */
export type TermMode = 'all' | 'any'

/** ことば行。行内の語はスペース区切りで mode に従って結合し、行どうしは AND */
export interface TermRow {
  text: string
  mode: TermMode
}

/** ユーザーが組み立てる検索条件 */
export interface QueryState {
  /** ことば行。常に1行以上 */
  terms: TermRow[]
  /** スペース区切りで複数の語句。mode に従って結合 */
  exactPhrase: string
  exactPhraseMode: TermMode
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
  /** スペース区切りで複数のタグ。mode に従って結合 */
  hashtag: string
  hashtagMode: TermMode
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
  | 'facebook'
  | 'reddit'
  | 'pixiv'
  | 'misskey'

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
