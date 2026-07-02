import { useMemo, useState } from 'react'
import { FIELDS, type FieldDef } from '@/core/concepts'
import { PLATFORMS } from '@/core/platforms'
import type { PlatformId, QueryState, VideoLength } from '@/core/types'
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
}

interface Section {
  key: string
  title: string
  fields: FieldDef[]
}

/** 対応サイト数からセクションを自動生成する。2サイト以上=共通、1サイト=そのサイト専用 */
function buildSections(filterId: PlatformId | null): Section[] {
  const supporters = (field: FieldDef) =>
    PLATFORMS.filter((p) => supportOf(p, field.concept).level !== 'none')

  const visible = filterId
    ? FIELDS.filter((f) =>
        PLATFORMS.some(
          (p) => p.id === filterId && supportOf(p, f.concept).level !== 'none',
        ),
      )
    : FIELDS

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
  for (const platform of PLATFORMS) {
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

const VIDEO_LENGTHS: Array<{ value: VideoLength; labelKey: Parameters<typeof t>[0] }> = [
  { value: '', labelKey: 'concept.videoLength.none' },
  { value: 'short', labelKey: 'concept.videoLength.short' },
  { value: 'medium', labelKey: 'concept.videoLength.medium' },
  { value: 'long', labelKey: 'concept.videoLength.long' },
]

export function QueryBuilder({ state, onChange }: Props) {
  const [filterId, setFilterId] = useState<PlatformId | null>(null)
  const sections = useMemo(() => buildSections(filterId), [filterId])
  const set = (patch: Partial<QueryState>) => onChange({ ...state, ...patch })

  const renderInput = (field: FieldDef) => {
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
          variant={filterId === null ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setFilterId(null)}
        >
          {t('builder.filter.all')}
        </Button>
        {PLATFORMS.map((p) => (
          <Button
            key={p.id}
            variant={filterId === p.id ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilterId(filterId === p.id ? null : p.id)}
          >
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
              <div className="grid gap-5 md:grid-cols-2">
                {inputs.map(renderInput)}
              </div>
            )}
            {toggles.length > 0 && (
              <div className="flex flex-wrap gap-x-8 gap-y-3">
                {toggles.map(renderToggle)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
