/**
 * Generates src/generated/health.json from docs/operator-checklist.md, for the
 * health.html operator-health board (issue #14). Each platform gets the list of
 * checklist rows parsed by scripts/lib/checklistParser.ts (priority/target/UI
 * name/verify URL/expected result/last-checked date/pass-fail).
 *
 * Run: npm run gen:health   (esbuild-bundled then run under node, same pattern as
 * gen:readings/check:operators). The output is committed; scripts/check-health.ts
 * fails CI if the checklist changed but health.json wasn't regenerated.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve as pathResolve } from 'node:path'
import { PLATFORMS } from '@/core/platforms'
import { parseChecklist, parseRows } from './lib/checklistParser'

const CHECKLIST_PATH = pathResolve(process.cwd(), 'docs/operator-checklist.md')
const OUT_PATH = pathResolve(process.cwd(), 'src/generated/health.json')

function main() {
  const checklist = readFileSync(CHECKLIST_PATH, 'utf8')
  const platformIds = PLATFORMS.map((p) => p.id)
  const health = parseChecklist(checklist, platformIds)

  // 網羅性チェック: 全節を合算した行数と、文書全体を素通しで数えた行数が一致するはず。
  // 一致しなければ CHECKLIST_HEADING の見出し断片が重複マッチ/漏れを起こしている疑い
  const perPlatformTotal = Object.values(health).reduce((n, rows) => n + (rows?.length ?? 0), 0)
  const wholeDocTotal = parseRows(checklist).length
  if (perPlatformTotal !== wholeDocTotal) {
    console.error(
      `🟥 行数が一致しない: サイト節ごとの合計 ${perPlatformTotal} 行 / チェックリスト全体を素通しで数えた行数 ${wholeDocTotal} 行。CHECKLIST_HEADING の見出し断片が重複マッチしているか、どこかの節が拾えていない`,
    )
    process.exitCode = 1
  }

  mkdirSync(dirname(OUT_PATH), { recursive: true })
  writeFileSync(OUT_PATH, JSON.stringify(health, null, 2) + '\n', 'utf8')
  console.log(
    `✅ ${OUT_PATH} を書き出した(${perPlatformTotal}行 / ${Object.keys(health).length}サイト)`,
  )
}

main()
