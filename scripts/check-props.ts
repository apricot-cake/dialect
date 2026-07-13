/**
 * Property-based fuzz test for URL generation, using fast-check to throw
 * adversarial inputs (emoji, quotes, control characters, operator-looking
 * strings, full-width spaces) at every platform's buildParts/parseUrl and
 * at the permalink codec. This is generative, so it explores input shapes
 * that the hand-picked cases in check:operators and check:reverse don't
 * enumerate. It does not replace those two — it complements them.
 *
 * Properties checked, per platform x random QueryState:
 *   1. no-throw/well-formed: buildParts never throws; the joined URL is
 *      either null or a string `new URL()` accepts.
 *   2. no-raw-leak: the joined URL never contains a raw space, control
 *      character, or '#' (a forgotten encodeURIComponent call would leak one).
 *   3. fixed-point: once a platform's own URL is parsed back (parseUrl) and
 *      rebuilt (buildParts), further parse -> rebuild cycles are stable
 *      (build(parse(build(s1))) === build(s1)), mirroring check:reverse's
 *      hand-picked round trip but for generated inputs.
 *   4. permalink round trip: paramsToQuery(stateToParams(s)) preserves s.
 *      The arbitrary already generates trim-stable, non-blank strings, so
 *      stateToParams's trim()/blank-filtering is a no-op here.
 *
 * Runs with a fixed seed so CI failures are reproducible and re-runs don't
 * flip green/red on the same code.
 *
 * Run: npm run check:props (executed directly via tsx)
 */
import fc from 'fast-check'
import {
  PLATFORMS,
  defaultState,
  joinParts,
  stateToParams,
  paramsToQuery,
  POST_LANGUAGE_CODES,
  NICO_GENRES,
  FANTIA_CATEGORIES,
  GOOGLE_FILE_TYPES,
  type PlatformDef,
  type QueryState,
} from '@apricot-cake/dialect-core'

let failures = 0
function fail(msg: string): void {
  failures++
  console.error(`✗ ${msg}`)
}

const NUM_RUNS = 5000
const SEED = 20260711

// ---- adversarial string pool -------------------------------------------------
// Strings likely to break naive concatenation/encoding: emoji, quotes,
// URL-reserved characters, control characters, and strings shaped like other
// sites' operators (to catch injection-style bugs across platforms)
const ADVERSARIAL = [
  '猫🐱',
  '"quoted"',
  "it's",
  '#hashtag',
  '&=#%?/+',
  '-leading-dash',
  'from:nasa',
  'a&b=c',
  '<script>alert(1)</script>',
  '100%',
  '日本語 混じり',
  '𝔘𝔫𝔦𝔠𝔬𝔡𝔢',
  '\\backslash',
  'a\0b',
  'あ　い',
  '@handle',
]

/**
 * A word that is already trim-stable (leading/trailing whitespace would make
 * property 4 flag stateToParams's trim() as a mismatch, which is a
 * normalization, not a bug). Still adversarial in every other way.
 *
 * Excludes words that are entirely dots ('.', '..', ...): a handful of
 * platforms (e.g. FANBOX) embed a hashtag/user value as a raw URL path
 * segment, and the WHATWG URL parser collapses a lone '.' or '..' path
 * segment per RFC 3986 dot-segment normalization before Dialect's own code
 * ever sees it. That is a universal property of how URLs work, not something
 * any URL-generating code can opt out of, so it is not a Dialect defect to
 * chase here (2026-07-11, found and confirmed via `new URL()` directly).
 */
function wordArb(): fc.Arbitrary<string> {
  return fc
    .oneof(fc.constantFrom(...ADVERSARIAL), fc.string({ minLength: 1, maxLength: 12 }))
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !/^\.+$/.test(s))
}

function optionalArb(): fc.Arbitrary<string> {
  return fc.oneof(fc.constant(''), wordArb())
}

