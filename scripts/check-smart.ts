/**
 * Unit tests for the smart input (#16). Deterministic, no browser or network.
 *
 * Why this exists:
 *   The one-line grammar (exclude, exact phrase, sender, tag) is hand-written
 *   branching, so edits can quietly break existing readings. This puts it on
 *   the merge gate (CI) in the same style as check:reverse.
 *
 * What it checks:
 *   1. Grammar: representative input lines split into the expected fragments,
 *      and removed vocabulary (period words, like counts) stays keywords.
 *   2. Additive merge: mergeFragments only appends, never erases.
 *
 * Run: npm run check:smart   (executed directly via tsx)
 */
import { mergeFragments, parseSmartInput } from '@/core/smartInput'
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

// ---- 1. grammar ----------------------------------------------------------------

{
  const f = parseSmartInput('猫 -犬 "三毛 猫" @nasa #art')
  eq('terms', f.terms, ['猫'])
  eq('excludes', f.excludes, ['犬'])
  eq('phrases', f.phrases, ['三毛 猫'])
  eq('fromUser', f.fromUser, 'nasa')
  eq('hashtags', f.hashtags, ['art'])
}
{
  // from: form and full-width symbols
  const f = parseSmartInput('from:alice ＃タグ －宣伝')
  eq('from: form', f.fromUser, 'alice')
  eq('fullwidth hash', f.hashtags, ['タグ'])
  eq('fullwidth minus', f.excludes, ['宣伝'])
}
{
  // Removed vocabulary stays keywords: period and like-count conditions are
  // Add Condition picker territory, the input line never interprets them
  const f = parseSmartInput('今週 since:2026-01-01 いいね>100 min_faves:100')
  eq('no hidden vocabulary', f.terms, ['今週', 'since:2026-01-01', 'いいね>100', 'min_faves:100'])
}
{
  // "..." escape hatch: search symbol-leading words literally
  const f = parseSmartInput('"-犬" "#タグ"')
  eq('escaped tokens', f.phrases, ['-犬', '#タグ'])
  eq('no excludes', f.excludes, [])
}

// ---- 2. additive merge ---------------------------------------------------------

{
  const base = {
    ...defaultState(),
    terms: ['既存'],
    exclude: '広告',
    fromUser: 'olduser',
  }
  const merged = mergeFragments(base, parseSmartInput('新規 -宣伝 @newuser'))
  eq('terms append', merged.terms, ['既存', '新規'])
  eq('exclude append', merged.exclude, '広告 宣伝')
  eq('fromUser overwrite', merged.fromUser, 'newuser')
  // additive only: untouched fields keep their values
  eq('sort untouched', merged.sort, base.sort)
}
{
  // merging an empty line changes nothing (keeps the [''] invariant of terms)
  const merged = mergeFragments(defaultState(), parseSmartInput(''))
  eq('empty merge', merged, defaultState())
}

// ---- result --------------------------------------------------------------------

if (failures > 0) {
  console.error(`check:smart failed (${failures} failure${failures === 1 ? '' : 's'})`)
  process.exit(1)
}
console.log('check:smart passed')
