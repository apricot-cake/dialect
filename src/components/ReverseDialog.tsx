import { useEffect, useMemo, useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import type { QueryState } from '@/core/types'
import { parseSearchUrl } from '@/core/reverse'
import { searchSummary } from '@/core/preview'
import { PlatformBadge } from './PlatformBadge'
import { t } from '@/i18n'

const SCRIM = 'dl-scrim fixed inset-0 z-[60]'
const POPUP =
  'dl-sheet fixed top-1/2 left-1/2 z-[61] flex max-h-[84vh] w-[min(460px,94vw)] flex-col overflow-hidden rounded-[18px] bg-card shadow-[0_24px_70px_oklch(0_0_0_/_0.32)] outline-none'

/**
 * 検索URLを貼り付けて条件へ逆翻訳するダイアログ。入力のたびに読み取り結果
 * (どのサイトか・読める条件・読めない部分)をプレビューし、「条件にする」で適用する
 */
export function ReverseDialog({
  open,
  onOpenChange,
  dark,
  hasConditions,
  onApply,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  dark: boolean
  /** いま条件があるか(適用すると置き換わる注意書きを出す) */
  hasConditions: boolean
  onApply: (state: QueryState) => void
}) {
  const [input, setInput] = useState('')
  // 開くたびに空から(前回の貼り付けを引きずらない)
  useEffect(() => {
    if (open) setInput('')
  }, [open])
  const result = useMemo(() => parseSearchUrl(input), [input])
  const submit = () => {
    if (result) onApply(result.state)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className={SCRIM} />
        <Dialog.Popup className={POPUP}>
          <div className="flex items-center gap-3 px-6 pt-5 pb-1">
            <Dialog.Title className="m-0 text-base font-bold tracking-[-0.02em] text-label">
              {t('reverse.title')}
            </Dialog.Title>
            <Dialog.Close
              aria-label={t('reverse.close')}
              className="ml-auto inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-border text-muted"
              style={{ background: 'color-mix(in oklch, var(--card) 70%, transparent)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </Dialog.Close>
          </div>
          <div className="flex flex-col gap-3 px-6 pt-3 pb-6">
            <p className="m-0 text-[11.5px] leading-[1.5] text-muted">{t('reverse.hint')}</p>
            <input
              type="url"
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing && result) {
                  e.preventDefault()
                  submit()
                }
              }}
              placeholder={t('reverse.placeholder')}
              className="h-[42px] w-full rounded-[11px] border border-border bg-card px-3.5 text-[14px] text-fg outline-none focus:border-[color:color-mix(in_oklch,var(--accent-bright)_55%,var(--border))]"
            />
            {input.trim() !== '' &&
              (result ? (
                <div className="flex flex-col gap-2 rounded-[11px] border border-border px-3.5 py-3">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-label">
                    {result.platform ? (
                      <>
                        <PlatformBadge platform={result.platform} dark={dark} />
                        {result.platform.name}
                      </>
                    ) : (
                      t('reverse.dialectUrl')
                    )}
                  </div>
                  <div className="text-[13px] leading-[1.55] text-fg">
                    {searchSummary(result.state)}
                  </div>
                  {result.ignored.length > 0 && (
                    <div className="text-[11.5px] leading-[1.5] text-muted">
                      {t('reverse.ignoredLabel')}: {result.ignored.join(' / ')}
                    </div>
                  )}
                  {hasConditions && (
                    <div className="text-[11.5px] leading-[1.5] text-muted">
                      {t('reverse.replace')}
                    </div>
                  )}
                </div>
              ) : (
                <p className="m-0 text-[12px] leading-[1.55] text-muted">{t('reverse.error')}</p>
              ))}
            <div className="mt-1 flex items-center justify-end gap-2.5">
              <Dialog.Close className="inline-flex h-10 cursor-pointer items-center rounded-full border border-border bg-card px-5 text-sm font-semibold text-muted">
                {t('reverse.cancel')}
              </Dialog.Close>
              <button
                type="button"
                data-noscale
                disabled={!result}
                onClick={submit}
                className="inline-flex h-10 cursor-pointer items-center rounded-full bg-accent px-5 text-sm font-semibold text-white disabled:cursor-default disabled:opacity-45"
              >
                {t('reverse.apply')}
              </button>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
