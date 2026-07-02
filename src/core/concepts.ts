import type { MessageKey } from '@/i18n'
import type { ConceptId, QueryState } from './types'

export const CONCEPT_LABEL_KEYS: Record<ConceptId, MessageKey> = {
  keywords: 'concept.keywords.label',
  orAny: 'concept.orAny.label',
  exactPhrase: 'concept.exactPhrase.label',
  exclude: 'concept.exclude.label',
  titleOnly: 'concept.titleOnly.label',
  fromUser: 'concept.fromUser.label',
  toUser: 'concept.toUser.label',
  mentionsUser: 'concept.mentionsUser.label',
  subreddit: 'concept.subreddit.label',
  domain: 'concept.domain.label',
  hashtag: 'concept.hashtag.label',
  period: 'concept.period.label',
  mediaOnly: 'concept.mediaOnly.label',
  videoLength: 'concept.videoLength.label',
  linksOnly: 'concept.linksOnly.label',
  verifiedOnly: 'concept.verifiedOnly.label',
  excludeReplies: 'concept.excludeReplies.label',
  minLikes: 'concept.minLikes.label',
  minReposts: 'concept.minReposts.label',
  japaneseOnly: 'concept.japaneseOnly.label',
  newestFirst: 'concept.newestFirst.label',
}

/** ビルダーに並ぶフィールドの定義。表示順・セクション分けは対応サイト数から自動計算する */
export interface FieldDef {
  concept: ConceptId
  field: keyof QueryState
  widget: 'text' | 'number' | 'toggle' | 'period' | 'videoLength' | 'orGroups'
  labelKey: MessageKey
  placeholderKey?: MessageKey
}

export const FIELDS: FieldDef[] = [
  { concept: 'keywords', field: 'keywords', widget: 'text', labelKey: 'concept.keywords.label', placeholderKey: 'concept.keywords.placeholder' },
  { concept: 'orAny', field: 'orGroups', widget: 'orGroups', labelKey: 'concept.orAny.label', placeholderKey: 'concept.orAny.placeholder' },
  { concept: 'exactPhrase', field: 'exactPhrase', widget: 'text', labelKey: 'concept.exactPhrase.label', placeholderKey: 'concept.exactPhrase.placeholder' },
  { concept: 'exclude', field: 'exclude', widget: 'text', labelKey: 'concept.exclude.label', placeholderKey: 'concept.exclude.placeholder' },
  { concept: 'fromUser', field: 'fromUser', widget: 'text', labelKey: 'concept.fromUser.label', placeholderKey: 'concept.fromUser.placeholder' },
  { concept: 'hashtag', field: 'hashtag', widget: 'text', labelKey: 'concept.hashtag.label', placeholderKey: 'concept.hashtag.placeholder' },
  { concept: 'period', field: 'since', widget: 'period', labelKey: 'concept.period.label' },
  { concept: 'titleOnly', field: 'titleOnly', widget: 'toggle', labelKey: 'concept.titleOnly.label' },
  { concept: 'mediaOnly', field: 'mediaOnly', widget: 'toggle', labelKey: 'concept.mediaOnly.label' },
  { concept: 'videoLength', field: 'videoLength', widget: 'videoLength', labelKey: 'concept.videoLength.label' },
  { concept: 'japaneseOnly', field: 'japaneseOnly', widget: 'toggle', labelKey: 'concept.japaneseOnly.label' },
  { concept: 'newestFirst', field: 'newestFirst', widget: 'toggle', labelKey: 'concept.newestFirst.label' },
  { concept: 'toUser', field: 'toUser', widget: 'text', labelKey: 'concept.toUser.label', placeholderKey: 'concept.toUser.placeholder' },
  { concept: 'minLikes', field: 'minLikes', widget: 'number', labelKey: 'concept.minLikes.label', placeholderKey: 'concept.minLikes.placeholder' },
  { concept: 'minReposts', field: 'minReposts', widget: 'number', labelKey: 'concept.minReposts.label', placeholderKey: 'concept.minReposts.placeholder' },
  { concept: 'excludeReplies', field: 'excludeReplies', widget: 'toggle', labelKey: 'concept.excludeReplies.label' },
  { concept: 'linksOnly', field: 'linksOnly', widget: 'toggle', labelKey: 'concept.linksOnly.label' },
  { concept: 'verifiedOnly', field: 'verifiedOnly', widget: 'toggle', labelKey: 'concept.verifiedOnly.label' },
  { concept: 'mentionsUser', field: 'mentionsUser', widget: 'text', labelKey: 'concept.mentionsUser.label', placeholderKey: 'concept.mentionsUser.placeholder' },
  { concept: 'domain', field: 'domain', widget: 'text', labelKey: 'concept.domain.label', placeholderKey: 'concept.domain.placeholder' },
  { concept: 'subreddit', field: 'subreddit', widget: 'text', labelKey: 'concept.subreddit.label', placeholderKey: 'concept.subreddit.placeholder' },
]

/** state の中で実際に指定されている概念 */
export function activeConcepts(state: QueryState): ConceptId[] {
  const active: ConceptId[] = []
  if (state.keywords.trim()) active.push('keywords')
  if (state.orGroups.some((g) => g.trim())) active.push('orAny')
  if (state.exactPhrase.trim()) active.push('exactPhrase')
  if (state.exclude.trim()) active.push('exclude')
  if (state.titleOnly) active.push('titleOnly')
  if (state.fromUser.trim()) active.push('fromUser')
  if (state.toUser.trim()) active.push('toUser')
  if (state.mentionsUser.trim()) active.push('mentionsUser')
  if (state.subreddit.trim()) active.push('subreddit')
  if (state.domain.trim()) active.push('domain')
  if (state.hashtag.trim()) active.push('hashtag')
  if (state.since || state.until) active.push('period')
  if (state.mediaOnly) active.push('mediaOnly')
  if (state.videoLength) active.push('videoLength')
  if (state.linksOnly) active.push('linksOnly')
  if (state.verifiedOnly) active.push('verifiedOnly')
  if (state.excludeReplies) active.push('excludeReplies')
  if (state.minLikes.trim()) active.push('minLikes')
  if (state.minReposts.trim()) active.push('minReposts')
  if (state.japaneseOnly) active.push('japaneseOnly')
  // newestFirst は初期値が ON のため、条件として数えると未入力でも注記が
  // 出てしまう。URLへの反映は各シリアライザが行い、注記・件数の対象外とする
  return active
}

export function defaultState(): QueryState {
  return {
    keywords: '',
    orGroups: [''],
    exactPhrase: '',
    exclude: '',
    titleOnly: false,
    fromUser: '',
    toUser: '',
    mentionsUser: '',
    subreddit: '',
    domain: '',
    hashtag: '',
    since: '',
    until: '',
    mediaOnly: false,
    videoLength: '',
    linksOnly: false,
    verifiedOnly: false,
    excludeReplies: false,
    minLikes: '',
    minReposts: '',
    japaneseOnly: false,
    newestFirst: true,
  }
}
