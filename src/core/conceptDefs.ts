import type { MessageKey } from '@/i18n'
import type { ConceptId, ConceptSupport, PlatformDef, QueryState } from './types'
import { supportOf } from './types'
import { PLATFORMS } from './platforms'

/** 統一条件バーに載るウィジェットの種類 */
export type WidgetKind = 'chips' | 'plain' | 'toggle' | 'select' | 'sort' | 'period'

export interface ConceptDef {
  id: ConceptId
  /** 値を持つ QueryState のフィールド。period は since/until の2値を持つため代表して since */
  field: keyof QueryState
  widget: WidgetKind
  /** chips: 入力全体を1語として扱う(スペースを含む語句を保つ)。省略時は語ごとに分割 */
  phrase?: boolean
  inputType?: 'number'
  labelKey: MessageKey
  helpKey: MessageKey
  placeholderKey?: MessageKey
  /** バー先頭の性質アイコン(lucide系ストローク。複数サブパスを1つのdに連結) */
  iconPath: string
}

/** 各条件の性質を表す先頭アイコン */
const ICON: Record<ConceptId, string> = {
  keywords: 'M20.5 20.5 16.5 16.5M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0z',
  exactPhrase: 'M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2zM5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z',
  exclude: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M8 12h8',
  fromUser: 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M5 21a7 7 0 0 1 14 0',
  excludeUser: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M5.6 5.6l12.8 12.8',
  toUser: 'M22 12a10 10 0 1 0-4.3 8.2M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8M16 8v5a3 3 0 0 0 6 0v-1',
  mentionsUser: 'M22 12a10 10 0 1 0-4.3 8.2M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8M16 8v5a3 3 0 0 0 6 0v-1',
  subreddit: 'M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z',
  domain: 'M9 15l6-6M11 6l1-1a4 4 0 0 1 6 6l-1 1M13 18l-1 1a4 4 0 0 1-6-6l1-1',
  hashtag: 'M4 9h16M4 15h16M10 3 8 21M16 3l-2 18',
  period: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  titleOnly: 'M4 6h16M4 12h11M4 18h7',
  mediaOnly: 'M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM8.5 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3M21 16l-5-5L5 22',
  videoLength: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v5l3 2',
  workType: 'M12 19l7-7a2.8 2.8 0 0 0-4-4l-7 7-1 5 5-1zM11 8l5 5',
  resultType: 'M4 6h11a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM16 10l4.5-2.5v9L16 14',
  language: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M3 12h18M12 3a13 13 0 0 1 0 18 13 13 0 0 1 0-18',
  sortOrder: 'M7 4v16M4 7l3-3 3 3M17 20V4M14 17l3 3 3-3',
  linksOnly: 'M9 15l6-6M11 6l1-1a4 4 0 0 1 6 6l-1 1M13 18l-1 1a4 4 0 0 1-6-6l1-1',
  verifiedOnly: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M8 12l3 3 5-5',
  excludeReplies: 'M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2zM9 10h6',
  minLikes: 'M12 20s-7-4.7-9.3-9.2A4.6 4.6 0 0 1 12 5a4.6 4.6 0 0 1 9.3 5.8C19 15.3 12 20 12 20z',
  minReposts: 'M17 2l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3',
  pixivPopular: 'M12 2l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.7l6.5-.9z',
}

