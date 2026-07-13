/**
 * Shared parser for docs/operator-checklist.md, used by both scripts/check-operators.ts
 * (operator-drift detection) and scripts/gen-health.ts (health.html data generation).
 *
 * Two responsibilities:
 *   1. Split the checklist into per-platform sections (`sectionFor`), keyed by a
 *      heading fragment (`CHECKLIST_HEADING`) that must appear in that platform's
 *      `## ` heading line.
 *   2. Parse each markdown table row within a section into a structured `ChecklistRow`
 *      (`parseRows`), and assemble the full per-platform breakdown (`parseChecklist`).
 *
 * This used to be inlined in check-operators.ts only; extracted so gen-health.ts can
 * reuse the exact same section-splitting/row-parsing logic without a duplicate copy
 * silently drifting from it.
 */
import type { PlatformId } from '@apricot-cake/dialect-core'

/**
 * Heading fragment for each platform's section in operator-checklist.md. A `## `
 * heading line containing this fragment belongs to that platform (YouTube/pixiv can
 * have multiple matching blocks, which get concatenated).
 */
export const CHECKLIST_HEADING: Record<PlatformId, string> = {
  // 'X(' 単体だと "## FANBOX(ログイン不要)" にも部分一致してしまう(FANBOX の
  // 「X(」を拾う)ため、見出し全体に近い断片で一意にする(2026-07-11 gen-health.ts の
  // 行数検査で発覚)
  x: 'X(要ログイン',
  bluesky: 'Bluesky',
  youtube: 'YouTube',
  niconico: 'niconico',
  seiga: 'ニコニコ静画',
  instagram: 'Instagram',
  pixiv: 'pixiv',
  misskey: 'Misskey',
  tumblr: 'tumblr',
  mastodon: 'Mastodon',
  fanbox: 'FANBOX',
  bilibili: 'bilibili',
  fantia: 'Fantia',
  google: 'Google',
}

/** Split `checklist` at every `## ` heading and return the blocks whose heading line contains `headingFragment`, concatenated. */
export function sectionFor(checklist: string, headingFragment: string): string {
  const blocks = checklist.split(/\n(?=## )/)
  const hit = blocks.filter((b) => {
    const firstLine = b.split('\n', 1)[0]
    return firstLine.startsWith('## ') && firstLine.includes(headingFragment)
  })
  return hit.join('\n')
}

/** One row of a checklist table: `優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果`. */
export interface ChecklistRow {
  priority: string
  target: string
  uiName: string
  /** The URL extracted out of the markdown link `[text](url)` in the 検証URL cell (null if unparseable). */
  verifyUrl: string | null
  expected: string
  lastChecked: string
  result: string
}

/** True for a markdown table separator row like `|---|---|...` or `|:--|--:|...`. */
function isSeparatorRow(cells: string[]): boolean {
  return cells.every((c) => /^:?-+:?$/.test(c))
}

/**
 * Parse every checklist table row found in `text` into a `ChecklistRow`. Skips
 * non-table lines, the header row (`優先 | ...`), and separator rows. Doesn't attempt
 * to handle exotic markdown escaping beyond a plain `| cell | cell | ... |` row and a
 * `[label](url)` link in the 検証URL cell.
 */
export function parseRows(text: string): ChecklistRow[] {
  const rows: ChecklistRow[] = []
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line.startsWith('|') || !line.endsWith('|')) continue
    const cells = line
      .slice(1, -1)
      .split('|')
      .map((c) => c.trim())
    if (cells.length !== 7) continue
    if (cells[0] === '優先') continue // header row
    if (isSeparatorRow(cells)) continue
    const [priority, target, uiName, verifyCell, expected, lastChecked, result] = cells
    const urlMatch = verifyCell.match(/\]\((.*?)\)/)
    rows.push({
      priority,
      target,
      uiName,
      verifyUrl: urlMatch ? urlMatch[1] : null,
      expected,
      lastChecked,
      result,
    })
  }
  return rows
}

export type ChecklistByPlatform = Partial<Record<PlatformId, ChecklistRow[]>>

/** Parse the whole checklist into a per-platform breakdown, using `CHECKLIST_HEADING` to locate each section. */
export function parseChecklist(checklist: string, platformIds: PlatformId[]): ChecklistByPlatform {
  const out: ChecklistByPlatform = {}
  for (const id of platformIds) {
    const section = sectionFor(checklist, CHECKLIST_HEADING[id])
    out[id] = parseRows(section)
  }
  return out
}
