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
  { id: 'tagTitleCaption', field: 'tagTitleCaption', widget: 'toggle', labelKey: 'concept.tagTitleCaption.label', helpKey: 'concept.tagTitleCaption.help' },
  { id: 'mediaOnly', field: 'mediaOnly', widget: 'toggle', labelKey: 'concept.mediaOnly.label', helpKey: 'concept.mediaOnly.help' },
  { id: 'liveOnly', field: 'liveOnly', widget: 'toggle', labelKey: 'concept.liveOnly.label', helpKey: 'concept.liveOnly.help' },
  { id: 'fourK', field: 'fourK', widget: 'toggle', labelKey: 'concept.fourK.label', helpKey: 'concept.fourK.help' },
  { id: 'hdOnly', field: 'hdOnly', widget: 'toggle', labelKey: 'concept.hdOnly.label', helpKey: 'concept.hdOnly.help' },
  { id: 'captionsOnly', field: 'captionsOnly', widget: 'toggle', labelKey: 'concept.captionsOnly.label', helpKey: 'concept.captionsOnly.help' },
  { id: 'creativeCommons', field: 'creativeCommons', widget: 'toggle', labelKey: 'concept.creativeCommons.label', helpKey: 'concept.creativeCommons.help' },
  { id: 'threeSixty', field: 'threeSixty', widget: 'toggle', labelKey: 'concept.threeSixty.label', helpKey: 'concept.threeSixty.help' },
  { id: 'vr180', field: 'vr180', widget: 'toggle', labelKey: 'concept.vr180.label', helpKey: 'concept.vr180.help' },
  { id: 'threeD', field: 'threeD', widget: 'toggle', labelKey: 'concept.threeD.label', helpKey: 'concept.threeD.help' },
  { id: 'hdr', field: 'hdr', widget: 'toggle', labelKey: 'concept.hdr.label', helpKey: 'concept.hdr.help' },
  { id: 'locationOnly', field: 'locationOnly', widget: 'toggle', labelKey: 'concept.locationOnly.label', helpKey: 'concept.locationOnly.help' },
  { id: 'purchased', field: 'purchased', widget: 'toggle', labelKey: 'concept.purchased.label', helpKey: 'concept.purchased.help' },
  { id: 'videoLength', field: 'videoLength', widget: 'select', labelKey: 'concept.videoLength.label', helpKey: 'concept.videoLength.help' },
  { id: 'workType', field: 'workType', widget: 'select', labelKey: 'concept.workType.label', helpKey: 'concept.workType.help' },
  { id: 'genre', field: 'genre', widget: 'select', labelKey: 'concept.genre.label', helpKey: 'concept.genre.help' },
  { id: 'nicoKind', field: 'nicoKind', widget: 'select', labelKey: 'concept.nicoKind.label', helpKey: 'concept.nicoKind.help' },
  { id: 'paidOnly', field: 'paidOnly', widget: 'toggle', labelKey: 'concept.paidOnly.label', helpKey: 'concept.paidOnly.help' },
  { id: 'fantiaCategory', field: 'fantiaCategory', widget: 'select', labelKey: 'concept.fantiaCategory.label', helpKey: 'concept.fantiaCategory.help' },
  { id: 'fantiaAudience', field: 'fantiaAudience', widget: 'select', labelKey: 'concept.fantiaAudience.label', helpKey: 'concept.fantiaAudience.help' },
  { id: 'safeSearchOff', field: 'safeSearchOff', widget: 'toggle', labelKey: 'concept.safeSearchOff.label', helpKey: 'concept.safeSearchOff.help' },
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
 * 現在の入力まで踏まえた実対応サイト。選んだ値によって dynamicSupport で落ちるサイト
 * (急上昇を持たないサイト等)を除いて数える。「対応 N」バッジと選択肢ごとの対応数に使う
 */
