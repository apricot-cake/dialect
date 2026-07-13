/**
 * Machine check for the recipe collection (recipes.html, issue #35).
 *
 * Why: recipe patches are hand-written QueryState fragments. Two things can
 * silently rot: (1) the permalink codec drifting so a recipe's link no
 * longer restores the same conditions, and (2) a recipe whose conditions
 * no platform can actually translate (a "dead" recipe that looks fine on
 * the page but opens nothing).
 *
 * What it checks, for every recipe:
 *   1. Round trip: paramsToQuery(stateToParams(state)) === state.
 *   2. Liveness: at least one platform's resolve().url is non-null.
 *
 * Run: npm run check:recipes   (via tsx)
 */
import {
  PLATFORMS,
  resolve,
  defaultState,
  stateToParams,
  paramsToQuery,
  type QueryState,
} from '@apricot-cake/dialect-core'
import { RECIPES } from '@/pages/recipesData'

let failures = 0
function fail(msg: string): void {
  failures++
  console.error(`✗ ${msg}`)
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

for (const recipe of RECIPES) {
  const state: QueryState = { ...defaultState(), ...recipe.patch }

  const roundTripped = paramsToQuery(stateToParams(state))
  if (!deepEqual(roundTripped, state)) {
    fail(`${recipe.id}: パーマリンクの往復で条件が変わる`)
  }

  const hasLiveSite = PLATFORMS.some((p) => resolve(p, state).url !== null)
  if (!hasLiveSite) {
    fail(`${recipe.id}: どのサイトでも検索URLが生成されない(死にレシピ)`)
  }
}

if (failures > 0) {
  console.error(`\ncheck:recipes — 失敗 ${failures} 件`)
  process.exit(1)
}
console.log(`check:recipes — OK(${RECIPES.length}本、全${PLATFORMS.length}サイトと突き合わせ)`)
