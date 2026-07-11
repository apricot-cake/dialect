import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import type { Backup, HistoryEntry, StoredQuery } from '@/core/storage'
import { applyBackup, exportBackup, parseBackup, toQuery } from '@/core/storage'
import { searchSummary } from '@/core/preview'
import { getLang, t, tf } from '@/i18n'

const SCRIM = 'dl-scrim fixed inset-0 z-[60]'
const POPUP =
  'dl-sheet fixed top-1/2 left-1/2 z-[61] flex max-h-[84vh] w-[min(460px,94vw)] flex-col overflow-hidden rounded-[18px] bg-card shadow-[0_24px_70px_oklch(0_0_0_/_0.32)] outline-none'

/** Same active-chip accent as the picker's filter chips */
function activeTabStyle(on: boolean): CSSProperties | undefined {
  if (!on) return undefined
  return {
    borderColor: 'color-mix(in oklch, var(--accent-bright) 55%, transparent)',
    background: 'color-mix(in oklch, var(--accent-bright) 14%, transparent)',
  }
}

/**
 * Relative time for history rows ("3分前" / "3 minutes ago"). Uses the
 * standard Intl API so no per-language dictionary is needed.
 */
function relativeTime(ts: number, now: number): string {
  const rtf = new Intl.RelativeTimeFormat(getLang(), { numeric: 'auto' })
  const sec = Math.round((ts - now) / 1000)
  const abs = Math.abs(sec)
  if (abs < 60) return rtf.format(sec, 'second')
  if (abs < 3600) return rtf.format(Math.trunc(sec / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.trunc(sec / 3600), 'hour')
  if (abs < 86400 * 30) return rtf.format(Math.trunc(sec / 86400), 'day')
  if (abs < 86400 * 365) return rtf.format(Math.trunc(sec / (86400 * 30)), 'month')
  return rtf.format(Math.trunc(sec / (86400 * 365)), 'year')
}

function CloseButton() {
  return (
    <Dialog.Close
      aria-label={t('saved.close')}
      className="ml-auto inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-border text-muted"
      style={{ background: 'color-mix(in oklch, var(--card) 70%, transparent)' }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </Dialog.Close>
  )
}

function TrashIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    </svg>
  )
}

function countEntries(raw: string | undefined): number {
  if (!raw) return 0
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.length : 0
  } catch {
    return 0
  }
}

function downloadBackup(backup: Backup) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dialect-backup-${new Date(backup.exportedAt).toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

type ImportState =
  | { status: 'idle' }
  | { status: 'invalid' }
  | { status: 'confirm'; backup: Backup }

/**
 * この端末のlocalStorage(dialect.*名前空間)をJSONファイルへ書き出し/読み込む。
 * 読み込みは即反映せず、統合(足し合わせ)か置き換えかを確認してから
 * localStorageへ適用し、ページを再読み込みしてApp全体の状態を作り直す
 */
function BackupControls() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importState, setImportState] = useState<ImportState>({ status: 'idle' })

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const backup = typeof reader.result === 'string' ? parseBackup(reader.result) : null
      setImportState(backup ? { status: 'confirm', backup } : { status: 'invalid' })
    }
    reader.onerror = () => setImportState({ status: 'invalid' })
    reader.readAsText(file)
  }

  const apply = (replace: boolean) => {
    if (importState.status !== 'confirm') return
    applyBackup(importState.backup, replace)
    location.reload()
  }

  if (importState.status === 'confirm') {
    const saved = countEntries(importState.backup.data['dialect.saved.v1'])
    const history = countEntries(importState.backup.data['dialect.history.v1'])
    return (
      <div className="flex flex-col gap-2.5 rounded-[12px] border border-border bg-card p-3">
        <p className="m-0 text-[12px] leading-[1.5] text-muted">
          {tf('saved.backup.confirmSummary', { saved: String(saved), history: String(history) })}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-noscale
            onClick={() => apply(false)}
            className="inline-flex h-9 cursor-pointer items-center rounded-full bg-accent px-4 text-[12.5px] font-semibold text-white"
          >
            {t('saved.backup.merge')}
          </button>
          <button
            type="button"
            data-noscale
            onClick={() => apply(true)}
            className="inline-flex h-9 cursor-pointer items-center rounded-full border border-border bg-card px-4 text-[12.5px] font-semibold text-muted"
          >
            {t('saved.backup.replace')}
          </button>
          <button
            type="button"
            data-noscale
            onClick={() => setImportState({ status: 'idle' })}
            className="inline-flex h-9 cursor-pointer items-center rounded-full px-3 text-[12.5px] font-semibold text-faint"
          >
            {t('saved.save.cancel')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          data-noscale
          onClick={() => downloadBackup(exportBackup(Date.now()))}
          className="inline-flex h-8 cursor-pointer items-center rounded-full border border-border bg-card px-3.5 text-[12px] font-semibold text-muted hover:text-fg"
        >
          {t('saved.backup.export')}
        </button>
        <button
          type="button"
          data-noscale
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex h-8 cursor-pointer items-center rounded-full border border-border bg-card px-3.5 text-[12px] font-semibold text-muted hover:text-fg"
        >
          {t('saved.backup.import')}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) handleFile(file)
          }}
        />
      </div>
      {importState.status === 'invalid' && (
        <span className="text-[11.5px] text-muted">{t('saved.backup.invalid')}</span>
      )}
    </div>
  )
}

