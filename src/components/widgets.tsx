import { ChevronDown } from 'lucide-react'
import { Select } from '@base-ui/react/select'
import { Switch } from '@base-ui/react/switch'
import type { ConceptId, SortOrder } from '@/core/types'
import { SELECT_OPTIONS, SORT_OPTIONS } from '@/core/conceptDefs'
import { t } from '@/i18n'

/** 値が入っているときの文字色(未入力のmutedより一段濃い) */
export const FILLED_INK = 'color-mix(in oklch, var(--fg) 70%, var(--muted))'

/**
 * Enterで語を区切るチップ入力。入力中のテキスト(raw)も確定を待たず条件として
 * 効くため、確定・削除・入力はすべて親(App)の状態を経由する
 */
export function ChipsField({
  chips,
  raw,
  placeholder,
  onRaw,
  onCommit,
  onRemoveChip,
}: {
  chips: string[]
  raw: string
  placeholder?: string
  onRaw: (value: string) => void
  onCommit: () => void
  onRemoveChip: (index: number) => void
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
      {chips.map((text, i) => (
        <span
          key={`${text}-${i}`}
          className="inline-flex max-w-full items-center gap-[5px] rounded-[7px] bg-secondary py-[3px] pr-1.5 pl-[9px] text-[14.5px] font-medium text-fg [overflow-wrap:anywhere] [word-break:break-word]"
        >
          {text}
          <button
            type="button"
            aria-label={t('concept.terms.removeTerm')}
            className="inline-flex cursor-pointer border-none bg-transparent p-0 text-faint"
            onClick={() => onRemoveChip(i)}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}
      <input
        type="text"
        value={raw}
        placeholder={chips.length === 0 ? placeholder : undefined}
        className="min-w-[90px] flex-1 border-none bg-transparent py-1 text-[16px] text-fg outline-none"
        onChange={(e) => onRaw(e.target.value)}
        onKeyDown={(e) => {
          // 日本語IMEの変換確定のEnterはチップ化しない
          if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
            e.preventDefault()
            onCommit()
          } else if (e.key === 'Backspace' && raw === '' && chips.length > 0) {
            onRemoveChip(chips.length - 1)
          }
        }}
      />
      {raw.trim() !== '' && (
        <span className="inline-flex shrink-0 items-center gap-1.5 text-xs whitespace-nowrap text-faint">
          <kbd className="inline-flex h-[22px] items-center justify-center rounded-md border border-border bg-card px-2 text-[11.5px] leading-none font-semibold">
            Enter
          </kbd>
          {t('ui.enterToAdd')}
        </span>
      )}
    </div>
  )
}

export function PlainField({
  value,
  inputType,
  placeholder,
  onChange,
}: {
  value: string
  inputType?: 'number'
  placeholder?: string
  onChange: (value: string) => void
}) {
  return (
    <input
      type={inputType ?? 'text'}
      min={inputType === 'number' ? 0 : undefined}
      value={value}
      placeholder={placeholder}
      className="min-w-0 flex-1 border-none bg-transparent py-1 text-[16px] text-fg outline-none"
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

export function ToggleField({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <Switch.Root
      checked={checked}
      onCheckedChange={onChange}
      className="relative h-[26px] w-[46px] shrink-0 cursor-pointer rounded-full border-none bg-border transition-colors duration-200 data-checked:bg-accent"
    >
      <Switch.Thumb className="absolute top-[3px] left-[3px] block size-5 rounded-full bg-white shadow-[0_1px_3px_oklch(0_0_0_/_0.3)] transition-transform duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] data-checked:translate-x-5" />
    </Switch.Root>
  )
}

export function SortField({
  value,
  onChange,
}: {
  value: SortOrder
  onChange: (value: SortOrder) => void
}) {
  return (
    <div className="inline-flex gap-[2px] rounded-[9px] border border-border bg-card p-[3px]">
      {SORT_OPTIONS.map((opt) => {
        const on = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(opt.value)}
            className={`h-[30px] cursor-pointer rounded-[7px] border-none px-[13px] text-[12.5px] font-semibold transition-all duration-[160ms] ${
              on ? 'bg-accent text-white' : 'bg-transparent text-muted'
            }`}
          >
            {t(opt.labelKey)}
          </button>
        )
      })}
    </div>
  )
}

export function SelectField({
  concept,
  value,
  onChange,
}: {
  concept: ConceptId
  value: string
  onChange: (value: string) => void
}) {
  const options = SELECT_OPTIONS[concept] ?? []
  const current = options.find((o) => o.value === value) ?? options[0]
  return (
    <Select.Root value={value} onValueChange={(v) => onChange(v as string)}>
      <Select.Trigger
        data-noscale
        className="inline-flex h-[34px] cursor-pointer items-center gap-[7px] rounded-[9px] border border-border bg-card pr-2.5 pl-3 text-sm font-medium"
        style={{ color: value ? FILLED_INK : 'var(--muted)' }}
      >
        {t(current.labelKey)}
        <ChevronDown className="size-[15px] text-faint" />
      </Select.Trigger>
      <Select.Portal>
        {/* alignItemWithTrigger を切って、トリガー直下に出るふつうのメニューにする */}
        <Select.Positioner side="bottom" align="start" sideOffset={6} alignItemWithTrigger={false} className="z-50">
          <Select.Popup className="dl-glass dl-drop-in flex min-w-[190px] flex-col gap-0.5 rounded-xl p-1.5">
            {options.map((o) => (
              <Select.Item
                key={o.value}
                value={o.value}
                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-[11px] py-2 text-left text-sm font-medium data-highlighted:bg-secondary data-selected:bg-secondary data-selected:font-semibold"
                style={{ color: FILLED_INK }}
              >
                <Select.ItemText>{t(o.labelKey)}</Select.ItemText>
                <Select.ItemIndicator className="ml-auto">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  )
}
