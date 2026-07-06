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
}

/** 新UIの条件メタデータ。並び順はピッカーの同数タイブレークに使う(デザイン準拠) */
export const CONCEPT_DEFS: ConceptDef[] = [
  { id: 'keywords', field: 'terms', widget: 'chips', phrase: true, labelKey: 'concept.keywords.label', helpKey: 'concept.keywords.help', placeholderKey: 'concept.keywords.placeholder' },
  { id: 'exactPhrase', field: 'exactPhrase', widget: 'chips', phrase: true, labelKey: 'concept.exactPhrase.label', helpKey: 'concept.exactPhrase.help', placeholderKey: 'concept.exactPhrase.placeholder' },
  { id: 'exclude', field: 'exclude', widget: 'chips', labelKey: 'concept.exclude.label', helpKey: 'concept.exclude.help', placeholderKey: 'concept.exclude.placeholder' },
  { id: 'fromUser', field: 'fromUser', widget: 'plain', labelKey: 'concept.fromUser.label', helpKey: 'concept.fromUser.help', placeholderKey: 'concept.fromUser.placeholder' },
  { id: 'hashtag', field: 'hashtag', widget: 'chips', labelKey: 'concept.hashtag.label', helpKey: 'concept.hashtag.help', placeholderKey: 'concept.hashtag.placeholder' },
  { id: 'period', field: 'since', widget: 'period', labelKey: 'concept.period.label', helpKey: 'concept.period.help' },
  { id: 'titleOnly', field: 'titleOnly', widget: 'toggle', labelKey: 'concept.titleOnly.label', helpKey: 'concept.titleOnly.help' },
  { id: 'exactTag', field: 'exactTag', widget: 'toggle', labelKey: 'concept.exactTag.label', helpKey: 'concept.exactTag.help' },
  { id: 'mediaOnly', field: 'mediaOnly', widget: 'toggle', labelKey: 'concept.mediaOnly.label', helpKey: 'concept.mediaOnly.help' },
  { id: 'liveOnly', field: 'liveOnly', widget: 'toggle', labelKey: 'concept.liveOnly.label', helpKey: 'concept.liveOnly.help' },
  { id: 'videoLength', field: 'videoLength', widget: 'select', labelKey: 'concept.videoLength.label', helpKey: 'concept.videoLength.help' },
  { id: 'workType', field: 'workType', widget: 'select', labelKey: 'concept.workType.label', helpKey: 'concept.workType.help' },
  { id: 'genre', field: 'genre', widget: 'select', labelKey: 'concept.genre.label', helpKey: 'concept.genre.help' },
  { id: 'pixivPopular', field: 'pixivPopular', widget: 'select', labelKey: 'concept.pixivPopular.label', helpKey: 'concept.pixivPopular.help' },
  { id: 'ageRating', field: 'ageRating', widget: 'select', labelKey: 'concept.ageRating.label', helpKey: 'concept.ageRating.help' },
  { id: 'excludeAi', field: 'excludeAi', widget: 'toggle', labelKey: 'concept.excludeAi.label', helpKey: 'concept.excludeAi.help' },
  { id: 'resultType', field: 'resultType', widget: 'select', labelKey: 'concept.resultType.label', helpKey: 'concept.resultType.help' },
  { id: 'language', field: 'language', widget: 'select', labelKey: 'concept.language.label', helpKey: 'concept.language.help' },
  { id: 'sortOrder', field: 'sort', widget: 'sort', labelKey: 'concept.sortOrder.label', helpKey: 'concept.sortOrder.help' },
  { id: 'toUser', field: 'toUser', widget: 'chips', labelKey: 'concept.toUser.label', helpKey: 'concept.toUser.help', placeholderKey: 'concept.toUser.placeholder' },
  { id: 'excludeUser', field: 'excludeUser', widget: 'chips', labelKey: 'concept.excludeUser.label', helpKey: 'concept.excludeUser.help', placeholderKey: 'concept.excludeUser.placeholder' },
  { id: 'minLikes', field: 'minLikes', widget: 'plain', inputType: 'number', labelKey: 'concept.minLikes.label', helpKey: 'concept.minLikes.help', placeholderKey: 'concept.minLikes.placeholder' },
  { id: 'minReposts', field: 'minReposts', widget: 'plain', inputType: 'number', labelKey: 'concept.minReposts.label', helpKey: 'concept.minReposts.help', placeholderKey: 'concept.minReposts.placeholder' },
  { id: 'minReplies', field: 'minReplies', widget: 'plain', inputType: 'number', labelKey: 'concept.minReplies.label', helpKey: 'concept.minReplies.help', placeholderKey: 'concept.minReplies.placeholder' },
  { id: 'excludeReplies', field: 'excludeReplies', widget: 'toggle', labelKey: 'concept.excludeReplies.label', helpKey: 'concept.excludeReplies.help' },
  { id: 'linksOnly', field: 'linksOnly', widget: 'toggle', labelKey: 'concept.linksOnly.label', helpKey: 'concept.linksOnly.help' },
  { id: 'verifiedOnly', field: 'verifiedOnly', widget: 'toggle', labelKey: 'concept.verifiedOnly.label', helpKey: 'concept.verifiedOnly.help' },
  { id: 'mentionsUser', field: 'mentionsUser', widget: 'plain', labelKey: 'concept.mentionsUser.label', helpKey: 'concept.mentionsUser.help', placeholderKey: 'concept.mentionsUser.placeholder' },
  { id: 'domain', field: 'domain', widget: 'plain', labelKey: 'concept.domain.label', helpKey: 'concept.domain.help', placeholderKey: 'concept.domain.placeholder' },
  { id: 'xList', field: 'xList', widget: 'plain', labelKey: 'concept.xList.label', helpKey: 'concept.xList.help', placeholderKey: 'concept.xList.placeholder' },
  { id: 'subreddit', field: 'subreddit', widget: 'chips', labelKey: 'concept.subreddit.label', helpKey: 'concept.subreddit.help', placeholderKey: 'concept.subreddit.placeholder' },
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
    { value: 'ugoira', labelKey: 'concept.workType.ugoira' },
    { value: 'novel', labelKey: 'concept.workType.novel' },
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
    { value: 'zh', labelKey: 'concept.language.zh' },
    { value: 'ko', labelKey: 'concept.language.ko' },
    { value: 'es', labelKey: 'concept.language.es' },
    { value: 'fr', labelKey: 'concept.language.fr' },
    { value: 'de', labelKey: 'concept.language.de' },
    { value: 'pt', labelKey: 'concept.language.pt' },
    { value: 'ru', labelKey: 'concept.language.ru' },
    { value: 'it', labelKey: 'concept.language.it' },
    { value: 'ar', labelKey: 'concept.language.ar' },
    { value: 'hi', labelKey: 'concept.language.hi' },
    { value: 'th', labelKey: 'concept.language.th' },
    { value: 'id', labelKey: 'concept.language.id' },
  ],
  pixivPopular: [
    { value: '', labelKey: 'concept.pixivPopular.none' },
    { value: '00users', labelKey: 'concept.pixivPopular.100' },
    { value: '000users', labelKey: 'concept.pixivPopular.1000' },
    { value: '0000users', labelKey: 'concept.pixivPopular.10000' },
  ],
  ageRating: [
    { value: '', labelKey: 'concept.ageRating.none' },
    { value: 'safe', labelKey: 'concept.ageRating.safe' },
    { value: 'r18', labelKey: 'concept.ageRating.r18' },
  ],
  genre: [
    { value: '', labelKey: 'concept.genre.none' },
    { value: 'music_sound', labelKey: 'concept.genre.music_sound' },
    { value: 'game', labelKey: 'concept.genre.game' },
    { value: 'entertainment', labelKey: 'concept.genre.entertainment' },
    { value: 'anime', labelKey: 'concept.genre.anime' },
    { value: 'dance', labelKey: 'concept.genre.dance' },
    { value: 'technology_craft', labelKey: 'concept.genre.technology_craft' },
    { value: 'commentary_lecture', labelKey: 'concept.genre.commentary_lecture' },
    { value: 'sports', labelKey: 'concept.genre.sports' },
    { value: 'radio', labelKey: 'concept.genre.radio' },
    { value: 'vehicle', labelKey: 'concept.genre.vehicle' },
    { value: 'traveling_outdoor', labelKey: 'concept.genre.traveling_outdoor' },
    { value: 'other', labelKey: 'concept.genre.other' },
  ],
}

export const SORT_OPTIONS: Array<{ value: QueryState['sort']; labelKey: MessageKey }> = [
  { value: 'new', labelKey: 'concept.sortOrder.new' },
  { value: 'top', labelKey: 'concept.sortOrder.top' },
  { value: 'hot', labelKey: 'concept.sortOrder.hot' },
  { value: 'auto', labelKey: 'concept.sortOrder.auto' },
]