/** 現在の条件を名前付きで保存するダイアログ。名前欄は条件の要約をプリフィルする */
export function SaveSearchDialog({
  open,
  onOpenChange,
  defaultName,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultName: string
  onSave: (name: string) => void
}) {
  const [name, setName] = useState(defaultName)
  // 開くたびに、そのときの条件要約を初期名として入れ直す
  useEffect(() => {
    if (open) setName(defaultName)
  }, [open, defaultName])

  const trimmed = name.trim()
  const submit = () => {
    if (!trimmed) return
    onSave(trimmed)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className={SCRIM} />
        <Dialog.Popup className={POPUP}>
          <div className="flex items-center gap-3 px-6 pt-5 pb-1">
            <Dialog.Title className="m-0 text-base font-bold tracking-[-0.02em] text-label">
              {t('saved.save.title')}
            </Dialog.Title>
            <CloseButton />
          </div>
          <div className="flex flex-col gap-3 px-6 pt-3 pb-6">
            <label className="flex flex-col gap-1.5 text-[12px] font-medium text-muted">
              {t('saved.save.nameLabel')}
              <input
                type="text"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing && trimmed) {
                    e.preventDefault()
                    submit()
                  }
                }}
                placeholder={t('saved.save.namePlaceholder')}
                className="h-[42px] w-full rounded-[11px] border border-border bg-card px-3.5 text-[15px] text-fg outline-none focus:border-[color:color-mix(in_oklch,var(--accent-bright)_55%,var(--border))]"
              />
            </label>
            <div className="mt-1 flex items-center justify-end gap-2.5">
              <Dialog.Close className="inline-flex h-10 cursor-pointer items-center rounded-full border border-border bg-card px-5 text-sm font-semibold text-muted">
                {t('saved.save.cancel')}
              </Dialog.Close>
              <button
                type="button"
                data-noscale
                disabled={!trimmed}
                onClick={submit}
                className="inline-flex h-10 cursor-pointer items-center rounded-full bg-accent px-5 text-sm font-semibold text-white disabled:cursor-default disabled:opacity-45"
              >
                {t('saved.save.confirm')}
              </button>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/**
 * 保存した検索と自動記録の履歴を「保存 / 履歴」の2タブで見せる一覧ダイアログ。
 * 行クリックで復元、履歴行は名前を付けて保存(昇格)もできる
 */
