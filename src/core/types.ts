import type { MessageKey } from '@/i18n'

/** ビルダーで扱う検索概念。各SNSの演算子はこの概念への翻訳として定義する */
export type ConceptId =
  | 'keywords'
  | 'exactPhrase'
  | 'exclude'
  | 'fromUser'
  | 'hashtag'
  | 'period'
  | 'mediaOnly'
  | 'japaneseOnly'
  | 'newestFirst'

/** ユーザーが組み立てる検索条件 */
export interface QueryState {
  keywords: string
  exactPhrase: string
  exclude: string
  fromUser: string
  hashtag: string
  since: string // YYYY-MM-DD
  until: string // YYYY-MM-DD
  mediaOnly: boolean
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
  support: Record<ConceptId, ConceptSupport>
  /** 対応している概念だけを検索URLへ翻訳する。検索として成立しない場合は null */
  buildUrl(state: QueryState): string | null
}

/** ある条件セットをあるSNSへ翻訳した結果 */
export interface Resolution {
  url: string | null
  applied: ConceptId[]
  approximated: Array<{ concept: ConceptId; noteKey?: MessageKey }>
  dropped: Array<{ concept: ConceptId; noteKey?: MessageKey }>
}