export function activeSupportersOf(concept: ConceptId, state: QueryState): PlatformDef[] {
  return supportersOf(concept).filter((p) => effectiveLevel(p, concept, state).level !== 'none')
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
    { value: 'posts', labelKey: 'concept.resultType.posts' },
    { value: 'communities', labelKey: 'concept.resultType.communities' },
    { value: 'comments', labelKey: 'concept.resultType.comments' },
    { value: 'media', labelKey: 'concept.resultType.media' },
    { value: 'people', labelKey: 'concept.resultType.people' },
    { value: 'board', labelKey: 'concept.resultType.board' },
    { value: 'bangumi', labelKey: 'concept.resultType.bangumi' },
    { value: 'pgc', labelKey: 'concept.resultType.pgc' },
    { value: 'live', labelKey: 'concept.resultType.live' },
    { value: 'article', labelKey: 'concept.resultType.article' },
    { value: 'series', labelKey: 'concept.resultType.series' },
    { value: 'circle', labelKey: 'concept.resultType.circle' },
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
    { value: 'game', labelKey: 'concept.genre.game' },
    { value: 'animal', labelKey: 'concept.genre.animal' },
    { value: 'music_sound', labelKey: 'concept.genre.music_sound' },
    { value: 'entertainment', labelKey: 'concept.genre.entertainment' },
    { value: 'other', labelKey: 'concept.genre.other' },
    { value: 'anime', labelKey: 'concept.genre.anime' },
    { value: 'dance', labelKey: 'concept.genre.dance' },
    { value: 'radio', labelKey: 'concept.genre.radio' },
    { value: 'traveling_outdoor', labelKey: 'concept.genre.traveling_outdoor' },
    { value: 'commentary_lecture', labelKey: 'concept.genre.commentary_lecture' },
    { value: 'cooking', labelKey: 'concept.genre.cooking' },
    { value: 'technology_craft', labelKey: 'concept.genre.technology_craft' },
    { value: 'vehicle', labelKey: 'concept.genre.vehicle' },
    { value: 'nature', labelKey: 'concept.genre.nature' },
    { value: 'society_politics_news', labelKey: 'concept.genre.society_politics_news' },
    { value: 'sports', labelKey: 'concept.genre.sports' },
    { value: 'r18', labelKey: 'concept.genre.r18' },
  ],
  nicoKind: [
    { value: '', labelKey: 'concept.nicoKind.none' },
    { value: 'user', labelKey: 'concept.nicoKind.user' },
    { value: 'channel', labelKey: 'concept.nicoKind.channel' },
  ],
  fantiaCategory: [
    { value: '', labelKey: 'concept.fantiaCategory.none' },
    { value: 'illust', labelKey: 'concept.fantiaCategory.illust' },
    { value: 'comic', labelKey: 'concept.fantiaCategory.comic' },
    { value: 'vtuber', labelKey: 'concept.fantiaCategory.vtuber' },
    { value: 'voice', labelKey: 'concept.fantiaCategory.voice' },
    { value: 'voiceactor', labelKey: 'concept.fantiaCategory.voiceactor' },
    { value: '3d', labelKey: 'concept.fantiaCategory.3d' },
    { value: '2d_anime', labelKey: 'concept.fantiaCategory.2d_anime' },
    { value: 'game', labelKey: 'concept.fantiaCategory.game' },
    { value: 'music', labelKey: 'concept.fantiaCategory.music' },
    { value: 'novel', labelKey: 'concept.fantiaCategory.novel' },
    { value: 'doll', labelKey: 'concept.fantiaCategory.doll' },
    { value: 'art', labelKey: 'concept.fantiaCategory.art' },
    { value: 'program', labelKey: 'concept.fantiaCategory.program' },
    { value: 'handmade', labelKey: 'concept.fantiaCategory.handmade' },
    { value: 'history', labelKey: 'concept.fantiaCategory.history' },
    { value: 'railroad', labelKey: 'concept.fantiaCategory.railroad' },
    { value: 'shop', labelKey: 'concept.fantiaCategory.shop' },
    { value: 'other', labelKey: 'concept.fantiaCategory.other' },
    { value: 'fortune', labelKey: 'concept.fantiaCategory.fortune' },
    { value: 'cosplay', labelKey: 'concept.fantiaCategory.cosplay' },
    { value: 'idol', labelKey: 'concept.fantiaCategory.idol' },
    { value: 'youtuber', labelKey: 'concept.fantiaCategory.youtuber' },
    { value: 'photo_movie', labelKey: 'concept.fantiaCategory.photo_movie' },
    { value: 'other_real', labelKey: 'concept.fantiaCategory.other_real' },
  ],
  fantiaAudience: [
    { value: '', labelKey: 'concept.fantiaAudience.none' },
    { value: 'male', labelKey: 'concept.fantiaAudience.male' },
    { value: 'female', labelKey: 'concept.fantiaAudience.female' },
  ],
}

// 「指定なし(auto)」を先頭に置くのは他のセレクト(探すものの種類など)の「指定なし」と
// 同じ作法。以降は対応サイト数の多い順(新しい順・人気順が大半、急上昇以下は少数サイト専用)
export const SORT_OPTIONS: Array<{ value: QueryState['sort']; labelKey: MessageKey }> = [
  { value: 'auto', labelKey: 'concept.sortOrder.auto' },
  { value: 'new', labelKey: 'concept.sortOrder.new' },
  { value: 'top', labelKey: 'concept.sortOrder.top' },
  { value: 'hot', labelKey: 'concept.sortOrder.hot' },
  { value: 'comments', labelKey: 'concept.sortOrder.comments' },
  { value: 'danmaku', labelKey: 'concept.sortOrder.danmaku' },
  { value: 'favorites', labelKey: 'concept.sortOrder.favorites' },
  { value: 'likes', labelKey: 'concept.sortOrder.likes' },
  { value: 'commentDate', labelKey: 'concept.sortOrder.commentDate' },
  { value: 'videoCount', labelKey: 'concept.sortOrder.videoCount' },
  { value: 'videoAdded', labelKey: 'concept.sortOrder.videoAdded' },
  { value: 'followerCount', labelKey: 'concept.sortOrder.followerCount' },
  { value: 'liveCount', labelKey: 'concept.sortOrder.liveCount' },
]
