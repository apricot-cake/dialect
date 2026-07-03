import type { MessageKey } from '@/i18n'
import type { ConceptId, QueryState } from './types'
import { andTerms } from './text'

export const CONCEPT_LABEL_KEYS: Record<ConceptId, MessageKey> = {
  keywords: 'concept.keywords.label',
  exactPhrase: 'concept.exactPhrase.label',
  exclude: 'concept.exclude.label',
  titleOnly: 'concept.titleOnly.label',
  fromUser: 'concept.fromUser.label',
  excludeUser: 'concept.excludeUser.label',
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
  workType: 'concept.workType.label',
  resultType: 'concept.resultType.label',
  sortOrder: 'concept.sortOrder.label',
}

/** ビルダーに並ぶフィールドの定義。表示順・セクション分けは対応サイト数から自動計算する */
export interface FieldDef {
  concept: ConceptId
  field: keyof QueryState
  widget:
    | 'text'
    | 'number'
    | 'toggle'
    | 'period'
    | 'videoLength'
    | 'workType'
    | 'resultType'
    | 'terms'
    | 'sort'
  labelKey: MessageKey
  /** ⓘホバーで出す機能説明 */
  helpKey: MessageKey
  placeholderKey?: MessageKey
  /** trueならEnter区切りで複数の語を指定できる(値はスペース結合の文字列) */
  multi?: boolean
}

export const FIELDS: FieldDef[] = [
  // キーワードは1枠=1語。枠を足すと絞り込み(AND)。「または」は条件セットで表現する
  { concept: 'keywords', field: 'terms', widget: 'terms', labelKey: 'concept.keywords.label', helpKey: 'concept.keywords.help' },
  { concept: 'exactPhrase', field: 'exactPhrase', widget: 'text', labelKey: 'concept.exactPhrase.label', helpKey: 'concept.exactPhrase.help', placeholderKey: 'concept.exactPhrase.placeholder' },
  { concept: 'exclude', field: 'exclude', widget: 'text', labelKey: 'concept.exclude.label', helpKey: 'concept.exclude.help', placeholderKey: 'concept.exclude.placeholder', multi: true },
  { concept: 'fromUser', field: 'fromUser', widget: 'text', labelKey: 'concept.fromUser.label', helpKey: 'concept.fromUser.help', placeholderKey: 'concept.fromUser.placeholder' },
  { concept: 'hashtag', field: 'hashtag', widget: 'text', labelKey: 'concept.hashtag.label', helpKey: 'concept.hashtag.help', placeholderKey: 'concept.hashtag.placeholder', multi: true },
  { concept: 'period', field: 'since', widget: 'period', labelKey: 'concept.period.label', helpKey: 'concept.period.help' },
  { concept: 'titleOnly', field: 'titleOnly', widget: 'toggle', labelKey: 'concept.titleOnly.label', helpKey: 'concept.titleOnly.help' },
  { concept: 'mediaOnly', field: 'mediaOnly', widget: 'toggle', labelKey: 'concept.mediaOnly.label', helpKey: 'concept.mediaOnly.help' },
  { concept: 'videoLength', field: 'videoLength', widget: 'videoLength', labelKey: 'concept.videoLength.label', helpKey: 'concept.videoLength.help' },
  { concept: 'workType', field: 'workType', widget: 'workType', labelKey: 'concept.workType.label', helpKey: 'concept.workType.help' },
  { concept: 'resultType', field: 'resultType', widget: 'resultType', labelKey: 'concept.resultType.label', helpKey: 'concept.resultType.help' },
  { concept: 'japaneseOnly', field: 'japaneseOnly', widget: 'toggle', labelKey: 'concept.japaneseOnly.label', helpKey: 'concept.japaneseOnly.help' },
  { concept: 'sortOrder', field: 'sort', widget: 'sort', labelKey: 'concept.sortOrder.label', helpKey: 'concept.sortOrder.help' },
  { concept: 'toUser', field: 'toUser', widget: 'text', labelKey: 'concept.toUser.label', helpKey: 'concept.toUser.help', placeholderKey: 'concept.toUser.placeholder', multi: true },
  { concept: 'excludeUser', field: 'excludeUser', widget: 'text', labelKey: 'concept.excludeUser.label', helpKey: 'concept.excludeUser.help', placeholderKey: 'concept.excludeUser.placeholder', multi: true },
  { concept: 'minLikes', field: 'minLikes', widget: 'number', labelKey: 'concept.minLikes.label', helpKey: 'concept.minLikes.help', placeholderKey: 'concept.minLikes.placeholder' },
  { concept: 'minReposts', field: 'minReposts', widget: 'number', labelKey: 'concept.minReposts.label', helpKey: 'concept.minReposts.help', placeholderKey: 'concept.minReposts.placeholder' },
  { concept: 'excludeReplies', field: 'excludeReplies', widget: 'toggle', labelKey: 'concept.excludeReplies.label', helpKey: 'concept.excludeReplies.help' },
  { concept: 'linksOnly', field: 'linksOnly', widget: 'toggle', labelKey: 'concept.linksOnly.label', helpKey: 'concept.linksOnly.help' },
  { concept: 'verifiedOnly', field: 'verifiedOnly', widget: 'toggle', labelKey: 'concept.verifiedOnly.label', helpKey: 'concept.verifiedOnly.help' },
  { concept: 'mentionsUser', field: 'mentionsUser', widget: 'text', labelKey: 'concept.mentionsUser.label', helpKey: 'concept.mentionsUser.help', placeholderKey: 'concept.mentionsUser.placeholder' },
  { concept: 'domain', field: 'domain', widget: 'text', labelKey: 'concept.domain.label', helpKey: 'concept.domain.help', placeholderKey: 'concept.domain.placeholder' },
  { concept: 'subreddit', field: 'subreddit', widget: 'text', labelKey: 'concept.subreddit.label', helpKey: 'concept.subreddit.help', placeholderKey: 'concept.subreddit.placeholder', multi: true },
]

/** state の中で実際に指定されている概念 */
export function activeConcepts(state: QueryState): ConceptId[] {
  const active: ConceptId[] = []
  if (andTerms(state).length > 0) active.push('keywords')
  if (state.exactPhrase.trim()) active.push('exactPhrase')
  if (state.exclude.trim()) active.push('exclude')
  if (state.titleOnly) active.push('titleOnly')
  if (state.fromUser.trim()) active.push('fromUser')
  if (state.excludeUser.trim()) active.push('excludeUser')
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
  if (state.workType) active.push('workType')
  if (state.resultType) active.push('resultType')
  // 並び順は初期値(新しい順)のままなら条件として数えない(未入力でも注記が
  // 出てしまうため)。「おまかせ」も条件を課さない選択なので数えず、
  // ユーザーが意図的に選んだ「人気順」だけを注記・件数の対象にする
  if (state.sort === 'top') active.push('sortOrder')
  return active
}

export function defaultState(): QueryState {
  return {
    terms: [''],
    exactPhrase: '',
    exclude: '',
    titleOnly: false,
    fromUser: '',
    excludeUser: '',
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
    workType: '',
    resultType: '',
    sort: 'new',
  }
}