export function SavedListDialog({
  open,
  onOpenChange,
  saved,
  history,
  historyEnabled,
  onRestore,
  onDelete,
  onDeleteHistory,
  onClearHistory,
  onToggleHistoryEnabled,
  onPromote,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  saved: StoredQuery[]
  history: HistoryEntry[]
  historyEnabled: boolean
  onRestore: (entry: { params: string }) => void
  onDelete: (params: string) => void
  onDeleteHistory: (params: string) => void
  onClearHistory: () => void
  onToggleHistoryEnabled: (enabled: boolean) => void
  onPromote: (entry: HistoryEntry) => void
}) {
  const [tab, setTab] = useState<'saved' | 'history'>('saved')
  // Reopening always starts on the saved tab (the primary, user-curated list)
  useEffect(() => {
    if (open) setTab('saved')
  }, [open])
  const now = Date.now()

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className={SCRIM} />
        <Dialog.Popup className={POPUP}>
          <div className="flex items-center gap-3 px-6 pt-5 pb-1">
            <Dialog.Title className="m-0 text-base font-bold tracking-[-0.02em] text-label">
              {t('saved.title')}
            </Dialog.Title>
            <CloseButton />
          </div>
          <div className="flex gap-1.5 px-6 pt-2 pb-1">
            {(
              [
                ['saved', t('saved.tab.saved')],
                ['history', t('saved.tab.history')],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                data-noscale
                aria-pressed={tab === id}
                className="h-[32px] cursor-pointer rounded-full border border-border bg-card px-3.5 text-[13px] font-semibold text-fg"
                style={activeTabStyle(tab === id)}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
          {tab === 'saved' ? (
            <div className="dl-modal-scroll flex min-h-0 flex-col overflow-y-auto px-[18px] pt-2 pb-5">
              {/* 仕組みの説明: localStorage はこの端末ローカル。持ち運びは URL コピーで */}
              <p className="mx-1.5 mb-3 text-[11.5px] leading-[1.5] text-muted">
                {t('saved.hint')}
              </p>
              {saved.length === 0 ? (
                <div className="px-3 py-10 text-center text-[13px] leading-[1.6] text-muted">
                  {t('saved.empty')}
                </div>
              ) : (
                <ul className="flex flex-col gap-1">
                  {saved.map((entry) => (
                    <li key={entry.params} className="flex items-center gap-1">
                      <button
                        type="button"
                        data-noscale
                        className="dl-pick-row min-w-0 flex-1 truncate rounded-[10px] border border-transparent px-3 py-2.5 text-left text-[14px] font-semibold text-label hover:border-border hover:bg-card hover:shadow-[0_2px_10px_oklch(0_0_0_/_0.05)]"
                        title={t('saved.restore')}
                        onClick={() => onRestore(entry)}
                      >
                        {entry.name}
                      </button>
                      <button
                        type="button"
                        data-noscale
                        aria-label={t('saved.delete')}
                        title={t('saved.delete')}
                        className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-[10px] text-faint hover:text-fg"
                        onClick={() => onDelete(entry.params)}
                      >
                        <TrashIcon />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="dl-modal-scroll flex min-h-0 flex-col overflow-y-auto px-[18px] pt-2 pb-5">
              <p className="mx-1.5 mb-3 text-[11.5px] leading-[1.5] text-muted">
                {t('history.hint')}
              </p>
              {history.length === 0 ? (
                <div className="px-3 py-10 text-center text-[13px] leading-[1.6] text-muted">
                  {t('history.empty')}
                </div>
              ) : (
                <ul className="flex flex-col gap-1">
                  {history.map((entry) => (
                    <li key={entry.params} className="flex items-center gap-1">
                      <button
                        type="button"
                        data-noscale
                        className="dl-pick-row flex min-w-0 flex-1 flex-col items-start gap-[3px] rounded-[10px] border border-transparent px-3 py-2 text-left hover:border-border hover:bg-card hover:shadow-[0_2px_10px_oklch(0_0_0_/_0.05)]"
                        title={t('saved.restore')}
                        onClick={() => onRestore(entry)}
                      >
                        <span className="w-full truncate text-[14px] font-semibold text-label">
                          {searchSummary(toQuery(entry))}
                        </span>
                        <span className="text-[11px] text-muted">
                          {relativeTime(entry.lastUsedAt, now)}
                        </span>
                      </button>
                      <button
                        type="button"
                        data-noscale
                        aria-label={t('history.promote')}
                        title={t('history.promote')}
                        className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-[10px] text-faint hover:text-fg"
                        onClick={() => onPromote(entry)}
                      >
                        {/* bookmark-plus: promote a history row into a named saved search */}
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                          <path d="M12 7v6M9 10h6" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        data-noscale
                        aria-label={t('saved.delete')}
                        title={t('saved.delete')}
                        className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-[10px] text-faint hover:text-fg"
                        onClick={() => onDeleteHistory(entry.params)}
                      >
                        <TrashIcon />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mx-1.5 mt-4 flex items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2 text-[12px] font-medium text-muted">
                  <input
                    type="checkbox"
                    checked={!historyEnabled}
                    onChange={(e) => onToggleHistoryEnabled(!e.target.checked)}
                    className="size-4 accent-[var(--accent)]"
                  />
                  {t('history.disable')}
                </label>
                {history.length > 0 && (
                  <button
                    type="button"
                    data-noscale
                    className="inline-flex h-8 cursor-pointer items-center rounded-full border border-border bg-card px-3.5 text-[12px] font-semibold text-muted hover:text-fg"
                    onClick={onClearHistory}
                  >
                    {t('history.clearAll')}
                  </button>
                )}
              </div>
            </div>
          )}
          <div className="border-t border-border px-[18px] pt-3 pb-4">
            <BackupControls />
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
