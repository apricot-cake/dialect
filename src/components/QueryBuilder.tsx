import { useState } from 'react'
import { FIELDS, type FieldDef } from '@/core/concepts'
import { andTerms, formatTerms, parseTerms } from '@/core/text'
import type { PlatformDef, PlatformId, QueryState, SortOrder, TermMode, VideoLength } from '@/core/types'
import { supportOf } from '@/core/types'
import { t } from '@/i18n'
import { Badge } from '@/components/ui/badge'
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

const TERM_MODES: Array<{ value: TermMode; labelKey: Parameters<typeof t>[0] }> = [
  { value: 'all', labelKey: 'concept.terms.modeAll' },
  { value: 'any', labelKey: 'concept.terms.modeAny' },
]

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
  // キーワード欄は引用符つきの生テキストを保持し、パース結果だけを state に流す。
  // state から毎回復元すると入力途中の引用符やスペースが正規化されて消えてしまう
  const [rawTerms, setRawTerms] = useState(() => formatTerms(state.terms))
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

  /** 「8サイト」バッジ。ホバーで対応サイト名の一覧(一部対応は分けて表示) */
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
          <Badge
            variant="outline"
            className="font-normal text-muted-foreground"
          >
            {supporters.length}
            {t('builder.support.sites')}
          </Badge>
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
      const showHint = /[\s　]/.test(rawTerms.trim())
      return (
        <div key={field.concept} className="flex flex-col gap-1.5">
          {labelRow(field, supporters)}
          <Input
            id={field.field}
            value={rawTerms}
            placeholder={t('concept.keywords.placeholder')}
            onChange={(e) => {
              setRawTerms(e.target.value)
              const parsed = parseTerms(e.target.value)
              set({ terms: parsed.length > 0 ? parsed : [''] })
            }}
          />
          {showHint && (
            <p className="text-xs text-muted-foreground">
              {t('concept.keywords.hint')}
            </p>
          )}
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
    return (
      <div key={field.concept} className="flex flex-col gap-1.5">
        {labelRow(field, supporters)}
        <div className="flex items-center gap-1.5">
          <Input
            id={field.field}
            className="flex-1"
            type={field.widget === 'number' ? 'number' : 'text'}
            min={field.widget === 'number' ? 0 : undefined}
            value={state[field.field] as string}
            placeholder={field.placeholderKey ? t(field.placeholderKey) : undefined}
            onChange={(e) => set({ [field.field]: e.target.value })}
          />
          {field.modeField && (
            <div className="flex shrink-0 rounded-md border p-0.5">
              {TERM_MODES.map((m) => (
                <Button
                  key={m.value}
                  variant={
                    state[field.modeField!] === m.value ? 'secondary' : 'ghost'
                  }
                  size="sm"
                  className="h-7 px-2 text-xs"
                  aria-pressed={state[field.modeField!] === m.value}
                  onClick={() => set({ [field.modeField!]: m.value })}
                >
                  {t(m.labelKey)}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return <div className="flex flex-col gap-5">{visibleFields.map(renderField)}</div>
}
