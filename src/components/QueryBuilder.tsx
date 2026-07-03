import { useEffect, useState } from 'react'
import { CalendarDays, List, Plus, ToggleLeft, Type, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PlatformIcon } from '@/components/PlatformIcon'
import { FIELDS, type FieldDef } from '@/core/concepts'
import type { ConceptId, PlatformDef, PlatformId, QueryState, SortOrder, TermMode, VideoLength } from '@/core/types'
import { supportOf } from '@/core/types'
import { t } from '@/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface Props {
  state: QueryState
  onChange: (state: QueryState) => void
  /** ON になっているサイトのみ。追加パネルの候補・絞り込みチップの対象 */
  platforms: PlatformDef[]
}

/** 最初から表示しておく基本フィールド。それ以外は「条件を追加」から選んで足す */
const ALWAYS_VISIBLE: ReadonlySet<ConceptId> = new Set(['keywords', 'sortOrder'])

/** 追加パネルで「この条件はどう入力するか」を追加前に示すための分類 */
type WidgetKind = 'input' | 'toggle' | 'date' | 'select'

function widgetKind(field: FieldDef): WidgetKind {
  switch (field.widget) {
    case 'toggle':
      return 'toggle'
    case 'period':
      return 'date'
    case 'videoLength':
    case 'sort':
      return 'select'
    default:
      return 'input'
  }
}

const KIND_ICONS: Record<WidgetKind, LucideIcon> = {
  input: Type,
  toggle: ToggleLeft,
  date: CalendarDays,
  select: List,
}

const KIND_LABEL_KEYS: Record<WidgetKind, Parameters<typeof t>[0]> = {
  input: 'builder.kind.input',
  toggle: 'builder.kind.toggle',
  date: 'builder.kind.date',
  select: 'builder.kind.select',
}

interface Section {
  key: string
  title: string
  fields: FieldDef[]
}

