import { Ban, TriangleAlert } from 'lucide-react'
import { PLATFORMS } from '@/core/platforms'
import { resolve } from '@/core/resolve'
import { googleFallback, type GoogleFallback } from '@/core/google'
import { CONCEPT_LABEL_KEYS } from '@/core/concepts'
import type {
  ConceptId,
  PlatformDef,
  PlatformGroup,
  QueryState,
  Resolution,
} from '@/core/types'
import { t, type MessageKey } from '@/i18n'

const GROUPS: Array<{ group: PlatformGroup; labelKey: MessageKey }> = [
  { group: 'sns', labelKey: 'group.sns' },
  { group: 'video', labelKey: 'group.video' },
  { group: 'image', labelKey: 'group.image' },
  { group: 'text', labelKey: 'group.text' },
]
import { Button } from '@/components/ui/button'
import { GoogleIcon, PlatformIcon } from '@/components/PlatformIcon'
import { Card, CardContent } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

/** 概念名だけを1行に並べた注記。理由の説明文はホバーのツールチップに畳む */
function NoteLine({
  tone,
  items,
}: {
  tone: 'approx' | 'dropped'
  items: Array<{ concept: ConceptId; noteKey?: MessageKey }>
}) {
  if (items.length === 0) return null
  const Icon = tone === 'approx' ? TriangleAlert : Ban
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
      <Icon
        aria-hidden
        className={`size-3.5 shrink-0 ${
          tone === 'approx' ? 'text-amber-500' : 'text-zinc-400'
        }`}
      />
      <span className="text-muted-foreground">
        {t(tone === 'approx' ? 'launch.approxHeading' : 'launch.droppedHeading')}:
      </span>
      {items.map(({ concept, noteKey }) =>
        noteKey ? (
          <Tooltip key={concept}>
            <TooltipTrigger className="cursor-default p-0 font-medium underline decoration-dotted underline-offset-2">
              {t(CONCEPT_LABEL_KEYS[concept])}
            </TooltipTrigger>
            <TooltipContent>{t(noteKey)}</TooltipContent>
          </Tooltip>
        ) : (
          <span key={concept} className="font-medium">
            {t(CONCEPT_LABEL_KEYS[concept])}
          </span>
        ),
      )}
    </div>
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
    <div className="flex flex-col gap-1">
      <NoteLine tone="dropped" items={resolution.dropped} />
      <NoteLine tone="approx" items={resolution.approximated} />
    </div>
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
  state,
  onLaunch,
}: {
  state: QueryState
  onLaunch?: () => void
}) {
  return (
    <div className="flex flex-col gap-3">
      {/* 1グループ=1行。カラム分けだとグループ数が列数を超えたとき別グループの下に
          折り返して紛らわしいため、行にしてグループ数の増加に耐えられるようにする */}
      <div className="flex flex-col gap-5">
        {GROUPS.map(({ group, labelKey }) => {
          const platforms = PLATFORMS.filter((p) => p.group === group)
          if (platforms.length === 0) return null
          return (
            <section key={group} className="@container flex flex-col gap-2">
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

function launch(url: string | null, onLaunch?: () => void) {
  if (!url) return
  onLaunch?.()
  window.open(url, '_blank', 'noopener,noreferrer')
}

/** 条件名を「◯◯」「△△」の形で連ねる */
function conceptList(concepts: ConceptId[]): string {
  return concepts.map((c) => `「${t(CONCEPT_LABEL_KEYS[c])}」`).join('')
}

/** 外れた条件をGoogleのサイト内検索で補う代替ボタン。詳細はツールチップに畳む */
function GoogleFallbackBlock({
  platform,
  fallback,
  onLaunch,
}: {
  platform: PlatformDef
  fallback: GoogleFallback
  onLaunch?: () => void
}) {
  const tip =
    conceptList(fallback.recovered) +
    t('google.recovered.suffix') +
    (fallback.lost.length > 0
      ? `(${conceptList(fallback.lost)}${t('google.lost.suffix')})`
      : '')
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => launch(fallback.url, onLaunch)}
          />
        }
      >
        <GoogleIcon className="size-3.5" style={{ color: '#4285f4' }} />
        {t('google.launch.prefix')}
        {platform.name}
        {t('google.launch.suffix')}
      </TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  )
}

function PlatformCards({
  platforms,
  state,
  onLaunch,
}: {
  platforms: PlatformDef[]
  state: QueryState
  onLaunch?: () => void
}) {
  // カードの列数はウィンドウ幅でなく置かれたカラムの実幅で決める
  // (PCの2カラムやスナップした狭いウィンドウでも適切な列数になる)
  return (
    <div className="grid gap-3 @[30rem]:grid-cols-2">
      {platforms.map((platform) => {
        const resolution = resolve(platform, state)
        const fallback = googleFallback(platform, state, resolution)

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
                {appliedCountText(resolution) && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {appliedCountText(resolution)}
                  </span>
                )}
              </div>

              <ResolutionNotes resolution={resolution} />
              {/* 要ログインのサイトは、検索ボタンのホバーで注意を出す */}
              {platform.requiresLogin ? (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        className="w-full text-white"
                        style={{ backgroundColor: platform.brandColor }}
                        disabled={!resolution.url}
                        onClick={() => launch(resolution.url, onLaunch)}
                      />
                    }
                  >
                    {platform.name}
                    {t('launch.search')}
                  </TooltipTrigger>
                  <TooltipContent>
                    {platform.name}
                    {t('launch.loginNote')}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  className="w-full text-white"
                  style={{ backgroundColor: platform.brandColor }}
                  disabled={!resolution.url}
                  onClick={() => launch(resolution.url, onLaunch)}
                >
                  {platform.name}
                  {t('launch.search')}
                </Button>
              )}
              {fallback && (
                <GoogleFallbackBlock
                  platform={platform}
                  fallback={fallback}
                  onLaunch={onLaunch}
                />
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
