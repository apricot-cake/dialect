import { Ban, TriangleAlert } from 'lucide-react'
import { PLATFORMS } from '@/core/platforms'
import { resolve } from '@/core/resolve'
import { CONCEPT_LABEL_KEYS } from '@/core/concepts'
import { setMark } from '@/core/summary'
import type {
  ConceptId,
  PlatformDef,
  PlatformGroup,
  PlatformId,
  QueryState,
  Resolution,
} from '@/core/types'
import { t, type MessageKey } from '@/i18n'

const GROUPS: Array<{ group: PlatformGroup; labelKey: MessageKey }> = [
  { group: 'sns', labelKey: 'group.sns' },
  { group: 'video', labelKey: 'group.video' },
  { group: 'text', labelKey: 'group.text' },
]
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PlatformIcon } from '@/components/PlatformIcon'
import { Card, CardContent } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

function ConceptNote({
  concept,
  noteKey,
  tone,
}: {
  concept: ConceptId
  noteKey?: MessageKey
  tone: 'approx' | 'dropped'
}) {
  const Icon = tone === 'approx' ? TriangleAlert : Ban
  return (
    <li className="flex items-start gap-2 text-xs">
      <Icon
        aria-hidden
        className={`mt-0.5 size-3.5 shrink-0 ${
          tone === 'approx' ? 'text-amber-500' : 'text-zinc-400'
        }`}
      />
      <span>
        <span className="font-medium">{t(CONCEPT_LABEL_KEYS[concept])}</span>
        {noteKey && (
          <span className="text-muted-foreground"> — {t(noteKey)}</span>
        )}
      </span>
    </li>
  )
}

function ResolutionNotes({ resolution }: { resolution: Resolution }) {
  if (
    resolution.approximated.length === 0 &&
    resolution.dropped.length === 0
  ) {
    return null
  }
  return (
    <ul className="flex flex-col gap-1.5">
      {resolution.approximated.map(({ concept, noteKey }) => (
        <ConceptNote
          key={concept}
          concept={concept}
          noteKey={noteKey}
          tone="approx"
        />
      ))}
      {resolution.dropped.map(({ concept, noteKey }) => (
        <ConceptNote
          key={concept}
          concept={concept}
          noteKey={noteKey}
          tone="dropped"
        />
      ))}
    </ul>
  )
}

/** 「2/3 条件を適用」のテキスト。条件が1つもなければ null */
function appliedCountText(resolution: Resolution): string | null {
  const activeCount =
    resolution.applied.length +
    resolution.approximated.length +
    resolution.dropped.length
  if (activeCount === 0) return null
  const appliedCount =
    resolution.applied.length + resolution.approximated.length
  return `${appliedCount}/${activeCount} ${t('launch.conditions')}${t('launch.applied')}`
}

export function LaunchPanel({
  sets,
  hidden,
  onToggleHidden,
  onLaunch,
}: {
  /** 条件セット(セット間OR)。1セット=1タブとして訳す */
  sets: QueryState[]
  /** OFFにしたサイトのID(localStorageに記憶される) */
  hidden: PlatformId[]
  onToggleHidden: (id: PlatformId) => void
  onLaunch?: () => void
}) {
  const enabled = PLATFORMS.filter((p) => !hidden.includes(p.id))
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">
          {t('launch.sites.label')}
        </span>
        {PLATFORMS.map((p) => {
          const on = !hidden.includes(p.id)
          return (
            <Button
              key={p.id}
              variant={on ? 'secondary' : 'ghost'}
              size="sm"
              aria-pressed={on}
              className={on ? undefined : 'text-muted-foreground opacity-60'}
              onClick={() => onToggleHidden(p.id)}
            >
              <PlatformIcon
                id={p.id}
                className="size-3.5"
                style={on ? { color: p.brandColor } : undefined}
              />
              {p.name}
            </Button>
          )
        })}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {GROUPS.map(({ group, labelKey }) => {
          const platforms = enabled.filter((p) => p.group === group)
          if (platforms.length === 0) return null
          return (
            <section key={group} className="flex flex-col gap-2">
              <h2 className="text-xs font-medium text-muted-foreground">
                {t(labelKey)}
              </h2>
              <PlatformCards
                platforms={platforms}
                sets={sets}
                onLaunch={onLaunch}
              />
            </section>
          )
        })}
      </div>
    </div>
  )
}

function launch(url: string | null, onLaunch?: () => void) {
  if (!url) return
  onLaunch?.()
  window.open(url, '_blank', 'noopener,noreferrer')
}

function PlatformCards({
  platforms,
  sets,
  onLaunch,
}: {
  platforms: PlatformDef[]
  sets: QueryState[]
  onLaunch?: () => void
}) {
  return (
    <div className="flex flex-col gap-3">
      {platforms.map((platform) => {
        const resolutions = sets.map((state) => resolve(platform, state))
        const single = resolutions.length === 1 ? resolutions[0] : null

        return (
          <Card key={platform.id} className="py-4">
            <CardContent className="flex flex-col gap-3 px-4">
              <div className="flex items-center gap-2">
                <PlatformIcon
                  id={platform.id}
                  className="size-4 shrink-0"
                  style={{ color: platform.brandColor }}
                />
                <span className="font-semibold">{platform.name}</span>
                {platform.requiresLogin && (
                  <Tooltip>
                    <TooltipTrigger className="cursor-default p-0">
                      <Badge variant="outline" className="text-amber-600">
                        {t('launch.loginRequired')}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>{t('launch.loginNote')}</TooltipContent>
                  </Tooltip>
                )}
                {single && appliedCountText(single) && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {appliedCountText(single)}
                  </span>
                )}
              </div>

              {single ? (
                <>
                  <ResolutionNotes resolution={single} />
                  <Button
                    className="w-full text-white"
                    style={{ backgroundColor: platform.brandColor }}
                    disabled={!single.url}
                    onClick={() => launch(single.url, onLaunch)}
                  >
                    {platform.name}
                    {t('launch.search')}
                  </Button>
                </>
              ) : (
                // 複数セット: セット間ORはタブに訳せないので、1セット=1ボタン(=1タブ)
                resolutions.map((resolution, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-2 rounded-md border p-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">
                        {t('sets.label')}
                        {setMark(i)}
                      </span>
                      {appliedCountText(resolution) && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {appliedCountText(resolution)}
                        </span>
                      )}
                    </div>
                    <ResolutionNotes resolution={resolution} />
                    <Button
                      size="sm"
                      className="w-full text-white"
                      style={{ backgroundColor: platform.brandColor }}
                      disabled={!resolution.url}
                      onClick={() => launch(resolution.url, onLaunch)}
                    >
                      {t('sets.label')}
                      {setMark(i)}
                      {t('launch.search')}
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
