/**
 * Freshness check for src/generated/health.json: regenerates it in memory from the
 * current docs/operator-checklist.md and diffs against the committed file. If the
 * checklist was updated (dates/results changed) without re-running gen:health, this
 * fails loudly with instructions, same drift-detection style as check-readings.ts.
 *
 * Run: npm run check:health
 */
import { readFileSync } from 'node:fs'
import { resolve as pathResolve } from 'node:path'
import { PLATFORMS } from '@/core/platforms'
import { parseChecklist } from './lib/checklistParser'

const CHECKLIST_PATH = pathResolve(process.cwd(), 'docs/operator-checklist.md')
const GENERATED_PATH = pathResolve(process.cwd(), 'src/generated/health.json')

const checklist = readFileSync(CHECKLIST_PATH, 'utf8')
const fresh = parseChecklist(
  checklist,
  PLATFORMS.map((p) => p.id),
)
const freshText = JSON.stringify(fresh, null, 2) + '\n'

let committedText: string
try {
  committedText = readFileSync(GENERATED_PATH, 'utf8')
} catch {
  console.error(
    `🟥 ${GENERATED_PATH} が無い。\`npm run gen:health\` を実行して生成し、コミットしてください。`,
  )
  process.exit(1)
}

if (freshText !== committedText) {
  console.error(
    '🟥 docs/operator-checklist.md と src/generated/health.json がズレています(チェックリストを編集したのに再生成し忘れている)。`npm run gen:health` を実行して再生成し、差分をコミットしてください。',
  )
  process.exit(1)
}

console.log('health.json はチェックリストと一致しています')
