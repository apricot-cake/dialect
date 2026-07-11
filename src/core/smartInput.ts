import type { QueryState } from './types'
import { isIsoDate, tokenize } from './parse'
import { andTerms, exactPhrases, words } from './text'

/**
 * Smart input (issue #16): parse one free-form query line into condition
 * fragments. The grammar is concept vocabulary only (never site-specific
 * operators — those belong to each site's buildParts):
 *   -word        exclude
 *   "..."        exact phrase (also the escape hatch for literal -/#/@)
 *   from:user    sender (@user works too)
 *   #tag         hashtag
 *   since:/until:YYYY-MM-DD, or a bare period word (今週, yesterday, ...)
 *   min_faves:N, いいね>N, likes>N, >N  minimum likes (N accepts 1万/5千/10k)
 *   anything else stays a keyword — unreadable fragments are never dropped
 */

/** Condition fragments read from one input line. Arrays keep input order */
export interface SmartFragments {
  terms: string[]
  phrases: string[]
  excludes: string[]
  hashtags: string[]
  /** Last one wins when typed twice (single-value field) */
  fromUser: string | null
  since: string | null
  until: string | null
  minLikes: string | null
}

export function emptyFragments(): SmartFragments {
  return {
    terms: [],
    phrases: [],
    excludes: [],
    hashtags: [],
    fromUser: null,
    since: null,
    until: null,
    minLikes: null,
  }
}

export function hasFragments(f: SmartFragments): boolean {
  return (
    f.terms.length > 0 ||
    f.phrases.length > 0 ||
    f.excludes.length > 0 ||
    f.hashtags.length > 0 ||
    f.fromUser !== null ||
    f.since !== null ||
    f.until !== null ||
    f.minLikes !== null
  )
}

// ---- number vocabulary ----

/**
 * Read a count that may use Japanese units or k-suffix: 100 / 1万 / 1.5万 /
 * 5千 / 10k. Returns the plain digit string, or null when it is not a count
 */
export function parseCountWord(s: string): string | null {
  const m = /^([0-9]+(?:\.[0-9]+)?)(万|千|k)?$/i.exec(s.normalize('NFKC'))
  if (!m) return null
  const base = Number(m[1])
  if (!Number.isFinite(base)) return null
  const unit = m[2]?.toLowerCase()
  const factor = unit === '万' ? 10000 : unit === '千' || unit === 'k' ? 1000 : 1
  const value = Math.round(base * factor)
  // A fraction without a unit (e.g. "1.5") is not a like count
  if (!unit && m[1].includes('.')) return null
  return String(value)
}

// ---- period vocabulary ----

const isoOf = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const addDays = (d: Date, days: number): Date => {
  const next = new Date(d)
  next.setDate(next.getDate() + days)
  return next
}

/** Monday-based start of the week containing d (weeks start on Monday in ja) */
const startOfWeek = (d: Date): Date => addDays(d, -((d.getDay() + 6) % 7))

export interface PeriodRange {
  since: string
  until: string | null
}

/**
 * Bare period words (ja/en) → date range, evaluated against `now` so tests
 * stay deterministic. Calendar-based (今週 = Monday..today), matching what
 * the words mean in everyday speech rather than rolling N-day windows
 */
export function parsePeriodWord(word: string, now: Date): PeriodRange | null {
  const w = word.normalize('NFKC').toLowerCase()
  switch (w) {
    case '今日':
    case 'きょう':
    case 'today':
      return { since: isoOf(now), until: null }
    case '昨日':
    case 'きのう':
    case 'yesterday': {
      const y = isoOf(addDays(now, -1))
      return { since: y, until: y }
    }
    case '今週':
      return { since: isoOf(startOfWeek(now)), until: null }
    case '先週': {
      const start = addDays(startOfWeek(now), -7)
      return { since: isoOf(start), until: isoOf(addDays(start, 6)) }
    }
    case '今月':
      return { since: isoOf(new Date(now.getFullYear(), now.getMonth(), 1)), until: null }
    case '先月': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      return { since: isoOf(start), until: isoOf(end) }
    }
    case '今年':
      return { since: isoOf(new Date(now.getFullYear(), 0, 1)), until: null }
    case '去年':
    case '昨年': {
      const y = now.getFullYear() - 1
      return { since: isoOf(new Date(y, 0, 1)), until: isoOf(new Date(y, 11, 31)) }
    }
    default:
      return null
  }
}

/** Accept 2026-07-05 and 2026/07/05 (and one-digit month/day), normalized to ISO */
function parseDateWord(s: string): string | null {
  const normalized = s.normalize('NFKC')
  if (isIsoDate(normalized)) return normalized
  const m = /^(\d{4})[/.](\d{1,2})[/.](\d{1,2})$/.exec(normalized)
  if (!m) return null
  const iso = `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  return isIsoDate(iso) ? iso : null
}

// ---- minimum-likes vocabulary ----

const LIKE_WORDS = 'いいね|ふぁぼ|ファボ|likes?|favs?|faves?'

/** Token shapes that mean "at least N likes". N accepts the count vocabulary */
function parseMinLikes(token: string): string | null {
  const t = token.normalize('NFKC')
  let m = /^min_faves:(.+)$/i.exec(t)
  if (m) return parseCountWord(m[1])
  // いいね>100 / likes>=100 / >100 (a bare threshold defaults to likes,
  // the canonical reaction concept)
  m = new RegExp(`^(?:${LIKE_WORDS})?[>≧]=?(.+)$`, 'i').exec(t)
  if (m) return parseCountWord(m[1])
  // いいね100 / いいね1万以上 / 100いいね以上
  m = new RegExp(`^(?:${LIKE_WORDS})(.+?)(?:以上)?$`, 'i').exec(t)
  if (m) return parseCountWord(m[1])
  m = new RegExp(`^(.+?)(?:${LIKE_WORDS})(?:以上)?$`, 'i').exec(t)
  if (m) return parseCountWord(m[1])
  return null
}

// ---- the parser ----

/**
 * Parse one input line into fragments. `now` anchors the bare period words.
 * Tokens that fit no grammar fall back to keywords — same honesty rule as
 * the reverse-translation dialog's `ignored` (nothing is silently dropped)
 */
export function parseSmartInput(input: string, now: Date): SmartFragments {
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
    // since: / until: with an explicit date
    m = /^(since|until):(.+)$/i.exec(token)
    if (m) {
      const date = parseDateWord(m[2])
      if (date) {
        if (m[1].toLowerCase() === 'since') f.since = date
        else f.until = date
        continue
      }
      // Unreadable date — keep the whole token as a keyword below
    } else {
      // Bare period word (今週, yesterday, ...)
      const range = parsePeriodWord(token, now)
      if (range) {
        f.since = range.since
        f.until = range.until
        continue
      }
      const likes = parseMinLikes(token)
      if (likes) {
        f.minLikes = likes
        continue
      }
    }
    f.terms.push(token)
  }
  return f
}

// ---- applying fragments ----

/**
 * Merge fragments into the current conditions, always additively (adding a
 * condition only narrows — the project-wide all-AND rule). Word-list fields
 * append; single-value fields (sender, dates, likes) overwrite when given
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
    since: f.since ?? state.since,
    until: f.until ?? state.until,
    minLikes: f.minLikes ?? state.minLikes,
  }
}
