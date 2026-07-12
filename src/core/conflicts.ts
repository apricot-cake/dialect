import type { MessageKey } from '@/i18n'
import type { QueryState } from './types'
import { andTerms, exactPhrases, words } from './text'

/**
 * 開く前に検知できる、必ず0件になる条件の組み合わせ。ブロックはせず警告のみ
 * (issue #44)。「絞りすぎでは」のような推測はせず、構造的に確実な自滅だけを対象にする
 */
export interface Conflict {
  messageKey: MessageKey
}

function norm(w: string): string {
  return w.trim().toLowerCase()
}

/** AND語群(含む)のどれかがexclude群にも含まれるか(同語を含む/除外の両方に指定=自滅) */
function sameWordConflict(included: string[], excluded: Set<string>): boolean {
  return included.some((w) => excluded.has(norm(w)))
}

/** OR群(このどれかを含む)の選択肢が全てexclude群にも含まれるか(選択肢が全滅) */
function orExhaustedConflict(orWords: string[], excluded: Set<string>): boolean {
  return orWords.length > 0 && orWords.every((w) => excluded.has(norm(w)))
}

export function detectConflicts(query: QueryState): Conflict[] {
  const conflicts: Conflict[] = []
  const excludeWords = new Set(words(query.exclude).map(norm))

  if (excludeWords.size > 0) {
    if (sameWordConflict(andTerms(query), excludeWords)) {
      conflicts.push({ messageKey: 'conflict.keywordsExclude' })
    }
    const phraseWords = exactPhrases(query).flatMap((p) => words(p))
    if (sameWordConflict(phraseWords, excludeWords)) {
      conflicts.push({ messageKey: 'conflict.exactPhraseExclude' })
    }
    if (orExhaustedConflict(words(query.keywordsOr), excludeWords)) {
      conflicts.push({ messageKey: 'conflict.keywordsOrExhausted' })
    }
  }

  const excludeHashtags = new Set(words(query.excludeHashtag).map(norm))
  if (excludeHashtags.size > 0) {
    if (sameWordConflict(words(query.hashtag), excludeHashtags)) {
      conflicts.push({ messageKey: 'conflict.hashtagExclude' })
    }
    if (orExhaustedConflict(words(query.hashtagOr), excludeHashtags)) {
      conflicts.push({ messageKey: 'conflict.hashtagOrExhausted' })
    }
  }

  if (query.since && query.until && query.since > query.until) {
    conflicts.push({ messageKey: 'conflict.periodReversed' })
  }
  if (query.pushedSince && query.pushedUntil && query.pushedSince > query.pushedUntil) {
    conflicts.push({ messageKey: 'conflict.pushedPeriodReversed' })
  }
  if (query.updatedSince && query.updatedUntil && query.updatedSince > query.updatedUntil) {
    conflicts.push({ messageKey: 'conflict.updatedPeriodReversed' })
  }

  return conflicts
}
