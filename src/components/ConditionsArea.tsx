import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { ConceptId, QueryState } from '@/core/types'
import { CONCEPT_MAP } from '@/core/conceptDefs'
import { t } from '@/i18n'
import { ConditionBar } from './ConditionBar'

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
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <rect x="6" y="3" width="12" height="18" rx="6" />
      <path d="M12 7v3" style={{ animation: `${up ? 'dl-bob-up' : 'dl-bob'} 1.5s ease-in-out infinite` }} />
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
  removeConcept,
  onClear,
  onOpenPicker,
  onGoLinks,
}: {
  query: QueryState
  added: ConceptId[]
  dark: boolean
  chipsApi: ChipsApi
  patch: (patch: Partial<QueryState>) => void
  removeConcept: (concept: ConceptId) => void
  /** 条件が1つでもあるときだけ渡る。undefined ならクリアボタンを出さない */
  onClear?: () => void
  onOpenPicker: () => void
  onGoLinks: () => void
}) {
  const pillCompact = usePillCompact()
  const barDefs = [CONCEPT_MAP.keywords, ...added.map((c) => CONCEPT_MAP[c])]
  const scrollLabel = t('ui.scrollToLinks')

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
        <div className="flex w-full max-w-[620px] flex-col items-stretch gap-4">
          <AnimatePresence initial={false}>
            {barDefs.map((def) => (
              <motion.div
                key={def.id}
                layout
                data-bar={def.id}
                className="relative flex w-full items-center gap-2.5"
                initial={{ opacity: 0, y: -14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={SPRING}
              >
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
                  onRemove={def.id === 'keywords' ? undefined : () => removeConcept(def.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          <motion.div layout transition={SPRING} data-add-btn className="flex flex-wrap items-center justify-center gap-2.5 pt-1.5">
            <button
              type="button"
              data-noscale
              className="dl-add inline-flex h-11 cursor-pointer items-center gap-[9px] rounded-full border border-border bg-card pr-5 pl-3.5 text-sm font-semibold text-fg shadow-[0_1px_3px_oklch(0_0_0_/_0.06)]"
              onClick={onOpenPicker}
            >
              <span className="inline-flex size-6 items-center justify-center rounded-full bg-accent text-white">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
              {t('ui.addCondition')}
            </button>
            {onClear && (
              <button
                type="button"
                data-noscale
                className="dl-clear inline-flex h-11 cursor-pointer items-center gap-[7px] rounded-full border border-border bg-card pr-5 pl-4 text-sm font-semibold text-muted shadow-[0_1px_3px_oklch(0_0_0_/_0.06)]"
                onClick={onClear}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                </svg>
                {t('ui.clearConditions')}
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'dl-bob 1.5s ease-in-out infinite' }}>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            className="pointer-events-auto inline-flex h-10 cursor-pointer items-center gap-[9px] rounded-full border border-border bg-card pr-2.5 pl-4 text-[12.5px] font-semibold text-muted shadow-[0_3px_14px_oklch(0_0_0_/_0.07)]"
            onClick={onGoLinks}
          >
            <MouseIcon />
            {scrollLabel}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" style={{ animation: 'dl-bob 1.5s ease-in-out infinite' }}>
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
  const label = t('ui.scrollToConditions')
  return (
    <div className="pointer-events-none absolute top-4 right-0 left-0 z-20 flex justify-center">
      <button
        type="button"
        className="pointer-events-auto inline-flex h-10 cursor-pointer items-center gap-[9px] rounded-full border border-border bg-card pr-4 pl-2.5 text-[12.5px] font-semibold text-muted shadow-[0_3px_14px_oklch(0_0_0_/_0.07)]"
        onClick={onClick}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" style={{ animation: 'dl-bob-up 1.5s ease-in-out infinite' }}>
          <path d="m18 15-6-6-6 6" />
        </svg>
        {label}
        <MouseIcon up />
      </button>
    </div>
  )
}
