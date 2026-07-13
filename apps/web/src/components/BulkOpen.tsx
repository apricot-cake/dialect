import { useState } from 'react'
import { PLATFORMS, type PlatformId, type Resolution } from '@apricot-cake/dialect-core'
import { loadBulkOpenExcluded, persistBulkOpenExcluded } from '@/core/storage'
import { t, tf } from '@/i18n'
import { GROUPS } from '@/lib/platformGroups'
import { PlatformBadge } from './PlatformBadge'

/**
 * Opens every currently-selected, currently-openable site in its own tab.
 * Must stay a synchronous loop: popup-permission is tied to the click's user
 * gesture, so an await/setTimeout between window.open calls would get every
 * tab after the first blocked. `noopener` as a window.open feature string
 * makes even the allowed case return null, breaking blocked-tab detection —
 * so we open plain and null out `opener` by hand instead.
 */
function openAll(urls: string[]): number {
  let blocked = 0
  for (const url of urls) {
    const w = window.open(url, '_blank')
    if (w) w.opener = null
    else blocked++
  }
  return blocked
}

/** 画面2冒頭のbgHint脇に置く「まとめて開く」ボタン+サイト選択パネル */
export function BulkOpen({
  resolutions,
  dark,
  onLaunch,
}: {
  resolutions: Map<string, Resolution>
  dark: boolean
  /** Called once per bulk-open click (counts as a single executed search) */
  onLaunch: () => void
}) {
  const [excluded, setExcluded] = useState<Set<PlatformId>>(() => new Set(loadBulkOpenExcluded()))
  const [panelOpen, setPanelOpen] = useState(false)
  const [blocked, setBlocked] = useState(0)

  const persist = (next: Set<PlatformId>) => persistBulkOpenExcluded([...next])
  const toggle = (id: PlatformId) => {
    setExcluded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      persist(next)
      return next
    })
  }
  const selectAll = () => {
    setExcluded(new Set())
    persist(new Set())
  }
  const deselectAll = () => {
    const all = new Set(PLATFORMS.map((p) => p.id))
    setExcluded(all)
    persist(all)
  }

  const openable = PLATFORMS.filter((p) => !excluded.has(p.id) && resolutions.get(p.id)?.url)

  const handleClick = () => {
    if (openable.length === 0) return
    const urls = openable.map((p) => resolutions.get(p.id)!.url!)
    setBlocked(openAll(urls))
    onLaunch()
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          data-noscale
          disabled={openable.length === 0}
          onClick={handleClick}
          className="dl-add inline-flex h-11 cursor-pointer items-center gap-[9px] rounded-full bg-accent pr-5 pl-4 text-sm font-semibold text-white shadow-[0_1px_3px_oklch(0_0_0_/_0.06)] disabled:cursor-default disabled:opacity-45"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <path d="M15 3h6v6" />
            <path d="M10 14 21 3" />
          </svg>
          {tf('bulk.open', { n: String(openable.length) })}
        </button>
        <button
          type="button"
          data-noscale
          aria-pressed={panelOpen}
          onClick={() => setPanelOpen((o) => !o)}
          className="dl-clear inline-flex h-11 cursor-pointer items-center gap-[7px] rounded-full border border-border bg-card pr-5 pl-4 text-sm font-semibold text-muted shadow-[0_1px_3px_oklch(0_0_0_/_0.06)]"
        >
          {t('bulk.choose')}
        </button>
      </div>
      {blocked > 0 && (
        <div className="px-1 text-[11.5px] leading-[1.5] text-muted">
          {tf('bulk.blocked', { n: String(blocked) })}
        </div>
      )}
      {panelOpen && (
        <div className="dl-glass flex flex-col gap-3.5 rounded-[14px] p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold tracking-[0.04em] text-faint uppercase">
              {t('bulk.choose')}
            </span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={selectAll}
                className="cursor-pointer border-none bg-transparent p-0 text-[12px] font-semibold text-accent-bright"
              >
                {t('bulk.selectAll')}
              </button>
              <button
                type="button"
                onClick={deselectAll}
                className="cursor-pointer border-none bg-transparent p-0 text-[12px] font-semibold text-muted"
              >
                {t('bulk.clearAll')}
              </button>
            </div>
          </div>
          {GROUPS.map(({ group, labelKey }) => {
            const platforms = PLATFORMS.filter((p) => p.group === group)
            if (platforms.length === 0) return null
            return (
              <div key={group} className="flex flex-col gap-1.5">
                <h4 className="m-0 text-[10px] font-bold tracking-[0.09em] text-faint uppercase">
                  {t(labelKey)}
                </h4>
                <div
                  className="grid gap-x-3 gap-y-1.5"
                  style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}
                >
                  {platforms.map((p) => (
                    <label
                      key={p.id}
                      className="flex cursor-pointer items-center gap-2 text-[13px] text-fg"
                    >
                      <input
                        type="checkbox"
                        checked={!excluded.has(p.id)}
                        onChange={() => toggle(p.id)}
                        className="size-4 accent-[var(--accent)]"
                      />
                      <PlatformBadge platform={p} dark={dark} size={14} />
                      {p.name}
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
