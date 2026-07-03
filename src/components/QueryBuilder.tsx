import { useState } from 'react'
import { X } from 'lucide-react'
import { FIELDS, type FieldDef } from '@/core/concepts'
import { andTerms, words } from '@/core/text'
import type { PlatformDef, PlatformId, QueryState, SortOrder, VideoLength } from '@/core/types'
import { supportOf } from '@/core/types'
import { t } from '@/i18n'
import { PlatformIcon } from '@/components/PlatformIcon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface Props {
  state: QueryState
  onChange: (state: QueryState) => void
  /** ON になっているサイトのみ。対応サイト数・並び順の計算対象 */
  platforms: PlatformDef[]
  /** このサイトが使える条件だけに絞って表示する(nullなら全条件) */
  filterId: PlatformId | null
}

/** 値が入っているか。サイト絞り込み中でも、値の入った条件は隠さないために使う */
function hasValue(state: QueryState, field: FieldDef): boolean {
  switch (field.widget) {
    case 'terms':
      return andTerms(state).length > 0
    case 'sort':
      return state.sort !== 'new'
    case 'toggle':
      return state[field.field] === true
    case 'period':
      return Boolean(state.since || state.until)
    case 'videoLength':
      return state.videoLength !== ''
    default:
      return Boolean((state[field.field] as string).trim())
  }
}

interface ChipInputProps {
  id: string
  /** 確定済みの語。マウント時に読み込む(外からの変更は再マウントで反映する) */
  initialTokens: string[]
  placeholder?: string
  /** trueならEnterで入力中テキスト全体を1語に(スペースを保つ)。falseなら語ごとに分ける */
  phrase?: boolean
  /** 確定チップ+入力中の語を合わせた現在の語リストを通知する */
  onTokensChange: (tokens: string[]) => void
}

