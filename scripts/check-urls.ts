/**
 * 各サイトの検索URLが「ちゃんと到達できるか」を HTTP で確かめる CLI スモークテスト。
 *
 * できること: 404 / 400 / 5xx などの構造的な壊れ(検索パスの変更やドメイン移転など)を、
 *   ブラウザを立ち上げずに全サイトまとめて高速に検知する。URLは実物の buildUrl から
 *   生成するので、プラットフォーム定義とズレない。
 * できないこと: ログイン必須 / JS描画 / bot対策のサイトは、HTTP 200 でも「検索結果が
 *   本当に出るか」までは判定できない(ログインpage や JSシェルが 200 で返るため)。
 *   それらは ⚠️ として「要ブラウザ/手動確認」に振り分ける。最終確認はブラウザで。
 *
 * 実行: npm run check:urls   (esbuild でバンドルして node で実行)
 */
import { PLATFORMS } from '@/core/platforms'
import { defaultState } from '@/core/concepts'
import type { PlatformDef, QueryState } from '@/core/types'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36'
const TIMEOUT_MS = 12000
const CONCURRENCY = 6

const SAMPLES: Array<{ name: string; state: QueryState }> = [
  { name: 'keyword', state: { ...defaultState(), terms: ['猫'] } },
  { name: 'hashtag', state: { ...defaultState(), hashtag: '猫' } },
]

type Verdict = 'ok' | 'maybe' | 'broken' | 'error'
interface Row {
  platform: string
  requiresLogin: boolean
  sample: string
  url: string
  status: number | string
  finalUrl: string
  verdict: Verdict
  note?: string
}

interface Task {
  platform: PlatformDef
  sample: string
  url: string
}

async function fetchStatus(
  url: string,
): Promise<{ status: number | string; finalUrl: string; error?: string }> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': UA, 'accept-language': 'ja,en;q=0.9' },
      redirect: 'follow',
      signal: ctrl.signal,
    })
    return { status: res.status, finalUrl: res.url }
  } catch (e) {
    return { status: 'ERR', finalUrl: url, error: (e as Error).message }
  } finally {
    clearTimeout(timer)
  }
}

function classify(
  requiresLogin: boolean,
  status: number | string,
  finalUrl: string,
): { verdict: Verdict; note?: string } {
  if (status === 'ERR') return { verdict: 'error', note: '接続失敗/タイムアウト' }
  const s = Number(status)
  if (s >= 200 && s < 300) {
    if (/login|signin|sign_in|accounts\.|\/i\/flow/i.test(finalUrl))
      return { verdict: 'maybe', note: 'ログインへ誘導(要ブラウザ確認)' }
    if (requiresLogin)
      return { verdict: 'maybe', note: '要ログイン: HTTP到達のみ確認(結果表示は未検証)' }
    return { verdict: 'ok' }
  }
  if (s === 401 || s === 403)
    return { verdict: 'maybe', note: `HTTP ${s}: bot/ログインブロックの可能性(ブラウザでは開ける場合あり)` }
  if (s >= 300 && s < 400) return { verdict: 'maybe', note: `リダイレクト ${s}` }
  return { verdict: 'broken', note: `HTTP ${s}` }
}

async function runPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

// 実物の buildUrl から検査対象URLを組み立てる(サンプルごと、URL重複は除外)
const tasks: Task[] = []
for (const platform of PLATFORMS) {
  const seen = new Set<string>()
  for (const sample of SAMPLES) {
    let url: string | null = null
    try {
      url = platform.buildUrl(sample.state)
    } catch {
      url = null
    }
    if (!url || seen.has(url)) continue
    seen.add(url)
    tasks.push({ platform, sample: sample.name, url })
  }
}

const rows: Row[] = await runPool(tasks, CONCURRENCY, async (task) => {
  const r = await fetchStatus(task.url)
  const { verdict, note } = classify(task.platform.requiresLogin, r.status, r.finalUrl)
  return {
    platform: task.platform.name,
    requiresLogin: task.platform.requiresLogin,
    sample: task.sample,
    url: task.url,
    status: r.status,
    finalUrl: r.finalUrl,
    verdict,
    note: note ?? r.error,
  }
})

const ICON: Record<Verdict, string> = { ok: '✅', maybe: '⚠️', broken: '❌', error: '❌' }
for (const r of rows) {
  const head = `${ICON[r.verdict]} ${r.platform.padEnd(12)} [${r.sample.padEnd(7)}] ${String(r.status).padEnd(4)}`
  console.log(`${head} ${r.url}${r.note ? `  — ${r.note}` : ''}`)
}

const ok = rows.filter((r) => r.verdict === 'ok')
const maybe = rows.filter((r) => r.verdict === 'maybe')
const broken = rows.filter((r) => r.verdict === 'broken' || r.verdict === 'error')

console.log(
  `\nSummary: ${rows.length} URLs — ✅ ${ok.length} ok / ⚠️ ${maybe.length} 要ブラウザ確認 / ❌ ${broken.length} broken`,
)
if (broken.length) {
  console.log('\n❌ BROKEN (要修正):')
  for (const r of broken) console.log(`  ${r.platform} [${r.sample}] ${r.status} ${r.url}  ${r.note ?? ''}`)
}
console.log(
  '\n凡例: ✅=HTTP到達OK(ログイン/JSサイトは結果表示まで保証しない) / ⚠️=要ブラウザ・手動確認 / ❌=構造的な壊れ(404/400/5xx)。',
)

// 壊れがあれば非0終了(CI やスクリプトからゲートに使えるように)
if (broken.length) process.exitCode = 1