/** 追加パネルの候補を対応サイト数からセクション分けする。2サイト以上=共通、1サイト=そのサイト専用 */
function buildPickerSections(
  filterId: PlatformId | null,
  platforms: PlatformDef[],
  exclude: ReadonlySet<ConceptId>,
): Section[] {
  const supporters = (field: FieldDef) =>
    platforms.filter((p) => supportOf(p, field.concept).level !== 'none')

  let candidates = FIELDS.filter(
    (f) => !exclude.has(f.concept) && supporters(f).length > 0,
  )
  if (filterId) {
    candidates = candidates.filter((f) =>
      platforms.some(
        (p) => p.id === filterId && supportOf(p, f.concept).level !== 'none',
      ),
    )
  }

  const common = candidates
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
    const own = candidates.filter((f) => {
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

/** 値が入っているか。復元した検索条件のフィールドを自動で表示するために使う */
function hasValue(state: QueryState, field: FieldDef): boolean {
  switch (field.widget) {
    case 'terms':
    case 'sort':
      return false // 常時表示なので判定不要
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

export function QueryBuilder({ state, onChange, platforms }: Props) {
  const [added, setAdded] = useState<ConceptId[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [filterId, setFilterId] = useState<PlatformId | null>(null)
  const set = (patch: Partial<QueryState>) => onChange({ ...state, ...patch })

  // 値が入ったフィールドは added に昇格させて表示を固定する。
  // こうしないと、入力中に値を空にした瞬間や復元後のスイッチOFFで行が消えてしまう
  useEffect(() => {
    const withValue = FIELDS.filter(
      (f) => hasValue(state, f) && !added.includes(f.concept),
    ).map((f) => f.concept)
    if (withValue.length > 0) setAdded((a) => [...a, ...withValue])
  }, [state, added])

  const visibleFields = FIELDS.filter(
    (f) =>
      ALWAYS_VISIBLE.has(f.concept) ||
      added.includes(f.concept) ||
      hasValue(state, f),
  )
  const visibleSet = new Set(visibleFields.map((f) => f.concept))

  // 絞り込み中のサイトがOFFにされたら絞り込みを解除する
  const activeFilter = platforms.some((p) => p.id === filterId)
    ? filterId
    : null
  // キーワードは常時表示だが、追加パネルには「行を足す」項目として何度でも出す
  const pickerExclude = new Set(
    [...visibleSet].filter((c) => c !== 'keywords'),
  )
  const pickerSections = buildPickerSections(activeFilter, platforms, pickerExclude)

  const addTermRow = () =>
    set({ terms: [...(state.terms.length > 0 ? state.terms : ['']), ''] })

  const addField = (field: FieldDef) => {
    setAdded((a) => [...a, field.concept])
    // スイッチ系は「追加した=その条件を使いたい」なので最初からONにする
    if (field.widget === 'toggle') set({ [field.field]: true })
  }

  const removeField = (field: FieldDef) => {
    setAdded((a) => a.filter((c) => c !== field.concept))
    if (field.widget === 'toggle') {
      set({ [field.field]: false })
    } else if (field.widget === 'period') {
      set({ since: '', until: '' })
    } else if (field.widget === 'videoLength') {
      set({ videoLength: '' })
    } else {
      const patch: Partial<QueryState> = { [field.field]: '' }
      if (field.modeField) patch[field.modeField] = 'all'
      set(patch)
    }
  }

  const removeButton = (field: FieldDef) => (
    <Button
      variant="ghost"
      size="icon"
      className="size-5 text-muted-foreground"
      aria-label={t('builder.removeField')}
      onClick={() => removeField(field)}
    >
      <X className="size-3.5" />
    </Button>
  )

  const labelRow = (field: FieldDef) => (
    <div className="flex items-center gap-2">
      <Label htmlFor={field.field}>{t(field.labelKey)}</Label>
      {!ALWAYS_VISIBLE.has(field.concept) && removeButton(field)}
    </div>
  )

  const renderField = (field: FieldDef) => {
    if (field.widget === 'terms') {
      const terms = state.terms.length > 0 ? state.terms : ['']
      const setTerms = (next: string[]) =>
        set({ terms: next.length > 0 ? next : [''] })
      const hasPhrase = terms.some((text) => /[\s　]/.test(text.trim()))
      return (
        <div key={field.concept} className="flex flex-col gap-1.5">
          <Label htmlFor="terms-0">{t(field.labelKey)}</Label>
          {terms.map((text, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Input
                id={`terms-${i}`}
                className="flex-1"
                value={text}
                placeholder={t('concept.keywords.placeholder')}
                onChange={(e) =>
                  setTerms(terms.map((s, j) => (j === i ? e.target.value : s)))
                }
              />
              {terms.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-5 shrink-0 text-muted-foreground"
                  aria-label={t('concept.terms.removeTerm')}
                  onClick={() => setTerms(terms.filter((_, j) => j !== i))}
                >
                  <X className="size-3.5" />
                </Button>
              )}
            </div>
          ))}
          {hasPhrase && (
            <p className="text-xs text-muted-foreground">
              {t('concept.terms.phraseNote')}
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="self-start border-dashed text-muted-foreground"
            onClick={() => setTerms([...terms, ''])}
          >
            <Plus className="size-3.5" />
            {t('concept.terms.add')}
          </Button>
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
    if (field.widget === 'toggle') {
      return (
        <div key={field.concept} className="flex items-center gap-3">
          <Switch
            id={field.field}
            checked={state[field.field] as boolean}
            onCheckedChange={(checked) => set({ [field.field]: checked })}
          />
          <Label htmlFor={field.field}>{t(field.labelKey)}</Label>
          {removeButton(field)}
        </div>
      )
    }
    if (field.widget === 'period') {
      return (
        <div key={field.concept} className="flex flex-col gap-1.5">
          {labelRow(field)}
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
          {labelRow(field)}
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
        {labelRow(field)}
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

  return (
    <div className="flex flex-col gap-5">
      {visibleFields.map(renderField)}

      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          className="self-start text-muted-foreground"
          aria-expanded={pickerOpen}
          onClick={() => setPickerOpen(!pickerOpen)}
        >
          <Plus />
          {t('builder.addField')}
        </Button>

        {pickerOpen && (
          <div className="flex flex-col gap-3 rounded-md border bg-muted/30 p-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {(Object.keys(KIND_ICONS) as WidgetKind[]).map((kind) => {
                const Icon = KIND_ICONS[kind]
                return (
                  <span key={kind} className="flex items-center gap-1">
                    <Icon aria-hidden className="size-3.5" />
                    {t(KIND_LABEL_KEYS[kind])}
                  </span>
                )
              })}
            </div>
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

            {pickerSections.length === 0 && (
              <p className="text-xs text-muted-foreground">
                {t('builder.addField.empty')}
              </p>
            )}
            {pickerSections.map((section) => (
              <div key={section.key} className="flex flex-col gap-1.5">
                <h3 className="text-xs font-medium text-muted-foreground">
                  {section.title}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {section.fields.map((f) => {
                    const Icon = KIND_ICONS[widgetKind(f)]
                    const isTermRow = f.concept === 'keywords'
                    return (
                      <Button
                        key={f.concept}
                        variant="outline"
                        size="sm"
                        onClick={() => (isTermRow ? addTermRow() : addField(f))}
                      >
                        <Icon aria-hidden className="size-3.5 text-muted-foreground" />
                        {isTermRow
                          ? t('builder.addField.termRow')
                          : t(f.labelKey)}
                      </Button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
