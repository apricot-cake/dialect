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

// グループごとに見出しを出して区切る。罫線は引かず、foreground の小さめ太字ラベルと
// グループ間の広めの余白だけで、列見出しより一段弱いまま塊を見分けられるようにする
const GROUPS: Array<{ group: PlatformGroup; labelKey: MessageKey }> = [
  { group: 'sns', labelKey: 'group.sns' },
  { group: 'video', labelKey: 'group.video' },
  { group: 'image', labelKey: 'group.image' },
  { group: 'text', labelKey: 'group.text' },
]
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

/**
 * 「N/N 条件を適用」バッジ。ホバーで、適用した(=分子に数えた)フィールド名の
 * 内訳を出す。近似適用も分子に含まれるので内訳にも並べる。値ではなく名前だけ見せる
 */
function AppliedCountBadge({ resolution }: { resolution: Resolution }) {
  const text = appliedCountText(resolution)
  if (!text) return null
  const applied: ConceptId[] = [
    ...resolution.applied,
    ...resolution.approximated.map((a) => a.concept),
  ]
  // 適用フィールドが1つもなければ(全滅=0/N)内訳は空なのでホバーを出さない
  if (applied.length === 0) {
    return <span className="ml-auto text-xs text-muted-foreground">{text}</span>
  }
  return (
    <Tooltip>
      <TooltipTrigger className="ml-auto cursor-default p-0 text-xs text-muted-foreground underline decoration-dotted underline-offset-2">
        {text}
      </TooltipTrigger>
      <TooltipContent>{conceptList(applied)}</TooltipContent>
    </Tooltip>
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
    // 罫線は引かず、見出しの字面(小さめの太字)とグループ間の広めの余白だけで
    // 塊を見分ける。グループ間 gap-9 > 見出し→カード gap-3 の非対称で、
    // 見出しが上のグループから離れて下のカード群に属して見えるようにする
    <div className="flex flex-col gap-9">
      {GROUPS.map(({ group, labelKey }) => {
        const platforms = PLATFORMS.filter((p) => p.group === group)
        if (platforms.length === 0) return null
        return (
          <section key={group} className="@container flex flex-col gap-3">
            <h3 className="text-xs font-semibold tracking-wide text-foreground">
              {t(labelKey)}
            </h3>
            <PlatformCards
              platforms={platforms}
              state={state}
              onLaunch={onLaunch}
            />
          </section>
        )
      })}
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
                <AppliedCountBadge resolution={resolution} />
              </div>

              <ResolutionNotes resolution={resolution} />
              {/* 検索ボタンは本物のリンク。左クリック=前面、中クリック/Ctrl・⌘+クリック=背面。
                  背面で開く操作のヒントは常時表示をやめ、リンクのホバーに畳む。
                  要ログインのサイトは、その注意も同じホバーに併せて出す */}
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
                <TooltipContent className="flex max-w-64 flex-col gap-1">
                  {platform.requiresLogin && (
                    <span>{tf('launch.loginNote', { name: platform.name })}</span>
                  )}
                  <span>{t('launch.bgHint')}</span>
                </TooltipContent>
              </Tooltip>
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