/** 新UIの条件メタデータ。並び順はピッカーの同数タイブレークに使う(デザイン準拠) */
export const CONCEPT_DEFS: ConceptDef[] = [
  { id: 'keywords', field: 'terms', widget: 'chips', phrase: true, labelKey: 'concept.keywords.label', helpKey: 'concept.keywords.help', placeholderKey: 'concept.keywords.placeholder', iconPath: ICON.keywords },
  { id: 'exactPhrase', field: 'exactPhrase', widget: 'chips', phrase: true, labelKey: 'concept.exactPhrase.label', helpKey: 'concept.exactPhrase.help', placeholderKey: 'concept.exactPhrase.placeholder', iconPath: ICON.exactPhrase },
  { id: 'exclude', field: 'exclude', widget: 'chips', labelKey: 'concept.exclude.label', helpKey: 'concept.exclude.help', placeholderKey: 'concept.exclude.placeholder', iconPath: ICON.exclude },
  { id: 'fromUser', field: 'fromUser', widget: 'plain', labelKey: 'concept.fromUser.label', helpKey: 'concept.fromUser.help', placeholderKey: 'concept.fromUser.placeholder', iconPath: ICON.fromUser },
  { id: 'hashtag', field: 'hashtag', widget: 'chips', labelKey: 'concept.hashtag.label', helpKey: 'concept.hashtag.help', placeholderKey: 'concept.hashtag.placeholder', iconPath: ICON.hashtag },
  { id: 'period', field: 'since', widget: 'period', labelKey: 'concept.period.label', helpKey: 'concept.period.help', iconPath: ICON.period },
  { id: 'titleOnly', field: 'titleOnly', widget: 'toggle', labelKey: 'concept.titleOnly.label', helpKey: 'concept.titleOnly.help', iconPath: ICON.titleOnly },
  { id: 'mediaOnly', field: 'mediaOnly', widget: 'toggle', labelKey: 'concept.mediaOnly.label', helpKey: 'concept.mediaOnly.help', iconPath: ICON.mediaOnly },
  { id: 'videoLength', field: 'videoLength', widget: 'select', labelKey: 'concept.videoLength.label', helpKey: 'concept.videoLength.help', iconPath: ICON.videoLength },
  { id: 'workType', field: 'workType', widget: 'select', labelKey: 'concept.workType.label', helpKey: 'concept.workType.help', iconPath: ICON.workType },
  { id: 'pixivPopular', field: 'pixivPopular', widget: 'select', labelKey: 'concept.pixivPopular.label', helpKey: 'concept.pixivPopular.help', iconPath: ICON.pixivPopular },
  { id: 'resultType', field: 'resultType', widget: 'select', labelKey: 'concept.resultType.label', helpKey: 'concept.resultType.help', iconPath: ICON.resultType },
  { id: 'language', field: 'language', widget: 'select', labelKey: 'concept.language.label', helpKey: 'concept.language.help', iconPath: ICON.language },
  { id: 'sortOrder', field: 'sort', widget: 'sort', labelKey: 'concept.sortOrder.label', helpKey: 'concept.sortOrder.help', iconPath: ICON.sortOrder },
  { id: 'toUser', field: 'toUser', widget: 'chips', labelKey: 'concept.toUser.label', helpKey: 'concept.toUser.help', placeholderKey: 'concept.toUser.placeholder', iconPath: ICON.toUser },
  { id: 'excludeUser', field: 'excludeUser', widget: 'chips', labelKey: 'concept.excludeUser.label', helpKey: 'concept.excludeUser.help', placeholderKey: 'concept.excludeUser.placeholder', iconPath: ICON.excludeUser },
  { id: 'minLikes', field: 'minLikes', widget: 'plain', inputType: 'number', labelKey: 'concept.minLikes.label', helpKey: 'concept.minLikes.help', placeholderKey: 'concept.minLikes.placeholder', iconPath: ICON.minLikes },
  { id: 'minReposts', field: 'minReposts', widget: 'plain', inputType: 'number', labelKey: 'concept.minReposts.label', helpKey: 'concept.minReposts.help', placeholderKey: 'concept.minReposts.placeholder', iconPath: ICON.minReposts },
  { id: 'excludeReplies', field: 'excludeReplies', widget: 'toggle', labelKey: 'concept.excludeReplies.label', helpKey: 'concept.excludeReplies.help', iconPath: ICON.excludeReplies },
  { id: 'linksOnly', field: 'linksOnly', widget: 'toggle', labelKey: 'concept.linksOnly.label', helpKey: 'concept.linksOnly.help', iconPath: ICON.linksOnly },
  { id: 'verifiedOnly', field: 'verifiedOnly', widget: 'toggle', labelKey: 'concept.verifiedOnly.label', helpKey: 'concept.verifiedOnly.help', iconPath: ICON.verifiedOnly },
  { id: 'mentionsUser', field: 'mentionsUser', widget: 'plain', labelKey: 'concept.mentionsUser.label', helpKey: 'concept.mentionsUser.help', placeholderKey: 'concept.mentionsUser.placeholder', iconPath: ICON.mentionsUser },
  { id: 'domain', field: 'domain', widget: 'plain', labelKey: 'concept.domain.label', helpKey: 'concept.domain.help', placeholderKey: 'concept.domain.placeholder', iconPath: ICON.domain },
  { id: 'subreddit', field: 'subreddit', widget: 'chips', labelKey: 'concept.subreddit.label', helpKey: 'concept.subreddit.help', placeholderKey: 'concept.subreddit.placeholder', iconPath: ICON.subreddit },
]

