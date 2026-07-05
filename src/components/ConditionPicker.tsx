import { useState, type CSSProperties } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { PLATFORMS } from '@/core/platforms'
import { supportOf } from '@/core/types'
import type { ConceptId, PlatformId, QueryState } from '@/core/types'
import { CONCEPT_DEFS, splitSupporters, SUPPORT_COUNT } from '@/core/conceptDefs'
import { t } from '@/i18n'
import { PlatformBadge } from './PlatformBadge'
import { CONCEPT_ICONS } from './conceptIcons'

/** サイトフィルタの選択中スタイル(アクセントを薄く差した枠+地)。
   card/border と混ぜると OKLCH の白補間で色相が紫に転ぶため、ピッカー選択済み行と
   同じく accent-bright を透明と混ぜて色相を保つ(ダークで沈まない変種でもある) */
function activeChipStyle(on: boolean): CSSProperties | undefined {
  if (!on) return undefined
  return {
    borderColor: 'color-mix(in oklch, var(--accent-bright) 55%, transparent)',
    background: 'color-mix(in oklch, var(--accent-bright) 14%, transparent)',
  }
}

/** 行ホバーで右側に出す、完全対応/一部対応のバッジ列 */
function InlineSupport({
  concept,
  query,
  dark,
}: {
  concept: ConceptId
  query: QueryState
  dark: boolean
}) {
  const { full, partial } = splitSupporters(concept, query)
  return (
    <span
      className="inline-flex shrink-0 flex-col items-start justify-center gap-1"
      style={{ animation: 'dl-fade 140ms ease both' }}
    >
      {full.length > 0 && (
        <span className="inline-flex items-center justify-start gap-[5px]">
          <span className="text-[10.5px] font-semibold whitespace-nowrap text-faint">
            {t('support.full')}
          </span>
          {full.map((p) => (
            <PlatformBadge key={p.id} platform={p} dark={dark} size={15} />
          ))}
        </span>
      )}
      {partial.length > 0 && (
        <span className="inline-flex items-center justify-start gap-[5px]">
          <span className="text-[10.5px] font-semibold whitespace-nowrap text-faint">
            {t('support.partial')}
          </span>
          {partial.map((p) => (
            <PlatformBadge key={p.id} platform={p} dark={dark} size={15} />
          ))}
        </span>
      )}
    </span>
  )
}

/**
 * 条件追加モーダル。対応サイト数の多い順のフラットリスト+サイトフィルタ。
 * 追加済みの行はチェックつきで、クリックすると条件ごと外れる
 */
export function ConditionPicker({
  open,
  onOpenChange,
  added,
  filterId,
  query,
  dark,
  onAdd,
  onRemove,
  onSetFilter,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  added: ConceptId[]
  filterId: PlatformId | null
  query: QueryState
  dark: boolean
  onAdd: (concept: ConceptId) => void
  onRemove: (concept: ConceptId) => void
  onSetFilter: (id: PlatformId | null) => void
}) {
  const [hover, setHover] = useState<ConceptId | null>(null)
  const addedSet = new Set(added)
  const filterPlatform = filterId
    ? (PLATFORMS.find((p) => p.id === filterId) ?? null)
    : null
  // フィルタ中でも追加済みの条件は隠さない(解除操作ができなくなるため)
  const rows = CONCEPT_DEFS.filter((d) => d.id !== 'keywords')
    .filter(
      (d) =>
        !filterPlatform ||
        supportOf(filterPlatform, d.id).level !== 'none' ||
        addedSet.has(d.id),
    )
    .sort((a, b) => SUPPORT_COUNT[b.id] - SUPPORT_COUNT[a.id])

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) setHover(null)
        onOpenChange(next)
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="dl-scrim fixed inset-0 z-[60]" />
        <Dialog.Popup className="dl-sheet fixed top-1/2 left-1/2 z-[61] flex max-h-[84vh] w-[min(760px,94vw)] flex-col overflow-hidden rounded-[18px] bg-card shadow-[0_24px_70px_oklch(0_0_0_/_0.32)] outline-none">
          <div className="dl-modal-scroll mx-auto flex min-h-0 w-full max-w-[860px] flex-1 flex-col overflow-y-auto">
            {/* スティッキーなガラスヘッダー(タイトル+サイトフィルタ) */}
            <div
              className="sticky top-0 z-[5]"
              style={{
                background: 'color-mix(in oklch, var(--card) 66%, transparent)',
                backdropFilter: 'blur(20px) saturate(1.5)',
                WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
              }}
            >
              <div className="flex items-center gap-3 px-[26px] pt-5 pb-3">
                <Dialog.Title className="m-0 text-base font-bold tracking-[-0.02em] text-label">
                  {t('picker.title')}
                </Dialog.Title>
                <Dialog.Close
                  aria-label="close"
                  className="ml-auto inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-border text-muted"
                  style={{ background: 'color-mix(in oklch, var(--card) 70%, transparent)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </Dialog.Close>
              </div>
              <div className="flex flex-col gap-2.5 px-[26px] pt-1 pb-4">
                <span
                  data-tip={t('builder.filter.help')}
                  className="cursor-help self-start text-[11.5px] font-medium text-muted"
                >
                  {t('builder.filter.label')}
                </span>
                <div className="flex flex-wrap items-center gap-[9px]">
                  <button
                    type="button"
                    className="h-[34px] cursor-pointer rounded-[9px] border border-border bg-card px-3.5 text-[13px] font-semibold text-fg"
                    style={activeChipStyle(filterId === null)}
                    onClick={() => onSetFilter(null)}
                  >
                    {t('builder.filter.all')}
                  </button>
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      data-noscale
                      data-tip={p.name}
                      aria-pressed={filterId === p.id}
                      className="inline-flex size-[34px] cursor-pointer items-center justify-center rounded-[9px] border border-border bg-card"
                      style={activeChipStyle(filterId === p.id)}
                      onClick={() => onSetFilter(filterId === p.id ? null : p.id)}
                    >
                      <PlatformBadge platform={p} dark={dark} size={17} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 条件リスト(対応サイト数の多い順) */}
            <div className="px-[22px] pt-3.5 pb-[26px]">
              {rows.map((def) => {
                const isAdded = addedSet.has(def.id)
                const Icon = CONCEPT_ICONS[def.id]
                return (
                  <button
                    key={def.id}
                    type="button"
                    data-noscale
                    className={`dl-pick-row relative mb-[7px] flex w-full cursor-pointer items-center gap-[11px] rounded-[10px] border border-transparent px-[13px] py-3 text-left text-fg ${
                      isAdded
                        ? 'bg-(--picker-added) border-[color:var(--picker-added-border)]'
                        : 'hover:border-border hover:bg-card hover:shadow-[0_2px_10px_oklch(0_0_0_/_0.05)]'
                    }`}
                    onClick={() => (isAdded ? onRemove(def.id) : onAdd(def.id))}
                    onMouseEnter={() => setHover(def.id)}
                    onMouseLeave={() => setHover(null)}
                  >
                    <Icon size={18} color="var(--faint)" className="shrink-0" />
                    <span className="flex min-w-0 flex-1 flex-col gap-[3px] text-left">
                      <span className="text-[14.5px] font-semibold text-label">{t(def.labelKey)}</span>
                      <span className="overflow-hidden text-xs overflow-ellipsis whitespace-nowrap text-muted">
                        {t(def.helpKey)}
                      </span>
                    </span>
                    {hover === def.id && (
                      <InlineSupport concept={def.id} query={query} dark={dark} />
                    )}
                    {isAdded ? (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent-bright)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    ) : (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2.2" strokeLinecap="round" className="shrink-0">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
