/**
 * Unit tests for the smart input (#16) and its suggestion vocabulary (#17).
 * Deterministic, no browser or network.
 *
 * Why this exists:
 *   The one-line grammar (exclude, exact phrase, sender, tag, period words,
 *   count words) is hand-written branching, so adding vocabulary can quietly
 *   break existing readings. This puts it on the merge gate (CI) in the same
 *   style as check:reverse.
 *
 * What it checks:
 *   1. Grammar: representative input lines split into the expected fragments.
 *   2. Vocabulary: period words (今週/先週/...) and count words (1万/5千/10k)
 *      against a fixed clock.
 *   3. Additive merge: mergeFragments only appends, never erases.
 *   4. Suggestions: compound tokens like 「先週バズった猫の動画」 yield
 *      candidates plus the peeled remainder (猫), and are never auto-applied
 *      (they stay out of the fragments).
 *
 * Run: npm run check:smart   (executed directly via tsx)
 */
import { mergeFragments, parseCountWord, parsePeriodWord, parseSmartInput } from '@/core/smartInput'
import { suggestFor } from '@/core/smartSuggest'
import { defaultState } from '@/core/concepts'

let failures = 0
function fail(msg: string): void {
  failures++
  console.error(`✗ ${msg}`)
}
function eq(label: string, actual: unknown, expected: unknown): void {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  if (a !== e) fail(`${label}: got ${a}, want ${e}`)
}

// 2026-07-11 is a Saturday; the fixed clock keeps 今週/先週 deterministic
const NOW = new Date(2026, 6, 11, 12, 0, 0)

// ---- 1. grammar ----------------------------------------------------------------

{
  const f = parseSmartInput('猫 -犬 "三毛 猫" @nasa #art since:2026-01-01 until:2026/6/30', NOW)
  eq('terms', f.terms, ['猫'])
  eq('excludes', f.excludes, ['犬'])
  eq('phrases', f.phrases, ['三毛 猫'])
  eq('fromUser', f.fromUser, 'nasa')
  eq('hashtags', f.hashtags, ['art'])
  eq('since', f.since, '2026-01-01')
  eq('until', f.until, '2026-06-30')
}
{
  // from: form, full-width symbols, min_faves
  const f = parseSmartInput('from:alice ＃タグ －宣伝 min_faves:100', NOW)
  eq('from: form', f.fromUser, 'alice')
  eq('fullwidth hash', f.hashtags, ['タグ'])
  eq('fullwidth minus', f.excludes, ['宣伝'])
  eq('min_faves', f.minLikes, '100')
}
{
  // like-word + threshold variations
  eq('likes>', parseSmartInput('いいね>100', NOW).minLikes, '100')
  eq('bare >', parseSmartInput('>1万', NOW).minLikes, '10000')
  eq('likes 以上', parseSmartInput('いいね1万以上', NOW).minLikes, '10000')
  eq('N likes 以上', parseSmartInput('100いいね以上', NOW).minLikes, '100')
  eq('en likes', parseSmartInput('likes>=5k', NOW).minLikes, '5000')
}
{
  // unreadable fragments stay as keywords (nothing is silently dropped)
  const f = parseSmartInput('since:いつか なにか', NOW)
  eq('unreadable date stays', f.terms, ['since:いつか', 'なにか'])
  eq('no since', f.since, null)
}
{
  // "..." escape hatch: search symbol-leading words literally
  const f = parseSmartInput('"-犬" "#タグ"', NOW)
  eq('escaped tokens', f.phrases, ['-犬', '#タグ'])
  eq('no excludes', f.excludes, [])
}

// ---- 2. vocabulary -------------------------------------------------------------

eq('count 1万', parseCountWord('1万'), '10000')
eq('count 1.5万', parseCountWord('1.5万'), '15000')
eq('count 5千', parseCountWord('5千'), '5000')
eq('count 10k', parseCountWord('10k'), '10000')
eq('count bare fraction rejected', parseCountWord('1.5'), null)
eq('count words rejected', parseCountWord('たくさん'), null)

