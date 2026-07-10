import { useState } from 'react'
import type { PlatformDef, QueryState, SortOrder } from '@/core/types'
import { activeSupportersOf, SORT_OPTIONS, splitSupporters, type ConceptDef } from '@/core/conceptDefs'
import { t } from '@/i18n'
import { PlatformBadgeTile } from './PlatformBadge'
import { ChipsField, PlainField, SelectField, ToggleField } from './widgets'
import { PeriodField } from './PeriodField'
import { CONCEPT_ICONS } from './conceptIcons'

/** 「完全対応/一部対応」の見出し+バッジタイル1段 */
function SupSection({
  tone,
  platforms,
  dark,
}: {
  tone: 'full' | 'partial'
  platforms: PlatformDef[]
  dark: boolean
}) {
  if (platforms.length === 0) return null
  return (
    <span className="flex flex-col gap-[7px]">
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.04em] text-muted">
        {tone === 'full' ? (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--accent-bright)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#e0a63a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            <path d="M12 8.2v5.2" />
            <path d="M12 17.6h.01" />
          </svg>
        )}
        {t(tone === 'full' ? 'support.full' : 'support.partial')}
      </span>
      <span className="flex flex-wrap gap-1.5">
        {platforms.map((p) => (
          <PlatformBadgeTile key={p.id} platform={p} dark={dark} />
        ))}
      </span>
    </span>
  )
}

/**
 * 統一条件バー1本。キーワードも各条件も同じシェルを共有する。
 * 左右の30pxは削除ボタンの分の対称スペーサー(バー列全体の中心を揃える)
 */
export function ConditionBar({
  def,
  query,
  dark,
  chips,
  raw,
  onRaw,
  onCommit,
  onRemoveChip,
  patch,
  onRemove,
}: {
  def: ConceptDef
  query: QueryState
  dark: boolean
  chips: string[]
  raw: string
  onRaw: (value: string) => void
  onCommit: () => void
  onRemoveChip: (index: number) => void
  patch: (patch: Partial<QueryState>) => void
  onRemove?: () => void
}) {
  const [supHover, setSupHover] = useState(false)

  let widget: React.ReactNode
  switch (def.widget) {
    case 'chips':
      widget = (
        <ChipsField
          chips={chips}
          raw={raw}
          placeholder={def.placeholderKey ? t(def.placeholderKey) : undefined}
          onRaw={onRaw}
          onCommit={onCommit}
          onRemoveChip={onRemoveChip}
        />
      )
      break
    case 'plain':
      widget = (
        <PlainField
          value={query[def.field] as string}
          inputType={def.inputType}
          placeholder={def.placeholderKey ? t(def.placeholderKey) : undefined}
          onChange={(value) => patch({ [def.field]: value } as Partial<QueryState>)}
        />
      )
      break
    case 'toggle':
      widget = (
        <ToggleField
          checked={Boolean(query[def.field])}
          onChange={(checked) => patch({ [def.field]: checked } as Partial<QueryState>)}
        />
      )
      break
    case 'select':
      widget = (
        <SelectField
          concept={def.id}
          value={query[def.field] as string}
          query={query}
          onChange={(value) => patch({ [def.field]: value } as Partial<QueryState>)}
        />
      )
      break
    case 'sort':
      widget = (
        <SelectField
          concept="sortOrder"
          value={query.sort}
          query={query}
          options={SORT_OPTIONS}
          noneValue="auto"
          onChange={(value) => patch({ sort: value as SortOrder })}
        />
      )
      break
    case 'period':
      widget = <PeriodField since={query.since} until={query.until} onChange={patch} />
      break
  }

  const { full, partial } = supHover
    ? splitSupporters(def.id, query)
    : { full: [], partial: [] }

  const Icon = CONCEPT_ICONS[def.id]

  return (
    <>
      {/* 削除ボタン(右30px)との対称スペーサー。狭幅では畳んで幅をバーに譲る
          (狭幅では×自体をバー内側へ移すため、外側の×とスペーサーを両方畳む) */}
      <div className="dl-bar-spacer w-[30px] shrink-0" />
      <div className="dl-bar">
        <Icon size={18} color="var(--faint)" className="shrink-0" />
        <span
          data-tip={t(def.helpKey)}
          className="dl-bar-label shrink-0 cursor-default text-[15px] font-semibold whitespace-nowrap text-muted"
        >
          {t(def.labelKey)}
        </span>
        <div className="dl-bar-widget flex min-w-0 flex-1 items-center">{widget}</div>
        <span
          className="dl-sup relative ml-auto inline-flex shrink-0 cursor-default items-center gap-1 text-xs whitespace-nowrap text-faint"
          onMouseEnter={() => setSupHover(true)}
          onMouseLeave={() => setSupHover(false)}
        >
          {t('builder.support.label')} {activeSupportersOf(def.id, query).length}
          {supHover && (
            <span
              className="dl-glass pointer-events-none absolute top-[calc(100%+10px)] right-0 z-50 flex w-[250px] flex-col gap-[11px] rounded-[14px] p-[13px]"
              style={{ animation: 'dl-drop 200ms cubic-bezier(0.22, 1, 0.36, 1)' }}
            >
              <SupSection tone="full" platforms={full} dark={dark} />
              <SupSection tone="partial" platforms={partial} dark={dark} />
            </span>
          )}
        </span>
        {/* 狭幅専用。×を外に逃がす余白が無いのでバー自身の右端に内包し、
            残りの中身(=バーの見た目)が行の中で中央に来るようにする */}
        {onRemove && (
          <button
            type="button"
            aria-label={t('ui.removeCondition')}
            className="dl-remove-inner inline-flex size-[26px] shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-faint"
            onClick={onRemove}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <div className="dl-remove-outer-slot flex w-[30px] shrink-0 items-center justify-center">
        {onRemove && (
          <button
            type="button"
            aria-label={t('ui.removeCondition')}
            className="dl-remove-outer inline-flex size-[30px] cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-faint"
            onClick={onRemove}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </>
  )
}
