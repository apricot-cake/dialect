import { Ban, TriangleAlert } from 'lucide-react'
import { PLATFORMS } from '@/core/platforms'
import { resolve } from '@/core/resolve'
import { CONCEPT_LABEL_KEYS } from '@/core/concepts'
import type { ConceptId, PlatformGroup, PlatformId, QueryState } from '@/core/types'
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

export function LaunchPanel({
  state,
  hidden,
  onToggleHidden,
  onLaunch,
}: {
  state: QueryState
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
                state={state}
                onLaunch={onLaunch}
              />
            </section>
          )
        })}
      </div>
    </div>
  )
}

function PlatformCards({
  platforms,
  state,
  onLaunch,
}: {
  platforms: typeof PLATFORMS
  state: QueryState
  onLaunch?: () => void
}) {
  return (
    <div className="flex flex-col gap-3">
      {platforms.map((platform) => {
        const resolution = resolve(platform, state)
        const activeCount =
          resolution.applied.length +
          resolution.approximated.length +
          resolution.dropped.length
        const appliedCount =
          resolution.applied.length + resolution.approximated.length

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
                {activeCount > 0 && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {appliedCount}/{activeCount} {t('launch.conditions')}
                    {t('launch.applied')}
                  </span>
                )}
              </div>

              {(resolution.approximated.length > 0 ||
                resolution.dropped.length > 0) && (
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
              )}

              <Button
                className="w-full text-white"
                style={{ backgroundColor: platform.brandColor }}
                disabled={!resolution.url}
                onClick={() => {
                  if (resolution.url) {
                    onLaunch?.()
                    window.open(resolution.url, '_blank', 'noopener,noreferrer')
                  }
                }}
              >
                {platform.name}
                {t('launch.search')}
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
