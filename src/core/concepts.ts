import type { MessageKey } from '@/i18n'
import type { ConceptId, QueryState } from './types'

export const CONCEPT_LABEL_KEYS: Record<ConceptId, MessageKey> = {
  keywords: 'concept.keywords.label',
  exactPhrase: 'concept.exactPhrase.label',
  exclude: 'concept.exclude.label',
  fromUser: 'concept.fromUser.label',
  hashtag: 'concept.hashtag.label',
  period: 'concept.period.label',
  mediaOnly: 'concept.mediaOnly.label',
  japaneseOnly: 'concept.japaneseOnly.label',
  newestFirst: 'concept.newestFirst.label',
}

/** state の中で実際に指定されている概念 */
export function activeConcepts(state: QueryState): ConceptId[] {
  const active: ConceptId[] = []
  if (state.keywords.trim()) active.push('keywords')
  if (state.exactPhrase.trim()) active.push('exactPhrase')
  if (state.exclude.trim()) active.push('exclude')
  if (state.fromUser.trim()) active.push('fromUser')
  if (state.hashtag.trim()) active.push('hashtag')
  if (state.since || state.until) active.push('period')
  if (state.mediaOnly) active.push('mediaOnly')
  if (state.japaneseOnly) active.push('japaneseOnly')
  if (state.newestFirst) active.push('newestFirst')
  return active
}

export function defaultState(): QueryState {
  return {
    keywords: '',
    exactPhrase: '',
    exclude: '',
    fromUser: '',
    hashtag: '',
    since: '',
    until: '',
    mediaOnly: false,
    japaneseOnly: false,
    newestFirst: true,
  }
}
