import { PLATFORMS } from '@/core/platforms'
import { resolve } from '@/core/resolve'
import { CONCEPT_LABEL_KEYS } from '@/core/concepts'
import type { ConceptId, PlatformGroup, QueryState } from '@/core/types'
import { t, type MessageKey } from '@/i18n'

const GROUPS: Array<{ group: PlatformGroup; labelKey: MessageKey }> = [
  { group: 'sns', labelKey: 'group.sns' },
  { group: 'video', labelKey: 'group.video' },
  { group: 'text', labelKey: 'group.text' },
]
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  const dot = tone === 'approx' ? 'bg-amber-400' : 'bg-zinc-300'
  return (
    <li className="flex items-start gap-2 text-xs">
      <span className={`mt-1 size-2 shrink-0 rounded-full ${dot}`} />
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
  onLaunch,
}: {
  state: QueryState
  onLaunch?: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      {GROUPS.map(({ group, labelKey }) => (
        <section key={group} className="flex flex-col gap-2">
          <h2 className="text-xs font-medium text-muted-foreground">
            {t(labelKey)}
          </h2>
          <PlatformCards
            platforms={PLATFORMS.filter((p) => p.group === group)}
            state={state}
            onLaunch={onLaunch}
          />
        </section>
      ))}
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
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: platform.brandColor }}
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

              {resolution.url && (
                <code className="rounded bg-muted px-2 py-1 text-[11px] leading-relaxed break-all text-muted-foreground">
                  {resolution.url}
                </code>
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
