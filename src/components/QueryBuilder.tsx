import { useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { PlatformIcon } from '@/components/PlatformIcon'
import { FIELDS, type FieldDef } from '@/core/concepts'
import type { PlatformDef, PlatformId, QueryState, SortOrder, TermMode, TermRow, VideoLength } from '@/core/types'
import { supportOf } from '@/core/types'
import { t } from '@/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'

interface Props {
  state: QueryState
  onChange: (state: QueryState) => void
  /** ON になっているサイトのみ。セクション生成・絞り込みチップの対象 */
  platforms: PlatformDef[]
}

interface Section {
  key: string
  title: string
  fields: FieldDef[]
}

/** 対応サイト数からセクションを自動生成する。2サイト以上=共通、1サイト=そのサイト専用 */
function buildSections(
  filterId: PlatformId | null,
  platforms: PlatformDef[],
): Section[] {
  const supporters = (field: FieldDef) =>
    platforms.filter((p) => supportOf(p, field.concept).level !== 'none')

  const visible = filterId
    ? FIELDS.filter((f) =>
        platforms.some(
          (p) => p.id === filterId && supportOf(p, f.concept).level !== 'none',
        ),
      )
    : FIELDS.filter((f) => supporters(f).length > 0)

  const common = visible
    .filter((f) => supporters(f).length >= 2)
    .sort((a, b) => supporters(b).length - supporters(a).length)

  const sections: Section[] = []
  if (common.length > 0) {
    sections.push({
      key: 'common',
      title: t('builder.section.common'),
      fields: common,
    })
  }
  for (const platform of platforms) {
    if (filterId && platform.id !== filterId) continue
    const own = visible.filter((f) => {
      const s = supporters(f)
      return s.length === 1 && s[0].id === platform.id
    })
    if (own.length > 0) {
      sections.push({
        key: platform.id,
        title: `${platform.name}${t('builder.section.only')}`,
        fields: own,
      })
    }
  }
  return sections
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

export function QueryBuilder({ state, onChange, platforms }: Props) {
  const [filterId, setFilterId] = useState<PlatformId | null>(null)
  // 絞り込み中のサイトがOFFにされたら絞り込みを解除して全体表示に戻す
  const activeFilter = platforms.some((p) => p.id === filterId)
    ? filterId
    : null
  const sections = useMemo(
    () => buildSections(activeFilter, platforms),
    [activeFilter, platforms],
  )
  const set = (patch: Partial<QueryState>) => onChange({ ...state, ...patch })

  const renderInput = (field: FieldDef) => {
    if (field.widget === 'terms') {
      const rows: TermRow[] =
        state.terms.length > 0 ? state.terms : [{ text: '', mode: 'all' }]
      const setRows = (next: TermRow[]) =>
        set({ terms: next.length > 0 ? next : [{ text: '', mode: 'all' }] })
      return (
        <div key={field.concept} className="flex flex-col gap-1.5">
          <Label htmlFor="terms-0">{t(field.labelKey)}</Label>
          {rows.map((row, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Input
                id={`terms-${i}`}
                className="flex-1"
                value={row.text}
                placeholder={
                  row.mode === 'all'
                    ? t('concept.keywords.placeholder')
                    : t('concept.orAny.placeholder')
                }
                onChange={(e) =>
                  setRows(
                    rows.map((r, j) =>
                      j === i ? { ...r, text: e.target.value } : r,
                    ),
                  )
                }
              />
              <div className="flex shrink-0 rounded-md border p-0.5">
                {TERM_MODES.map((m) => (
                  <Button
                    key={m.value}
                    variant={row.mode === m.value ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 px-2 text-xs"
                    aria-pressed={row.mode === m.value}
                    onClick={() =>
                      setRows(
                        rows.map((r, j) =>
                          j === i ? { ...r, mode: m.value } : r,
                        ),
                      )
                    }
                  >
                    {t(m.labelKey)}
                  </Button>
                ))}
              </div>
              {rows.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('concept.terms.removeRow')}
                  onClick={() => setRows(rows.filter((_, j) => j !== i))}
                >
                  <X />
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="self-start text-muted-foreground"
            onClick={() => setRows([...rows, { text: '', mode: 'all' }])}
          >
            <Plus />
            {t('concept.terms.addRow')}
          </Button>
          {rows.length > 1 && (
            <p className="text-xs text-muted-foreground">
              {t('concept.terms.multiNote')}
            </p>
          )}
        </div>
      )
    }
    if (field.widget === 'period') {
      return (
        <div key={field.concept} className="flex flex-col gap-1.5">
          <Label htmlFor="since">{t(field.labelKey)}</Label>
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
    if (field.widget === 'sort') {
      return (
        <div key={field.concept} className="flex flex-col gap-1.5">
          <Label>{t(field.labelKey)}</Label>
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
    if (field.widget === 'videoLength') {
      return (
        <div key={field.concept} className="flex flex-col gap-1.5">
          <Label htmlFor={field.field}>{t(field.labelKey)}</Label>
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
        <Label htmlFor={field.field}>{t(field.labelKey)}</Label>
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

  const renderToggle = (field: FieldDef) => (
    <div key={field.concept} className="flex items-center gap-3">
      <Switch
        id={field.field}
        checked={state[field.field] as boolean}
        onCheckedChange={(checked) => set({ [field.field]: checked })}
      />
      <Label htmlFor={field.field}>{t(field.labelKey)}</Label>
    </div>
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">
          {t('builder.filter.label')}
        </span>
        <Button
          variant={activeFilter === null ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setFilterId(null)}
        >
          {t('builder.filter.all')}
        </Button>
        {platforms.map((p) => (
          <Button
            key={p.id}
            variant={activeFilter === p.id ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilterId(activeFilter === p.id ? null : p.id)}
          >
            <PlatformIcon
              id={p.id}
              className="size-3.5"
              style={{ color: p.brandColor }}
            />
            {p.name}
          </Button>
        ))}
      </div>

      {sections.map((section, i) => {
        const inputs = section.fields.filter((f) => f.widget !== 'toggle')
        const toggles = section.fields.filter((f) => f.widget === 'toggle')
        return (
          <div key={section.key} className="flex flex-col gap-4">
            {i > 0 && <Separator />}
            <h3 className="text-xs font-medium text-muted-foreground">
              {section.title}
            </h3>
            {inputs.length > 0 && (
              <div className="flex flex-col gap-5">
                {inputs.map(renderInput)}
              </div>
            )}
            {toggles.length > 0 && (
              <div className="flex flex-col gap-3">
                {toggles.map(renderToggle)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
