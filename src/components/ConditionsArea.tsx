import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { ConceptId, QueryState } from '@/core/types'
import { CONCEPT_MAP } from '@/core/conceptDefs'
import { t } from '@/i18n'
import type { SmartFragments } from '@/core/smartInput'
import type { SmartSuggestion } from '@/core/smartSuggest'
import { useCoarsePointer } from '@/hooks/useCoarsePointer'
import { ConditionBar } from './ConditionBar'
import { SmartInput } from './SmartInput'

// バー追加・削除時のFLIPと降ってくる出現(デザインの motionFeel='spring' 相当)
const SPRING = { duration: 0.64, ease: [0.16, 1, 0.3, 1] as const }

export interface ChipsApi {
  chips: Partial<Record<ConceptId, string[]>>
  raw: Partial<Record<ConceptId, string>>
  onRaw: (concept: ConceptId, value: string) => void
  onCommit: (concept: ConceptId) => void
  onRemoveChip: (concept: ConceptId, index: number) => void
}

/**
 * 下部スクロールピルの縮小判定。ピルがバーや追加ボタンと重なったら
 * アイコンだけの丸ボタンに切り替える(pad 6pxのAABB交差)
 */
function usePillCompact(): boolean {
  const [compact, setCompact] = useState(false)
  const measure = useCallback(() => {
    const pill = document.querySelector('[data-scroll-pill]')?.querySelector('button')
    if (!pill) return
    const pr = pill.getBoundingClientRect()
    const pad = 6
    const targets = document.querySelectorAll(
      '[data-screen-label="conditions"] [data-bar], [data-screen-label="conditions"] [data-add-btn]',
    )
    const hit = Array.from(targets).some((el) => {
      const r = el.getBoundingClientRect()
      return (
        r.left < pr.right + pad &&
        r.right > pr.left - pad &&
        r.top < pr.bottom + pad &&
        r.bottom > pr.top - pad
      )
    })
    // 同値ならstateを触らない(毎コミット計測による無限レンダー防止)
    setCompact((prev) => (prev === hit ? prev : hit))
  }, [])
  useEffect(() => {
    const scroller = document.querySelector('[data-bars-scroll]')
    scroller?.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      scroller?.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [measure])
  // 毎コミット直後と、FLIPアニメーション(640ms)が落ち着いた後に再計測する
  useEffect(() => {
    const raf = requestAnimationFrame(measure)
    const timer = setTimeout(measure, 700)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
    }
  })
  return compact
}

function MouseIcon({ up }: { up?: boolean }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <rect x="6" y="3" width="12" height="18" rx="6" />
      <path
        d="M12 7v3"
        style={{ animation: `${up ? 'dl-bob-up' : 'dl-bob'} 1.5s ease-in-out infinite` }}
      />
    </svg>
  )
}

/** タッチ端末向けの指(タップ)アイコン。マウスの代わりにピルの先頭/末尾へ置く */
function TapIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
      <path d="M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1" />
      <path d="M10 9.5V5a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10" />
      <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </svg>
  )
}