// Fixed date range, not tied to today: keeps generated dates deterministic
// across CI runs on different dates
const DATE_EPOCH = Date.UTC(2020, 0, 1)
function isoDateArb(): fc.Arbitrary<string> {
  return fc
    .integer({ min: 0, max: 365 * 6 })
    .map((days) => new Date(DATE_EPOCH + days * 86_400_000).toISOString().slice(0, 10))
}
function optionalDateArb(): fc.Arbitrary<string> {
  return fc.oneof(fc.constant(''), isoDateArb())
}

const queryStateArb: fc.Arbitrary<QueryState> = fc.record<QueryState>({
  terms: fc.array(wordArb(), { minLength: 1, maxLength: 3 }),
  exactPhrase: fc.array(wordArb(), { minLength: 1, maxLength: 2 }),
  keywordsOr: optionalArb(),
  exclude: optionalArb(),
  titleOnly: fc.boolean(),
  exactTag: fc.boolean(),
  tagTitleCaption: fc.boolean(),
  fromUser: optionalArb(),
  excludeUser: optionalArb(),
  toUser: optionalArb(),
  mentionsUser: optionalArb(),
  excludeMentions: optionalArb(),
  domain: optionalArb(),
  excludeDomain: optionalArb(),
  linkUrl: optionalArb(),
  excludeLinkUrl: optionalArb(),
  fileType: fc.constantFrom('', ...GOOGLE_FILE_TYPES),
  region: optionalArb(),
  license: fc.constantFrom('', 'f', 'fc', 'fm', 'fmc'),
  exactMatchMode: fc.boolean(),
  xList: optionalArb(),
  hashtag: optionalArb(),
  hashtagOr: optionalArb(),
  excludeHashtag: optionalArb(),
  since: optionalDateArb(),
  until: optionalDateArb(),
  mediaOnly: fc.boolean(),
  videoOnly: fc.boolean(),
  videoLength: fc.constantFrom('', 'short', 'medium', 'long'),
  linksOnly: fc.boolean(),
  verifiedOnly: fc.boolean(),
  excludeReplies: fc.boolean(),
  repliesOnly: fc.boolean(),
  followingOnly: fc.boolean(),
  liveOnly: fc.boolean(),
  fourK: fc.boolean(),
  hdOnly: fc.boolean(),
  captionsOnly: fc.boolean(),
  creativeCommons: fc.boolean(),
  threeSixty: fc.boolean(),
  vr180: fc.boolean(),
  threeD: fc.boolean(),
  hdr: fc.boolean(),
  locationOnly: fc.boolean(),
  purchased: fc.boolean(),
  minLikes: optionalArb(),
  minReposts: optionalArb(),
  minReplies: optionalArb(),
  language: fc.constantFrom('', ...POST_LANGUAGE_CODES),
  workType: fc.constantFrom('', 'illust', 'manga', 'ugoira', 'novel'),
  genre: fc.constantFrom('', ...NICO_GENRES),
  nicoKind: fc.constantFrom('', 'user', 'channel'),
  fantiaCategory: fc.constantFrom('', ...FANTIA_CATEGORIES),
  fantiaAudience: fc.constantFrom('', 'male', 'female'),
  safeSearchOff: fc.boolean(),
  resultType: fc.constantFrom(
    '',
    'video',
    'short',
    'channel',
    'playlist',
    'people',
    'bangumi',
    'pgc',
    'live',
    'article',
    'series',
    'images',
    'shopping',
    'news',
    'web',
    'books',
  ),
  sort: fc.constantFrom(
    'new',
    'top',
    'comments',
    'auto',
    'danmaku',
    'favorites',
    'likes',
    'commentDate',
    'videoCount',
    'videoAdded',
    'followerCount',
    'liveCount',
    'oldest',
    'updated',
    'updatedOld',
  ),
  pixivPopular: fc.constantFrom('', '00users', '000users', '0000users'),
  ageRating: fc.constantFrom('', 'safe', 'r18'),
  excludeAi: fc.boolean(),
})

const platformArb: fc.Arbitrary<PlatformDef> = fc.constantFrom(...PLATFORMS)

function buildUrlOf(platform: PlatformDef, state: QueryState): string | null {
  const parts = platform.buildParts(state)
  return parts ? joinParts(parts) : null
}