export const CONCEPT_MAP = Object.fromEntries(
  CONCEPT_DEFS.map((d) => [d.id, d]),
) as Record<ConceptId, ConceptDef>

/**
 * 静的に対応しているサイト。support に明示的な none エントリを持つサイトが
 * あるため、記載の有無ではなく level で除外する(対応数の水増し防止)
 */
export function supportersOf(concept: ConceptId): PlatformDef[] {
  return PLATFORMS.filter((p) => supportOf(p, concept).level !== 'none')
}

/** 対応サイト数(静的)。ピッカーの並び順に使う */
export const SUPPORT_COUNT = Object.fromEntries(
  CONCEPT_DEFS.map((d) => [d.id, supportersOf(d.id).length]),
) as Record<ConceptId, number>

/** 現在の入力まで踏まえた実効レベル(dynamicSupport を静的 support に重ねる) */
export function effectiveLevel(
  platform: PlatformDef,
  concept: ConceptId,
  state: QueryState,
): ConceptSupport {
  const dyn = platform.dynamicSupport?.(state)
  return dyn?.[concept] ?? supportOf(platform, concept)
}

/**
 * 対応ポップオーバー用: 対応サイトを「完全」と「それ以外(一部・今の入力では不可)」に
 * 振り分ける。入力次第で none に落ちたサイトも「一部対応」側に出す(デザイン準拠)
 */
export function splitSupporters(
  concept: ConceptId,
  state: QueryState,
): { full: PlatformDef[]; partial: PlatformDef[] } {
  const full: PlatformDef[] = []
  const partial: PlatformDef[] = []
  for (const p of supportersOf(concept)) {
    if (effectiveLevel(p, concept, state).level === 'full') full.push(p)
    else partial.push(p)
  }
  return { full, partial }
}

export interface SelectOption {
  value: string
  labelKey: MessageKey
}

/** セレクト式の条件の選択肢。値は QueryState の各フィールドの値と対応する */
export const SELECT_OPTIONS: Partial<Record<ConceptId, SelectOption[]>> = {
  videoLength: [
    { value: '', labelKey: 'concept.videoLength.none' },
    { value: 'short', labelKey: 'concept.videoLength.short' },
    { value: 'medium', labelKey: 'concept.videoLength.medium' },
    { value: 'long', labelKey: 'concept.videoLength.long' },
  ],
  workType: [
    { value: '', labelKey: 'concept.workType.none' },
    { value: 'illust', labelKey: 'concept.workType.illust' },
    { value: 'manga', labelKey: 'concept.workType.manga' },
  ],
  resultType: [
    { value: '', labelKey: 'concept.resultType.none' },
    { value: 'video', labelKey: 'concept.resultType.video' },
    { value: 'short', labelKey: 'concept.resultType.short' },
    { value: 'channel', labelKey: 'concept.resultType.channel' },
    { value: 'playlist', labelKey: 'concept.resultType.playlist' },
  ],
  language: [
    { value: '', labelKey: 'concept.language.none' },
    { value: 'ja', labelKey: 'concept.language.ja' },
    { value: 'en', labelKey: 'concept.language.en' },
  ],
  pixivPopular: [
    { value: '', labelKey: 'concept.pixivPopular.none' },
    { value: '500', labelKey: 'concept.pixivPopular.500' },
    { value: '1000', labelKey: 'concept.pixivPopular.1000' },
    { value: '5000', labelKey: 'concept.pixivPopular.5000' },
    { value: '10000', labelKey: 'concept.pixivPopular.10000' },
    { value: '50000', labelKey: 'concept.pixivPopular.50000' },
    { value: '100000', labelKey: 'concept.pixivPopular.100000' },
  ],
}

export const SORT_OPTIONS: Array<{ value: QueryState['sort']; labelKey: MessageKey }> = [
  { value: 'new', labelKey: 'concept.sortOrder.new' },
  { value: 'top', labelKey: 'concept.sortOrder.top' },
  { value: 'hot', labelKey: 'concept.sortOrder.hot' },
  { value: 'auto', labelKey: 'concept.sortOrder.auto' },
]
