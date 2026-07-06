import { useMemo, useState } from 'react'
import { PLATFORMS } from '@/core/platforms'
import { resolve } from '@/core/resolve'
import { translationParts, specialtyOwner } from '@/core/preview'
import { CONCEPT_MAP } from '@/core/conceptDefs'
import type {
  ConceptId,
  PlatformDef,
  PlatformGroup,
  QueryState,
  Resolution,
} from '@/core/types'
import { t, tf, type MessageKey } from '@/i18n'
import { readableInk } from '@/lib/color'
import { PlatformBadge } from './PlatformBadge'
import { ScrollUpPill } from './ConditionsArea'

const GROUPS: Array<{ group: PlatformGroup; labelKey: MessageKey }> = [
  { group: 'sns', labelKey: 'group.sns' },
  { group: 'video', labelKey: 'group.video' },
  { group: 'image', labelKey: 'group.image' },
  { group: 'text', labelKey: 'group.text' },
]

const SOFT_INK = 'color-mix(in oklch, var(--fg) 68%, var(--muted))'

function BanIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
      <circle cx="12" cy="12" r="10" />
      <path d="m4.9 4.9 14.2 14.2" />
    </svg>
  )
}

/**
 * 「一部だけ効く/使えない」の見出し+各条件の1段。条件名チップの下に、その条件が
 * なぜ近似/非対応なのかの注記本文(noteKey)を出す。注記が無い条件は名前だけ
 */
