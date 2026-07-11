import { useEffect, useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import QRCode from 'qrcode'
import { t } from '@/i18n'

const SCRIM = 'dl-scrim fixed inset-0 z-[60]'
const POPUP =
  'dl-sheet fixed top-1/2 left-1/2 z-[61] flex max-h-[84vh] w-[min(360px,94vw)] flex-col overflow-hidden rounded-[18px] bg-card shadow-[0_24px_70px_oklch(0_0_0_/_0.32)] outline-none'

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

/**
 * 現在の条件のパーマリンクをQRコードで見せるダイアログ。
 * ローカル生成(qrcodeライブラリ)のみで、外部通信は発生させない
 */
export function QrDialog({
  open,
  onOpenChange,
  url,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 条件が1つでもあるときだけ渡る */
  url?: string
}) {
  const [dataUrl, setDataUrl] = useState('')

  useEffect(() => {
    if (!open || !url) return
    let cancelled = false
    QRCode.toDataURL(url, { margin: 1, width: 280 })
      .then((result) => {
        if (!cancelled) setDataUrl(result)
      })
      .catch(() => {
        if (!cancelled) setDataUrl('')
      })
    return () => {
      cancelled = true
    }
  }, [open, url])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className={SCRIM} />
        <Dialog.Popup className={POPUP}>
          <div className="flex items-center gap-3 px-6 pt-5 pb-1">
            <Dialog.Title className="m-0 text-base font-bold tracking-[-0.02em] text-label">
              {t('ui.qrTitle')}
            </Dialog.Title>
            <CloseButton />
          </div>
          <div className="flex flex-col items-center gap-3 px-6 pt-3 pb-6">
            <p className="m-0 self-start text-[11.5px] leading-[1.5] text-muted">
              {t('ui.qrHint')}
            </p>
            <div className="flex size-[280px] shrink-0 items-center justify-center rounded-[14px] bg-white p-3">
              {dataUrl && (
                <img src={dataUrl} alt={t('ui.qrTitle')} width={280} height={280} className="size-full" />
              )}
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