/** 画面1: 検索条件のバー列。内部スクロール+下部に画面2へのスクロールピル */
export function ConditionsArea({
  query,
  added,
  dark,
  chipsApi,
  patch,
  onApplySmart,
  onAdoptSuggestion,
  removeConcept,
  onClear,
  shareUrl,
  onSave,
  onShowQr,
  onOpenReverse,
  onOpenPicker,
  onGoLinks,
}: {
  query: QueryState
  added: ConceptId[]
  dark: boolean
  chipsApi: ChipsApi
  patch: (patch: Partial<QueryState>) => void
  onApplySmart: (fragments: SmartFragments) => void
  onAdoptSuggestion: (suggestion: SmartSuggestion) => void
  removeConcept: (concept: ConceptId) => void
  /** 条件が1つでもあるときだけ渡る。undefined ならクリアボタンを出さない */
  onClear?: () => void
  /** いまの条件を丸ごと表すパーマリンク。条件が1つでもあるときだけ渡る */
  shareUrl?: string
  /** 保存ダイアログを開く。条件が1つでもあるときだけ渡る */
  onSave?: () => void
  /** QRコード表示ダイアログを開く。条件が1つでもあるときだけ渡る */
  onShowQr?: () => void
  /** 検索URLの読み込みダイアログを開く(常時表示。空の状態からの入口にもなる) */
  onOpenReverse: () => void
  onOpenPicker: () => void
  onGoLinks: () => void
}) {
  const pillCompact = usePillCompact()
  // URLコピーの一時フィードバック(「コピーしました」表示)。少し経つと元へ戻す
  const [copied, setCopied] = useState(false)
  const copyLink = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* クリップボードが使えない環境では何もしない(アドレスバーから手動コピー可) */
    }
  }
  // Keywords are no longer a fixed slot (demoted to a regular concept by the
  // smart input): bars follow `added` alone, so an empty search shows zero
  // bars and just the input line
  const barDefs = added.map((c) => CONCEPT_MAP[c])
  // タッチ端末では上スワイプがブラウザの引っ張り更新と紛らわしいので、ピルはタップで案内する
  const coarse = useCoarsePointer()
  const scrollLabel = t(coarse ? 'ui.tapToLinks' : 'ui.scrollToLinks')

  return (
    <section
      data-screen-label="conditions"
      className="relative flex h-dvh w-full flex-col overflow-hidden"
    >
      <div
        data-bars-scroll
        className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-5 pt-24 pb-10"
        style={{ justifyContent: 'safe center' }}
      >
        <div data-bars-list className="flex w-full max-w-[620px] flex-col items-stretch gap-4">
          {/* The single pure entry line: committing drops chips onto the
              bars below and the line goes back to empty */}
          <motion.div layout transition={SPRING} className="flex w-full items-start gap-2.5">
            <div className="dl-bar-spacer w-[30px] shrink-0" />
            <SmartInput
              query={query}
              dark={dark}
              onApply={onApplySmart}
              onAdopt={onAdoptSuggestion}
            />
            <div className="dl-remove-outer-slot w-[30px] shrink-0" />
          </motion.div>
          <AnimatePresence initial={false}>
            {barDefs.map((def) => (
              <motion.div
                key={def.id}
                layout
                data-bar={def.id}
                className="relative flex w-full flex-col gap-2"
                initial={{ opacity: 0, y: -14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={SPRING}
              >
                <div className="flex w-full items-center gap-2.5">
                  <ConditionBar
                    def={def}
                    query={query}
                    dark={dark}
                    chips={chipsApi.chips[def.id] ?? []}
                    raw={chipsApi.raw[def.id] ?? ''}
                    onRaw={(value) => chipsApi.onRaw(def.id, value)}
                    onCommit={() => chipsApi.onCommit(def.id)}
                    onRemoveChip={(index) => chipsApi.onRemoveChip(def.id, index)}
                    patch={patch}
                    onRemove={() => removeConcept(def.id)}
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <motion.div
            layout
            transition={SPRING}
            data-add-btn
            className="flex flex-wrap items-center justify-center gap-2.5 pt-1.5"
          >
            <button
              type="button"
              data-noscale
              className="dl-add inline-flex h-11 cursor-pointer items-center gap-[9px] rounded-full border border-border bg-card pr-5 pl-3.5 text-sm font-semibold text-label shadow-[0_1px_3px_oklch(0_0_0_/_0.06)]"
              onClick={onOpenPicker}
            >
              <span className="inline-flex size-6 items-center justify-center rounded-full bg-accent text-white">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
              {t('ui.addCondition')}
            </button>
            <button
              type="button"
              data-noscale
              className="dl-clear inline-flex h-11 cursor-pointer items-center gap-[7px] rounded-full border border-border bg-card pr-5 pl-4 text-sm font-semibold text-muted shadow-[0_1px_3px_oklch(0_0_0_/_0.06)]"
              onClick={onOpenReverse}
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
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="m7 10 5 5 5-5" />
                <path d="M12 15V3" />
              </svg>
              {t('reverse.button')}
            </button>
            {onClear && (
              <button
                type="button"
                data-noscale
                className="dl-clear inline-flex h-11 cursor-pointer items-center gap-[7px] rounded-full border border-border bg-card pr-5 pl-4 text-sm font-semibold text-muted shadow-[0_1px_3px_oklch(0_0_0_/_0.06)]"
                onClick={onClear}
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
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                </svg>
                {t('ui.clearConditions')}
              </button>
            )}
            {shareUrl && (
              <button
                type="button"
                data-noscale
                title={t('ui.copyLinkHint')}
                aria-label={t('ui.copyLink')}
                className="dl-clear inline-flex h-11 cursor-pointer items-center gap-[7px] rounded-full border border-border bg-card pr-5 pl-4 text-sm font-semibold text-muted shadow-[0_1px_3px_oklch(0_0_0_/_0.06)]"
                onClick={copyLink}
              >
                {copied ? (
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
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
                    <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
                    <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
                  </svg>
                )}
                {copied ? t('ui.copyLinkDone') : t('ui.copyLink')}
              </button>
            )}
            {onShowQr && (
              <button
                type="button"
                data-noscale
                title={t('ui.qrHint')}
                aria-label={t('ui.qrButton')}
                className="dl-clear inline-flex h-11 cursor-pointer items-center gap-[7px] rounded-full border border-border bg-card pr-5 pl-4 text-sm font-semibold text-muted shadow-[0_1px_3px_oklch(0_0_0_/_0.06)]"
                onClick={onShowQr}
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
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20v.01" />
                </svg>
                {t('ui.qrButton')}
              </button>
            )}
            {onSave && (
              <button
                type="button"
                data-noscale
                className="dl-clear inline-flex h-11 cursor-pointer items-center gap-[7px] rounded-full border border-border bg-card pr-5 pl-4 text-sm font-semibold text-muted shadow-[0_1px_3px_oklch(0_0_0_/_0.06)]"
                onClick={onSave}
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
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                {t('ui.save')}
              </button>
            )}
          </motion.div>
        </div>
      </div>

      {/* 画面2(各サイトで開く)へのスクロールピル。バーと重なるときは丸だけに縮む */}
      <div
        data-scroll-pill
        className="pointer-events-none absolute right-0 bottom-[22px] left-0 z-20 flex justify-center"
      >
        {pillCompact ? (
          <button
            type="button"
            aria-label={scrollLabel}
            title={scrollLabel}
            className="pointer-events-auto inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-accent shadow-[0_3px_14px_oklch(0_0_0_/_0.09)]"
            style={{ animation: 'dl-drop 220ms cubic-bezier(0.22, 1, 0.36, 1)' }}
            onClick={onGoLinks}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ animation: 'dl-bob 1.5s ease-in-out infinite' }}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            className="pointer-events-auto inline-flex h-10 cursor-pointer items-center gap-[9px] rounded-full border border-border bg-card pr-2.5 pl-4 text-[12.5px] font-semibold text-muted shadow-[0_3px_14px_oklch(0_0_0_/_0.07)]"
            onClick={onGoLinks}
          >
            {coarse ? <TapIcon /> : <MouseIcon />}
            {scrollLabel}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
              style={{ animation: 'dl-bob 1.5s ease-in-out infinite' }}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        )}
      </div>
    </section>
  )
}

/** 画面2の上端に置く「条件へ戻る」ピル */
export function ScrollUpPill({ onClick }: { onClick: () => void }) {
  const coarse = useCoarsePointer()
  const label = t(coarse ? 'ui.tapToConditions' : 'ui.scrollToConditions')
  return (
    <div
      data-scroll-up-pill
      className="pointer-events-none absolute top-4 right-0 left-0 z-20 flex justify-center"
    >
      <button
        type="button"
        className="pointer-events-auto inline-flex h-10 cursor-pointer items-center gap-[9px] rounded-full border border-border bg-card pr-4 pl-2.5 text-[12.5px] font-semibold text-muted shadow-[0_3px_14px_oklch(0_0_0_/_0.07)]"
        onClick={onClick}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
          style={{ animation: 'dl-bob-up 1.5s ease-in-out infinite' }}
        >
          <path d="m18 15-6-6-6 6" />
        </svg>
        {label}
        {coarse ? <TapIcon /> : <MouseIcon up />}
      </button>
    </div>
  )
}
