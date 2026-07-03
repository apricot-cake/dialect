import { forwardRef, type ComponentPropsWithoutRef } from 'react'
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
import { getLang, t, tf, type MessageKey } from '@/i18n'

// グループ見出しは出さず、並び順と余白の差だけで見分ける(グループ間は広く、グループ内は詰める)
const GROUP_ORDER: PlatformGroup[] = ['sns', 'video', 'image', 'text']
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
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
  return tf('launch.appliedCount', {
    applied: String(appliedCount),
    total: String(activeCount),
  })
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
      <p className="text-xs text-muted-foreground">{t('launch.bgHint')}</p>
      {/* グループ見出しは置かず、グループ間の広めの余白だけで区切りを表す。
          グループ内カード(gap-3)より明確に広い gap-8 で、見出しなしでも塊が読み取れる */}
      <div className="flex flex-col gap-8">
        {GROUP_ORDER.map((group) => {
          const platforms = PLATFORMS.filter((p) => p.group === group)
          if (platforms.length === 0) return null
          return (
            <div key={group} className="@container">
              <PlatformCards
                platforms={platforms}
                state={state}
                onLaunch={onLaunch}
              />
            </div>
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

type SearchLinkProps = {
  url: string | null
  label: string
  brandColor: string
  onLaunch?: () => void
} & ComponentPropsWithoutRef<'a'>

/**
 * 検索ボタンを本物のリンク(<a target="_blank">)として描画する。
 * 左クリック=前面タブ、中クリック/Ctrl・⌘+クリック=背面タブ、はブラウザ標準の挙動。
 * JSからは背面タブを強制できないため、確実な背面オープンはこのネイティブ操作に委ねる。
 * onLaunch(履歴記録)は左クリック(onClick)と中クリック(onAuxClick)の両方で拾う。
 */
const SearchLink = forwardRef<HTMLAnchorElement, SearchLinkProps>(
  function SearchLink({ url, label, brandColor, onLaunch, className, ...props }, ref) {
    const enabled = Boolean(url)
    return (
      <a
        ref={ref}
        {...props}
        href={url ?? undefined}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={enabled ? undefined : true}
        tabIndex={enabled ? undefined : -1}
        className={cn(
          buttonVariants(),
          'w-full text-white',
          !enabled && 'pointer-events-none opacity-50',
          className,
        )}
        style={{ backgroundColor: brandColor }}
        onClick={() => {
          if (enabled) onLaunch?.()
        }}
        onAuxClick={(e) => {
          if (enabled && e.button === 1) onLaunch?.()
        }}
      >
        {label}
      </a>
    )
  },
)

/** 条件名を並べる。日本語は「◯◯」を詰めて、英語は"◯◯"をカンマで区切る */
function conceptList(concepts: ConceptId[]): string {
  const labels = concepts.map((c) => t(CONCEPT_LABEL_KEYS[c]))
  if (getLang() === 'ja') return labels.map((l) => `「${l}」`).join('')
  return labels.map((l) => `“${l}”`).join(', ')
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
        {tf('google.launch', { name: platform.name })}
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
              {/* 検索ボタンは本物のリンク。左クリック=前面、中クリック/Ctrl・⌘+クリック=背面。
                  要ログインのサイトは検索ボタンのホバーで注意を出す */}
              {platform.requiresLogin ? (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <SearchLink
                        url={resolution.url}
                        label={tf('launch.search', { name: platform.name })}
                        brandColor={platform.brandColor}
                        onLaunch={onLaunch}
                      />
                    }
                  />
                  <TooltipContent>
                    {tf('launch.loginNote', { name: platform.name })}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <SearchLink
                  url={resolution.url}
                  label={tf('launch.search', { name: platform.name })}
                  brandColor={platform.brandColor}
                  onLaunch={onLaunch}
                />
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
