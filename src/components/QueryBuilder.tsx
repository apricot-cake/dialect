import type { ConceptId, QueryState } from '@/core/types'
import { t, type MessageKey } from '@/i18n'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { SupportDots } from './SupportDots'

interface Props {
  state: QueryState
  onChange: (state: QueryState) => void
}

interface TextRow {
  concept: ConceptId
  field: 'keywords' | 'exactPhrase' | 'exclude' | 'fromUser' | 'hashtag'
  labelKey: MessageKey
  placeholderKey: MessageKey
}

const TEXT_ROWS: TextRow[] = [
  {
    concept: 'keywords',
    field: 'keywords',
    labelKey: 'concept.keywords.label',
    placeholderKey: 'concept.keywords.placeholder',
  },
  {
    concept: 'exactPhrase',
    field: 'exactPhrase',
    labelKey: 'concept.exactPhrase.label',
    placeholderKey: 'concept.exactPhrase.placeholder',
  },
  {
    concept: 'exclude',
    field: 'exclude',
    labelKey: 'concept.exclude.label',
    placeholderKey: 'concept.exclude.placeholder',
  },
  {
    concept: 'fromUser',
    field: 'fromUser',
    labelKey: 'concept.fromUser.label',
    placeholderKey: 'concept.fromUser.placeholder',
  },
  {
    concept: 'hashtag',
    field: 'hashtag',
    labelKey: 'concept.hashtag.label',
    placeholderKey: 'concept.hashtag.placeholder',
  },
]

interface ToggleRow {
  concept: ConceptId
  field: 'mediaOnly' | 'japaneseOnly' | 'newestFirst'
  labelKey: MessageKey
}

const TOGGLE_ROWS: ToggleRow[] = [
  { concept: 'mediaOnly', field: 'mediaOnly', labelKey: 'concept.mediaOnly.label' },
  { concept: 'japaneseOnly', field: 'japaneseOnly', labelKey: 'concept.japaneseOnly.label' },
  { concept: 'newestFirst', field: 'newestFirst', labelKey: 'concept.newestFirst.label' },
]

export function QueryBuilder({ state, onChange }: Props) {
  const set = (patch: Partial<QueryState>) => onChange({ ...state, ...patch })

  return (
    <div className="flex flex-col gap-5">
      {TEXT_ROWS.map((row) => (
        <div key={row.concept} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor={row.field}>{t(row.labelKey)}</Label>
            <SupportDots concept={row.concept} />
          </div>
          <Input
            id={row.field}
            value={state[row.field]}
            placeholder={t(row.placeholderKey)}
            onChange={(e) => set({ [row.field]: e.target.value })}
          />
        </div>
      ))}

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="since">{t('concept.period.label')}</Label>
          <SupportDots concept="period" />
        </div>
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

      <Separator />

      <div className="flex flex-col gap-4">
        {TOGGLE_ROWS.map((row) => (
          <div key={row.concept} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch
                id={row.field}
                checked={state[row.field]}
                onCheckedChange={(checked) => set({ [row.field]: checked })}
              />
              <Label htmlFor={row.field}>{t(row.labelKey)}</Label>
            </div>
            <SupportDots concept={row.concept} />
          </div>
        ))}
      </div>
    </div>
  )
}