eq('今日', parsePeriodWord('今日', NOW), { since: '2026-07-11', until: null })
eq('昨日', parsePeriodWord('昨日', NOW), { since: '2026-07-10', until: '2026-07-10' })
eq('今週', parsePeriodWord('今週', NOW), { since: '2026-07-06', until: null })
eq('先週', parsePeriodWord('先週', NOW), { since: '2026-06-29', until: '2026-07-05' })
eq('今月', parsePeriodWord('今月', NOW), { since: '2026-07-01', until: null })
eq('先月', parsePeriodWord('先月', NOW), { since: '2026-06-01', until: '2026-06-30' })
eq('去年', parsePeriodWord('去年', NOW), { since: '2025-01-01', until: '2025-12-31' })
eq('yesterday', parsePeriodWord('yesterday', NOW), { since: '2026-07-10', until: '2026-07-10' })
eq('not a period', parsePeriodWord('猫', NOW), null)

{
  const f = parseSmartInput('猫 今週', NOW)
  eq('bare period word consumed', f.terms, ['猫'])
  eq('bare period word since', f.since, '2026-07-06')
}

// ---- 3. additive merge ---------------------------------------------------------

{
  const base = {
    ...defaultState(),
    terms: ['既存'],
    exclude: '広告',
    fromUser: 'olduser',
    minLikes: '10',
  }
  const merged = mergeFragments(base, parseSmartInput('新規 -宣伝 @newuser 今週', NOW))
  eq('terms append', merged.terms, ['既存', '新規'])
  eq('exclude append', merged.exclude, '広告 宣伝')
  eq('fromUser overwrite', merged.fromUser, 'newuser')
  eq('minLikes kept', merged.minLikes, '10')
  eq('since set', merged.since, '2026-07-06')
  // additive only: untouched fields keep their values
  eq('sort untouched', merged.sort, base.sort)
}
{
  // merging an empty line changes nothing (keeps the [''] invariant of terms)
  const merged = mergeFragments(defaultState(), parseSmartInput('', NOW))
  eq('empty merge', merged, defaultState())
}

// ---- 4. suggestions ------------------------------------------------------------

{
  // The canonical example from issue #17: candidates come out of the
  // compound token and the remainder is 「猫」
  const f = parseSmartInput('先週バズった猫の動画', NOW)
  eq('compound stays a keyword', f.terms, ['先週バズった猫の動画'])
  const s = suggestFor(f.terms, defaultState(), NOW)
  const byConcept = Object.fromEntries(s.map((x) => [x.concept, x]))
  eq('suggests video', byConcept.resultType?.patch, { resultType: 'video' })
  eq('suggests buzz', byConcept.minLikes?.patch, { minLikes: '10000' })
  eq('suggests period', byConcept.period?.patch, { since: '2026-06-29', until: '2026-07-05' })
  // every candidate keeps 猫 in the peeled remainder
  for (const x of s) {
    if (!x.remainder.includes('猫')) fail(`remainder keeps 猫: got ${JSON.stringify(x.remainder)}`)
  }
}
{
  // exact single-token match leaves an empty remainder
  const s = suggestFor(['イラスト'], defaultState(), NOW)
  eq('exact match', s[0]?.patch, { workType: 'illust' })
  eq('exact match remainder', s[0]?.remainder, '')
}
{
  // concepts whose value is already set are not suggested again
  const state = { ...defaultState(), resultType: 'video' as const }
  const s = suggestFor(['動画'], state, NOW)
  eq('no duplicate suggestion', s.length, 0)
}
{
  // English matches whole tokens only (substrings would misfire: delivery→live)
  eq('en exact', suggestFor(['live'], defaultState(), NOW)[0]?.concept, 'liveOnly')
  eq('en no substring', suggestFor(['delivery'], defaultState(), NOW).length, 0)
}

// ---- result --------------------------------------------------------------------

if (failures > 0) {
  console.error(`check:smart failed (${failures} failure${failures === 1 ? '' : 's'})`)
  process.exit(1)
}
console.log('check:smart passed')