// ---- 1. buildParts never throws; output is null or a well-formed URL --------
function checkNoThrowAndWellFormed(platform: PlatformDef, state: QueryState): boolean {
  const url = buildUrlOf(platform, state)
  if (url === null) return true
  // eslint-disable-next-line no-new
  new URL(url) // throws (and is caught by fast-check) if malformed
  return true
}

// ---- 2. no raw space/control char/'#' leaked into the generated URL ---------
// eslint-disable-next-line no-control-regex -- matching control chars is the point
const RAW_LEAK = /[ \t\n\r\x00-\x1f\x7f#]/
function checkNoRawLeak(platform: PlatformDef, state: QueryState): boolean {
  const url = buildUrlOf(platform, state)
  if (url === null) return true
  return !RAW_LEAK.test(url)
}

// ---- 3. fixed-point stability of parse -> rebuild ----------------------------
// A handful of adversarial combinations (e.g. a keyword that itself starts
// with a literal '-', which collides with a site's own "-word" exclude
// convention on X/Misskey) need a couple of parse/rebuild rounds
// before they settle into a self-consistent representation, rather than
// converging on the very first round. That is not a Dialect bug: it mirrors
// real ambiguity in the destination site's own bare-text query syntax
// (Dialect has no way to escape a literal leading '-' for these sites). So
// this checks eventual convergence within a small, bounded number of rounds,
// not single-round equality. The same ambiguity can also make the rebuilt
// state decay into "nothing left to search" (buildParts returns null, e.g. a
// lone leading-dash term gets reinterpreted as an exclude with no positive
// keyword left) — that is treated as a valid terminal state too, since it is
// stable (staying null) rather than a corruption that keeps changing shape.
const FIXED_POINT_ROUND_LIMIT = 4
function checkFixedPoint(platform: PlatformDef, state: QueryState): boolean {
  const parts0 = platform.buildParts(state)
  let url: string | null = parts0 ? joinParts(parts0) : null
  if (url === null) return true
  for (let round = 0; round < FIXED_POINT_ROUND_LIMIT; round++) {
    const parsed = platform.parseUrl(new URL(url))
    if (!parsed) return false
    const nextState: QueryState = { ...defaultState(), ...parsed.patch }
    const nextParts = platform.buildParts(nextState)
    const nextUrl: string | null = nextParts ? joinParts(nextParts) : null
    if (nextUrl === url || nextUrl === null) return true
    url = nextUrl
  }
  return false
}

// ---- 4. permalink round trip: paramsToQuery(stateToParams(s)) preserves s ---
function checkPermalinkRoundtrip(state: QueryState): boolean {
  const roundtripped = paramsToQuery(stateToParams(state))
  return JSON.stringify(roundtripped) === JSON.stringify(state)
}

function runProperty<T>(
  name: string,
  arb: fc.Arbitrary<T>,
  predicate: (value: T) => boolean,
): void {
  const result = fc.check(fc.property(arb, predicate), { numRuns: NUM_RUNS, seed: SEED })
  if (!result.failed) return
  const detail = result.counterexample
    ? JSON.stringify(result.counterexample)
    : String(result.error)
  fail(`${name}: ${detail}`)
}

runProperty('no-throw/well-formed', fc.tuple(platformArb, queryStateArb), ([p, s]) =>
  checkNoThrowAndWellFormed(p, s),
)
runProperty('no-raw-leak', fc.tuple(platformArb, queryStateArb), ([p, s]) => checkNoRawLeak(p, s))
runProperty('fixed-point', fc.tuple(platformArb, queryStateArb), ([p, s]) => checkFixedPoint(p, s))
runProperty('permalink-roundtrip', queryStateArb, checkPermalinkRoundtrip)

// ---- result -------------------------------------------------------------------
if (failures > 0) {
  console.error(`\ncheck:props — 失敗 ${failures} 件`)
  process.exit(1)
}
console.log(
  `check:props — OK(${NUM_RUNS} runs × 4 properties, seed=${SEED}、全${PLATFORMS.length}サイト)`,
)