/** Enterで語を区切るチップ入力。入力中のテキストも確定を待たず語として効く */
function ChipInput({
  id,
  initialTokens,
  placeholder,
  phrase,
  onTokensChange,
}: ChipInputProps) {
  const [chips, setChips] = useState<string[]>(initialTokens)
  const [rawInput, setRawInput] = useState('')

  const liveTokens = (raw: string): string[] => {
    const text = raw.trim().replace(/[\s　]+/g, ' ')
    if (!text) return []
    return phrase ? [text] : words(text)
  }

  const emit = (nextChips: string[], raw: string) =>
    onTokensChange([...nextChips, ...liveTokens(raw)])

  const commitChip = () => {
    const added = liveTokens(rawInput)
    if (added.length === 0) return
    const next = [...chips, ...added]
    setChips(next)
    setRawInput('')
    emit(next, '')
  }

  const removeChip = (index: number) => {
    const next = chips.filter((_, i) => i !== index)
    setChips(next)
    emit(next, rawInput)
  }

  return (
    // Inputと同等の見た目のチップ入力。クリックで内側のinputへフォーカス
    <div className="flex min-h-8 w-full flex-wrap items-center gap-1.5 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 md:text-sm dark:bg-input/30">
      {chips.map((chip, i) => (
        <span
          key={`${chip}-${i}`}
          className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-secondary-foreground"
        >
          {chip}
          <button
            type="button"
            aria-label={t('concept.terms.removeTerm')}
            className="text-muted-foreground hover:text-foreground"
            onClick={() => removeChip(i)}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        className="min-w-24 flex-1 bg-transparent outline-none placeholder:text-muted-foreground/60"
        value={rawInput}
        placeholder={chips.length === 0 ? placeholder : undefined}
        onChange={(e) => {
          setRawInput(e.target.value)
          emit(chips, e.target.value)
        }}
        onKeyDown={(e) => {
          // 日本語IMEの変換確定のEnterはチップ化しない
          if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
            e.preventDefault()
            commitChip()
          } else if (
            e.key === 'Backspace' &&
            rawInput === '' &&
            chips.length > 0
          ) {
            removeChip(chips.length - 1)
          }
        }}
      />
    </div>
  )
}

const SORT_ORDERS: Array<{ value: SortOrder; labelKey: Parameters<typeof t>[0] }> = [
  { value: 'new', labelKey: 'concept.sortOrder.new' },
  { value: 'top', labelKey: 'concept.sortOrder.top' },
  { value: 'auto', labelKey: 'concept.sortOrder.auto' },
]

const VIDEO_LENGTHS: Array<{ value: VideoLength; labelKey: Parameters<typeof t>[0] }> = [
  { value: '', labelKey: 'concept.videoLength.none' },
  { value: 'short', labelKey: 'concept.videoLength.short' },
  { value: 'medium', labelKey: 'concept.videoLength.medium' },
  { value: 'long', labelKey: 'concept.videoLength.long' },
]

export function QueryBuilder({ state, onChange, platforms, filterId }: Props) {
  const set = (patch: Partial<QueryState>) => onChange({ ...state, ...patch })

  const supportersOf = (field: FieldDef) =>
    platforms.filter((p) => supportOf(p, field.concept).level !== 'none')

  // 対応サイト数の多い順に全条件を並べる(セクション分けなし)。
  // 絞り込み中でも、値が入っている条件は意図しない適用を防ぐため隠さない
  const visibleFields = FIELDS.map((field) => ({
    field,
    supporters: supportersOf(field),
  }))
    .filter(
      ({ field, supporters }) =>
        supporters.length > 0 &&
        (!filterId ||
          supporters.some((p) => p.id === filterId) ||
          hasValue(state, field)),
    )
    .sort((a, b) => b.supporters.length - a.supporters.length)

  /** 対応サイトのアイコンの並び。一部対応は薄く表示し、ホバーで名前の一覧 */
  const supportBadge = (field: FieldDef, supporters: PlatformDef[]) => {
    const full = supporters.filter(
      (p) => supportOf(p, field.concept).level === 'full',
    )
    const partial = supporters.filter(
      (p) => supportOf(p, field.concept).level === 'partial',
    )
    return (
      <Tooltip>
        <TooltipTrigger className="cursor-default p-0">
          <span className="flex flex-wrap items-center gap-1">
            {supporters.map((p) => (
              <PlatformIcon
                key={p.id}
                id={p.id}
                className={`size-3.5 ${
                  supportOf(p, field.concept).level === 'partial'
                    ? 'opacity-35'
                    : ''
                }`}
                style={{ color: p.brandColor }}
              />
            ))}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex flex-col gap-0.5">
            {full.length > 0 && (
              <span>
                {t('builder.support.full')}:{' '}
                {full.map((p) => p.name).join('、')}
              </span>
            )}
            {partial.length > 0 && (
              <span>
                {t('builder.support.partial')}:{' '}
                {partial.map((p) => p.name).join('、')}
              </span>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    )
  }

  const labelRow = (field: FieldDef, supporters: PlatformDef[]) => (
    <div className="flex items-center gap-2">
      <Label htmlFor={field.field}>{t(field.labelKey)}</Label>
      {supportBadge(field, supporters)}
    </div>
  )

  const renderField = ({
    field,
    supporters,
  }: {
    field: FieldDef
    supporters: PlatformDef[]
  }) => {
    if (field.widget === 'terms') {
      return (
        <div key={field.concept} className="flex flex-col gap-1.5">
          {labelRow(field, supporters)}
          <ChipInput
            id={field.field}
            initialTokens={andTerms(state)}
            placeholder={t('concept.keywords.placeholder')}
            phrase
            onTokensChange={(tokens) =>
              set({ terms: tokens.length > 0 ? tokens : [''] })
            }
          />
        </div>
      )
    }
    if (field.widget === 'sort') {
      return (
        <div key={field.concept} className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Label>{t(field.labelKey)}</Label>
            {supportBadge(field, supporters)}
          </div>
          <div className="flex h-9 items-center self-start rounded-md border p-0.5">
            {SORT_ORDERS.map((opt) => (
              <Button
                key={opt.value}
                variant={state.sort === opt.value ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 px-3 text-xs"
                aria-pressed={state.sort === opt.value}
                onClick={() => set({ sort: opt.value })}
              >
                {t(opt.labelKey)}
              </Button>
            ))}
          </div>
        </div>
      )
    }
    if (field.widget === 'toggle') {
      return (
        <div key={field.concept} className="flex items-center gap-3">
          <Switch
            id={field.field}
            checked={state[field.field] as boolean}
            onCheckedChange={(checked) => set({ [field.field]: checked })}
          />
          <div className="flex items-center gap-2">
            <Label htmlFor={field.field}>{t(field.labelKey)}</Label>
            {supportBadge(field, supporters)}
          </div>
        </div>
      )
    }
    if (field.widget === 'period') {
      return (
        <div key={field.concept} className="flex flex-col gap-1.5">
          {labelRow(field, supporters)}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                {t('concept.period.since')}
              </span>
              <Input
                id="since"
                type="date"
                value={state.since}
                onChange={(e) => set({ since: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                {t('concept.period.until')}
              </span>
              <Input
                id="until"
                type="date"
                value={state.until}
                onChange={(e) => set({ until: e.target.value })}
              />
            </div>
          </div>
        </div>
      )
    }
    if (field.widget === 'videoLength') {
      return (
        <div key={field.concept} className="flex flex-col gap-1.5">
          {labelRow(field, supporters)}
          <select
            id={field.field}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            value={state.videoLength}
            onChange={(e) => set({ videoLength: e.target.value as VideoLength })}
          >
            {VIDEO_LENGTHS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </option>
            ))}
          </select>
        </div>
      )
    }
    if (field.multi) {
      // 複数指定できる項目もEnter区切りのチップ入力。値はスペース結合の文字列のまま
      return (
        <div key={field.concept} className="flex flex-col gap-1.5">
          {labelRow(field, supporters)}
          <ChipInput
            id={field.field}
            initialTokens={words(state[field.field] as string)}
            placeholder={field.placeholderKey ? t(field.placeholderKey) : undefined}
            onTokensChange={(tokens) => set({ [field.field]: tokens.join(' ') })}
          />
        </div>
      )
    }
    return (
      <div key={field.concept} className="flex flex-col gap-1.5">
        {labelRow(field, supporters)}
        <Input
          id={field.field}
          type={field.widget === 'number' ? 'number' : 'text'}
          min={field.widget === 'number' ? 0 : undefined}
          value={state[field.field] as string}
          placeholder={field.placeholderKey ? t(field.placeholderKey) : undefined}
          onChange={(e) => set({ [field.field]: e.target.value })}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs text-muted-foreground">{t('builder.hint.enter')}</p>
      {visibleFields.map(renderField)}
    </div>
  )
}
