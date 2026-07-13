/**
 * Automated accessibility gate (issue #37).
 *
 * Why: the UI leans heavily on custom widgets (condition chips, the concept
 * picker modal, dynamic support badges) rather than native form controls, so
 * accessibility regressions don't surface as type errors or broken builds —
 * they're silent unless someone actually drives the app with a keyboard or
 * screen reader. This script automates the part axe-core can check (WCAG
 * 2.1 A/AA rule violations) across the app's key states, light/dark themes,
 * and desktop/mobile widths. It does not replace the manual audit (focus
 * order, live regions, zoom, contrast-by-eye) described in
 * .claude/skills/operator-check's sibling doc — see the #37 issue body.
 *
 * What it does:
 *   1. Builds is assumed done already (CI runs `npm run build` first);
 *      starts a `vite preview` server against dist/.
 *   2. For each SCENARIO (a page + an optional interaction to reach a
 *      specific state — the picker modal, the reverse-translate dialog,
 *      the saved/history tabs, the QR modal) x each of light/dark x
 *      desktop/mobile, runs axe-core scoped to WCAG 2.1 A+AA tags.
 *   3. Violations matching ALLOWLIST (ruleId + selector prefix + reason)
 *      are logged but don't fail the gate. Anything else fails it.
 *
 * Run: npm run check:a11y   (via tsx; requires `npm run build` first and
 * a Playwright chromium install: `npx playwright install chromium`)
 */
import { preview, type PreviewServer } from 'vite'
import { chromium, type Page } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { ja } from '@apricot-cake/dialect-core'

const PORT = 4173

interface Scenario {
  name: string
  path: string
  prepare?: (page: Page) => Promise<void>
}

async function openPicker(page: Page): Promise<void> {
  await page.getByRole('button', { name: ja['ui.addCondition'] }).click()
  await page.getByRole('dialog').waitFor()
  // 概念検索の入力中の状態も含める(#37の設計メモ)
  await page.getByPlaceholder(ja['picker.search.placeholder']).fill('人気')
}

async function openReverse(page: Page): Promise<void> {
  await page.getByRole('button', { name: ja['reverse.button'] }).click()
  await page.getByRole('dialog').waitFor()
}

function openSaved(tab: 'saved' | 'history') {
  return async (page: Page): Promise<void> => {
    await page.getByRole('button', { name: ja['saved.open'] }).click()
    await page.getByRole('dialog').waitFor()
    if (tab === 'history') {
      await page.getByRole('button', { name: ja['saved.tab.history'] }).click()
    }
  }
}

async function openQr(page: Page): Promise<void> {
  await page.getByRole('button', { name: ja['ui.qrButton'] }).click()
  await page.getByRole('dialog').waitFor()
}

// クリア/共有/QR/保存ボタンは条件が確定値を持つときだけ表示される(2026-07-12の仕様)ため、
// 空の既定状態ではなくキーワード入りのURLで開く
const INDEX_WITH_CONDITION = '/dialect/?v=4&kw=%E3%83%86%E3%82%B9%E3%83%88'

const SCENARIOS: Scenario[] = [
  { name: 'index', path: INDEX_WITH_CONDITION },
  { name: 'index-picker', path: INDEX_WITH_CONDITION, prepare: openPicker },
  { name: 'index-reverse', path: INDEX_WITH_CONDITION, prepare: openReverse },
  { name: 'index-saved', path: INDEX_WITH_CONDITION, prepare: openSaved('saved') },
  { name: 'index-history', path: INDEX_WITH_CONDITION, prepare: openSaved('history') },
  { name: 'index-qr', path: INDEX_WITH_CONDITION, prepare: openQr },
  { name: 'health', path: '/dialect/health.html' },
  { name: 'matrix', path: '/dialect/matrix.html' },
  { name: 'about', path: '/dialect/about.html' },
  { name: 'recipes', path: '/dialect/recipes.html' },
  { name: 'guides', path: '/dialect/guides.html' },
  // マルチページ(#45)は全21ページが同じ骨格を共有するため、代表として1ページのみ確認する
  { name: 'site-guide (representative)', path: '/dialect/sites/x.html' },
]

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 375, height: 812 },
]

const THEMES: Array<'light' | 'dark'> = ['light', 'dark']

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

/**
 * 誤検知・意図的な例外の許容リスト。ruleIdとセレクタの前方一致、理由を明記する。
 * 濫用しない: 直せる指摘はここに逃さず直す。ここに乗るのは「調査済みで、当面は
 * 許容すると判断した」ものだけ
 */
const ALLOWLIST: ReadonlyArray<{ ruleId: string; selectorStartsWith?: string; reason: string }> = []

function isAllowed(ruleId: string, selector: string): { reason: string } | null {
  const hit = ALLOWLIST.find(
    (a) =>
      a.ruleId === ruleId && (!a.selectorStartsWith || selector.startsWith(a.selectorStartsWith)),
  )
  return hit ? { reason: hit.reason } : null
}

async function main(): Promise<void> {
  let server: PreviewServer | undefined
  let failures = 0
  let allowedCount = 0

  try {
    server = await preview({ root: process.cwd(), preview: { port: PORT }, logLevel: 'error' })
    const baseUrl = server.resolvedUrls?.local[0]
    if (!baseUrl) throw new Error('vite preview がURLを解決できなかった')

    const browser = await chromium.launch()

    for (const viewport of VIEWPORTS) {
      for (const theme of THEMES) {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          colorScheme: theme,
        })
        await context.addInitScript((t) => {
          localStorage.setItem('theme', t)
          localStorage.setItem('dialect.lang', 'ja')
        }, theme)

        for (const scenario of SCENARIOS) {
          const page = await context.newPage()
          const url = new URL(scenario.path, 'http://localhost:' + PORT).toString()
          await page.goto(url)
          if (scenario.prepare) {
            await scenario.prepare(page)
          }

          const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()

          const label = `${scenario.name} / ${theme} / ${viewport.name}`
          for (const violation of results.violations) {
            for (const node of violation.nodes) {
              const selector = node.target.join(' ')
              const allowed = isAllowed(violation.id, selector)
              if (allowed) {
                allowedCount++
                console.log(`⚪ [${label}] ${violation.id} @ ${selector} — 許容: ${allowed.reason}`)
              } else {
                failures++
                console.error(
                  `🟥 [${label}] ${violation.id} (${violation.impact}): ${violation.help}`,
                )
                console.error(`    ${selector}`)
              }
            }
          }
          await page.close()
        }
        await context.close()
      }
    }

    await browser.close()
  } finally {
    await server?.httpServer.close()
  }

  if (failures > 0) {
    console.error(`\ncheck:a11y — 失敗 ${failures} 件(許容 ${allowedCount} 件)`)
    process.exit(1)
  }
  console.log(
    `check:a11y — OK(${SCENARIOS.length}状態 × ${THEMES.length}テーマ × ${VIEWPORTS.length}幅、許容 ${allowedCount} 件)`,
  )
}

main()
