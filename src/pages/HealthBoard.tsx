import { useSyncExternalStore } from 'react'
import { PLATFORMS } from '@/core/platforms'
import { getLang, setLang, subscribe } from '@/i18n'
import { pt } from '@/i18n/pageCopy'
import { PlatformBadge } from '@/components/PlatformBadge'
import { StandalonePageHeader } from '@/components/StandalonePageHeader'
import { useDarkMode } from '@/hooks/useDarkMode'
import healthData from '@/generated/health.json'
import type { PlatformId } from '@/core/types'

interface HealthRow {
  priority: string
  target: string
  uiName: string
  verifyUrl: string | null
  expected: string
  lastChecked: string
  result: string
}

const HEALTH: Partial<Record<PlatformId, HealthRow[]>> = healthData

// 定期確認の目安(運用ルールに合わせて3か月=90日)。これを超えたら要再確認バッジを出す
const STALE_DAYS = 90

function isOk(result: string): boolean {
  return result.trim().startsWith('✅')
}

/** "2026-07-11(GUI操作)" のような接尾辞つきセルから先頭の ISO 日付だけを取り出す */
function parseDate(lastChecked: string): Date | null {
  const m = lastChecked.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / 86_400_000)
}

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
        ok
          ? 'bg-[oklch(0.9_0.09_150)] text-[oklch(0.32_0.09_150)]'
          : 'bg-[oklch(0.9_0.09_25)] text-[oklch(0.35_0.12_25)]'
      }`}
      aria-label={ok ? 'OK' : 'NG'}
    >
      {ok ? '✓' : '✕'}
    </span>
  )
}

function Row({ row, lang }: { row: HealthRow; lang: ReturnType<typeof getLang> }) {
  const ok = isOk(row.result)
  const date = parseDate(row.lastChecked)
  const stale = date !== null && daysSince(date) > STALE_DAYS
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border py-2.5 last:border-b-0">
      <div className="flex min-w-0 flex-1 basis-[240px] items-center gap-2">
        <StatusBadge ok={ok} />
        <span className="truncate text-[13px] font-medium text-fg">{row.uiName}</span>
        <code className="truncate rounded bg-secondary px-1.5 py-0.5 text-[11px] text-muted">
          {row.target}
        </code>
      </div>
      <div className="flex items-center gap-2 text-[11.5px] text-muted">
        <span>
          {pt(lang, 'health.lastChecked')}: {row.lastChecked}
        </span>
        {stale && (
          <span className="inline-flex items-center rounded-full bg-[oklch(0.88_0.09_75)] px-2 py-0.5 text-[10.5px] font-bold text-[oklch(0.4_0.1_70)]">
            {pt(lang, 'health.stale')}
          </span>
        )}
        {row.verifyUrl && (
          <a
            href={row.verifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent no-underline hover:underline"
          >
            {pt(lang, 'health.verifyLink')}
          </a>
        )}
      </div>
    </div>
  )
}

export default function HealthBoard() {
  const lang = useSyncExternalStore(subscribe, getLang)
  const [dark, setDark] = useDarkMode()

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <StandalonePageHeader
        titleKey="health.title"
        lang={lang}
        dark={dark}
        onToggleDark={() => setDark((d) => !d)}
        onToggleLang={() => setLang(lang === 'ja' ? 'en' : 'ja')}
      />
      <main className="mx-auto flex w-full max-w-[900px] flex-col gap-8 px-5 pt-4 pb-16">
        <p className="max-w-[68ch] text-[13.5px] leading-[1.7] text-muted">
          {pt(lang, 'health.intro')}
        </p>
        <div className="flex flex-col gap-2">
          {PLATFORMS.map((platform) => {
            const rows = HEALTH[platform.id] ?? []
            return (
              <section
                key={platform.id}
                className="flex flex-col gap-2 rounded-[14px] border border-border bg-card p-4"
              >
                <div className="flex items-center gap-2">
                  <PlatformBadge platform={platform} dark={dark} size={17} />
                  <h2 className="m-0 text-[14px] font-bold text-fg">{platform.name}</h2>
                </div>
                {rows.length === 0 ? (
                  <p className="text-[12.5px] text-faint">{pt(lang, 'health.emptyPlatform')}</p>
                ) : (
                  <div className="flex flex-col">
                    {rows.map((row, i) => (
                      <Row key={i} row={row} lang={lang} />
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      </main>
    </div>
  )
}
