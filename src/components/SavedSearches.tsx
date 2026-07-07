import { useEffect, useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import type { StoredQuery } from '@/core/storage'
import { t } from '@/i18n'

const SCRIM = 'dl-scrim fixed inset-0 z-[60]'
const POPUP =
  'dl-sheet fixed top-1/2 left-1/2 z-[61] flex max-h-[84vh] w-[min(460px,94vw)] flex-col overflow-hidden rounded-[18px] bg-card shadow-[0_24px_70px_oklch(0_0_0_/_0.32)] outline-none'

function CloseButton() {
  return (
    <Dialog.Close
      aria-label={t('saved.close')}
      className="ml-auto inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-border text-muted"
      style={{ background: 'color-mix(in oklch, var(--card) 70%, transparent)' }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </Dialog.Close>
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

/** 保存した検索の一覧ダイアログ。行クリックで復元、×で削除 */
export function SavedListDialog({
  open,
  onOpenChange,
  saved,
  onRestore,
  onDelete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  saved: StoredQuery[]
  onRestore: (entry: StoredQuery) => void
  onDelete: (params: string) => void
}) {
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
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
