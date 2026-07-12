import type { QueryState } from './types'
import { tokenize } from './parse'
import { andTerms, exactPhrases, words } from './text'

/**
 * Smart input (issue #16): parse one free-form query line into condition
 * fragments. The grammar is limited to the notation people already type
 * into any search box by habit (never site-specific operators — those
 * belong to each site's buildParts):
 *   -word        exclude
 *   "..."        exact phrase (also the escape hatch for literal -/#/@)
 *   from:user    sender (@user works too)
 *   #tag         hashtag
 *   anything else stays a keyword — unreadable fragments are never dropped
 * Vocabulary-shaped readings (period words like 今週, like-count phrases)
 * were removed together with the "did you mean" suggestions: word lists are
 * never exhaustive, so those conditions belong to the Add Condition picker
 */

/** Condition fragments read from one input line. Arrays keep input order */
export interface SmartFragments {
  terms: string[]
  phrases: string[]
  excludes: string[]
  hashtags: string[]
  /** Last one wins when typed twice (single-value field) */
  fromUser: string | null
}

export function emptyFragments(): SmartFragments {
  return {
    terms: [],
    phrases: [],
    excludes: [],
    hashtags: [],
    fromUser: null,
  }
}

export function hasFragments(f: SmartFragments): boolean {
  return (
    f.terms.length > 0 ||
    f.phrases.length > 0 ||
    f.excludes.length > 0 ||
    f.hashtags.length > 0 ||
    f.fromUser !== null
  )
}

// ---- the parser ----

/**
 * Parse one input line into fragments. Tokens that fit no grammar fall back
 * to keywords — same honesty rule as the reverse-translation dialog's
 * `ignored` (nothing is silently dropped)
 */
export function parseSmartInput(input: string): SmartFragments {
  const f = emptyFragments()
  for (const token of tokenize(input)) {
    // "..." — exact phrase, and the escape hatch (content stays literal)
    if (token.startsWith('"')) {
      const inner = token.replace(/^"/, '').replace(/"$/, '').trim()
      if (inner) f.phrases.push(inner)
      continue
    }
    // -word / -"..." — exclude
    if (/^[-－]/.test(token) && token.length > 1) {
      const inner = token.slice(1).replace(/^"/, '').replace(/"$/, '').trim()
      if (inner) f.excludes.push(inner)
      continue
    }
    // #tag
    if (/^[#＃]/.test(token) && token.length > 1) {
      f.hashtags.push(token.slice(1))
      continue
    }
    // from:user / @user
    let m = /^from:(.+)$/i.exec(token)
    if (!m) m = /^[@＠](.+)$/.exec(token)
    if (m) {
      f.fromUser = m[1].replace(/^[@＠]+/, '')
      continue
    }
    f.terms.push(token)
  }
  return f
}

// ---- applying fragments ----

/**
 * Merge fragments into the current conditions, always additively (adding a
 * condition only narrows — the project-wide all-AND rule). Word-list fields
 * append; the single-value field (sender) overwrites when given
 */
export function mergeFragments(state: QueryState, f: SmartFragments): QueryState {
  const terms = [...andTerms(state), ...f.terms]
  const phrases = [...exactPhrases(state), ...f.phrases]
  return {
    ...state,
    terms: terms.length > 0 ? terms : [''],
    exactPhrase: phrases.length > 0 ? phrases : [''],
    exclude: [...words(state.exclude), ...f.excludes].join(' '),
    hashtag: [...words(state.hashtag), ...f.hashtags].join(' '),
    fromUser: f.fromUser ?? state.fromUser,
  }
}