function MetaSection({
  tone,
  items,
}: {
  tone: 'approx' | 'dropped'
  items: Array<{ concept: ConceptId; noteKey?: MessageKey }>
}) {
  return (
    <div className="flex flex-col gap-[7px]">
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.04em] text-muted">
        {tone === 'approx' ? (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            <path d="M12 8.2v5.2" />
            <path d="M12 17.6h.01" />
          </svg>
        ) : (
          <BanIcon />
        )}
        {t(tone === 'approx' ? 'launch.approxHeading' : 'launch.droppedHeading')}
      </span>
      <div className="flex flex-col gap-[7px]">
        {items.map(({ concept, noteKey }) => (
          <div key={concept} className="flex flex-col gap-[3px]">
            <span
              className={`inline-flex self-start rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium ${
                tone === 'dropped' ? 'line-through decoration-[var(--faint)]' : ''
              }`}
              style={{ color: SOFT_INK }}
            >
              {t(CONCEPT_MAP[concept].labelKey)}
            </span>
            {noteKey && (
              <span className="pl-0.5 text-[11px] leading-[1.4] text-muted">{t(noteKey)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/** 他サイト専用の条件を、打ち消し線で騒がせず「〇〇専用」と静かに伝える */
function SpecialtySection({
  items,
}: {
  items: Array<{ concept: ConceptId; owner: PlatformDef }>
}) {
  return (
    <div className="flex flex-col gap-[7px]">
      <span className="text-[10px] font-bold tracking-[0.04em] text-faint">
        {t('launch.specialtyHeading')}
      </span>
      <div className="flex flex-col gap-[5px]">
        {items.map(({ concept, owner }) => (
          <span key={concept} className="text-[11px] leading-[1.35] text-muted">
            {t(CONCEPT_MAP[concept].labelKey)}
            <span className="text-faint">
              {' '}
              {tf('launch.specialtyOnly', { name: owner.name })}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

/**
 * サイト1つ分の検索ボタン。本物のリンク(<a target="_blank">)なので、
 * ホイールクリック/Ctrl・⌘+クリックの背面タブ開きはブラウザ標準の挙動に委ねる
 */
function LaunchCard({
  platform,
  resolution,
  query,
  dark,
}: {
  platform: PlatformDef
  resolution: Resolution
  query: QueryState
  dark: boolean
}) {
  const [hover, setHover] = useState(false)
  const enabled = Boolean(resolution.url)
  const ink = platform.ink ?? readableInk(platform.brandColor)
  const showLogin = platform.requiresLogin && enabled

  // 落ちる条件を「このサイトが本来できるはずなのに使えない」ものと、
  // 「もともと単一サイト専用で、このサイトの守備範囲外」のものに分ける。
  // 後者は打ち消し線で騒がせず「〇〇専用」と静かに見せ、完全度の判定にも数えない
  const droppedReal: typeof resolution.dropped = []
  const droppedSpecialty: Array<{ concept: ConceptId; owner: PlatformDef }> = []
  for (const d of resolution.dropped) {
    const owner = specialtyOwner(d.concept)
    if (owner && owner.id !== platform.id) droppedSpecialty.push({ concept: d.concept, owner })
    else droppedReal.push(d)
  }

  const popHasContent =
    showLogin ||
    droppedReal.length > 0 ||
    droppedSpecialty.length > 0 ||
    resolution.approximated.length > 0
  const showMeta = hover && (popHasContent || !enabled)

  // 翻訳プレビュー: このサイトで実際に効く条件を、読みやすいラベルで常時表示する。
  const parts = enabled ? translationParts(resolution, query) : []
  // 先頭ドットは翻訳完全度の濃淡。applied=満点/近似=半分/使えない(droppedReal)=0 で 0〜1 を出す。
  // 専用フィールドの落ち(droppedSpecialty)は守備範囲外なので分母に数えない
  const relevant =
    resolution.applied.length + resolution.approximated.length + droppedReal.length
  const score = resolution.applied.length + resolution.approximated.length * 0.5
  const ratio = relevant > 0 ? score / relevant : 1
  // 完全度を色相＋濃淡で。効くほど明るい緑、落ちるほど琥珀→赤黒(「ダメ」と分かるよう低域を暗い赤に)。
  // oklchの短い弧で緑152→赤25が琥珀を通る。低域を効かせるため ratio を軽く指数で寝かせる
  const pct = Math.round(Math.pow(ratio, 1.3) * 100)
  const dotColor = `color-mix(in oklch, oklch(0.74 0.17 152) ${pct}%, oklch(0.38 0.17 25))`

  return (
    <div
      className="relative"
      style={{ zIndex: showMeta ? 40 : 1 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <a
        href={resolution.url ?? '#'}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={enabled ? undefined : true}
        tabIndex={enabled ? undefined : -1}
        className="inline-flex h-[42px] w-full items-center justify-center gap-2 rounded-[10px] text-sm font-semibold tracking-[-0.01em] no-underline"
        style={{
          background: platform.brandColor,
          color: ink,
          boxShadow: dark
            ? '0 1px 2px oklch(0 0 0 / 0.28), inset 0 0 0 1px oklch(1 0 0 / 0.1)'
            : '0 1px 2px oklch(0 0 0 / 0.07)',
          ...(enabled ? { cursor: 'pointer' } : { opacity: 0.34, pointerEvents: 'none' as const }),
        }}
      >
        <PlatformBadge
          platform={platform}
          dark={dark}
          size={17}
          color={ink}
          bubbleBg={ink}
          bubbleFg={platform.brandColor}
        />
        {tf('launch.search', { name: platform.name })}
      </a>
      {enabled && parts.length > 0 && (
        <div className="mt-[7px] flex items-start gap-1.5 px-1">
          <span
            aria-hidden
            className="mt-[5px] inline-block h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: dotColor }}
          />
          {/* 1条件=1トークン。トークンは改行不可にし、区切り(・)でだけ折り返す */}
          <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-[11px] leading-[1.45] text-muted">
            {parts.map((p, i) => (
              <span key={i} className="whitespace-nowrap">
                {p}
                {i < parts.length - 1 && <span className="text-faint">・</span>}
              </span>
            ))}
          </div>
        </div>
      )}
      {showMeta && (
        <div
          className="dl-glass pointer-events-none absolute top-[calc(100%+8px)] right-2 left-2 z-30 flex flex-col gap-[11px] rounded-[14px] p-[13px]"
          style={{ animation: 'dl-fade 160ms ease both' }}
        >
          {!enabled && (
            <div className="flex items-center gap-1.5 text-[11.5px] font-bold" style={{ color: SOFT_INK }}>
              <BanIcon />
              {t('ui.notSearchable')}
            </div>
          )}
          {showLogin && (
            <div className="flex items-center gap-1.5 text-[11px] leading-[1.35] text-muted">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <path d="M10 17l5-5-5-5" />
                <path d="M15 12H3" />
              </svg>
              {t('ui.loginRequired')}
            </div>
          )}
          {resolution.approximated.length > 0 && (
            <MetaSection tone="approx" items={resolution.approximated} />
          )}
          {droppedReal.length > 0 && (
            <MetaSection tone="dropped" items={droppedReal} />
          )}
          {droppedSpecialty.length > 0 && (
            <SpecialtySection items={droppedSpecialty} />
          )}
        </div>
      )}
    </div>
  )
}

/** 画面2: 各サイトで開く。グループ別のカードグリッド+免責 */
export function LinksArea({
  query,
  dark,
  onGoConditions,
}: {
  query: QueryState
  dark: boolean
  onGoConditions: () => void
}) {
  const resolutions = useMemo(() => {
    const map = new Map<string, Resolution>()
    for (const p of PLATFORMS) map.set(p.id, resolve(p, query))
    return map
  }, [query])

  return (
    <section
      data-screen-label="links"
      className="relative flex h-dvh w-full flex-col overflow-hidden bg-transparent"
    >
      <ScrollUpPill onClick={onGoConditions} />
      <div
        data-links-scroll
        className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-5 pt-[92px] pb-11"
        style={{ justifyContent: 'safe center' }}
      >
        <div className="mx-auto flex w-full max-w-[940px] flex-col gap-2">
          <div className="flex flex-col gap-[9px] px-0.5 pt-1 pb-2">
            <div className="inline-flex max-w-full items-center gap-[9px] self-start rounded-[11px] border border-border bg-card py-2 pr-3.5 pl-3 text-muted">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="-mt-px shrink-0">
                <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18" />
                <path d="M12 11v5" />
                <path d="M12 8h.01" />
              </svg>
              <span className="text-xs leading-[1.45]">{t('launch.bgHint')}</span>
            </div>
          </div>

          {GROUPS.map(({ group, labelKey }) => {
            const platforms = PLATFORMS.filter((p) => p.group === group)
            if (platforms.length === 0) return null
            return (
              <section key={group} className="flex flex-col gap-2.5 pt-3.5">
                <h3 className="m-0 text-[11px] font-bold tracking-[0.09em] text-faint uppercase">
                  {t(labelKey)}
                </h3>
                <div
                  className="grid gap-[18px_20px]"
                  style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
                >
                  {platforms.map((p) => (
                    <LaunchCard
                      key={p.id}
                      platform={p}
                      resolution={resolutions.get(p.id)!}
                      query={query}
                      dark={dark}
                    />
                  ))}
                </div>
              </section>
            )
          })}

          <div className="px-0.5 pt-7 pb-1.5 text-[11.5px] leading-[1.6] text-faint">
            {t('footer.privacy')}
          </div>
        </div>
      </div>
    </section>
  )
}
