import { useMemo, useRef, useState, type CSSProperties } from 'react'
import { PLATFORMS } from '@/core/platforms'
import { resolve } from '@/core/resolve'
import { activeConcepts } from '@/core/concepts'
import { translationParts, specialtyOwner } from '@/core/preview'
import { rawQuery } from '@/core/rawQuery'
import { CONCEPT_MAP } from '@/core/conceptDefs'
import type { ConceptId, PlatformDef, QueryState, Resolution } from '@/core/types'
import { t, tf, type MessageKey } from '@/i18n'
import { readableInk } from '@/lib/color'
import { conceptColors } from '@/lib/conceptColors'
import { GROUPS } from '@/lib/platformGroups'
import { useCoarsePointer } from '@/hooks/useCoarsePointer'
import { PlatformBadge } from './PlatformBadge'
import { ScrollUpPill } from './ConditionsArea'
import { BulkOpen } from './BulkOpen'

/**
 * 概念色の下線。ホバーポップの生URL全文でのみ使う。複数概念の複合断片
 * (YouTubeのsp=等)は等分のストライプで「複数の条件がここに合成されている」ことを正直に見せる。
 * dashed=近似(弱まって効く)条件の印。破線にして、そのまま効く条件と見分ける
 */
function underlineStyle(colors: string[], dashed = false): CSSProperties {
  const n = colors.length
  const stops = colors
    .map((c, i) => `${c} ${(i / n) * 100}% ${((i + 1) / n) * 100}%`)
    .join(', ')
  return {
    backgroundImage: dashed
      ? `repeating-linear-gradient(90deg, ${colors[0]} 0 4px, transparent 4px 7px)`
      : `linear-gradient(90deg, ${stops})`,
    backgroundSize: '100% 2px',
    backgroundPosition: '0 100%',
    backgroundRepeat: 'no-repeat',
    paddingBottom: 1,
  }
}

const SOFT_INK = 'color-mix(in oklch, var(--fg) 68%, var(--muted))'

function BanIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
      <circle cx="12" cy="12" r="10" />
      <path d="m4.9 4.9 14.2 14.2" />
    </svg>
  )
}

/** タッチ端末向け「検索文字列をコピー」ボタンのアイコン(コピー/コピー済み) */
function CopyIcon({ done }: { done?: boolean }) {
  return done ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" />
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
  colors,
  onLaunch,
}: {
  platform: PlatformDef
  resolution: Resolution
  query: QueryState
  dark: boolean
  /** 概念→識別色(全カード共通=同じ条件は同じ色)。条件ラベルと生URL断片の対応付け */
  colors: Map<ConceptId, string>
  /** Called when the link is opened (search executed); records history */
  onLaunch: () => void
}) {
  const [hover, setHover] = useState(false)
  const [openUpward, setOpenUpward] = useState(false)
  const [copied, setCopied] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const enabled = Boolean(resolution.url)
  const ink = platform.ink ?? readableInk(platform.brandColor)
  const showLogin = platform.requiresLogin && enabled

  // タッチ端末限定(ホバー不可な端末=PCのホバーポップが使えない)の「検索文字列をコピー」。
  // 主な使い道はスマホの公式アプリの検索ボックスへ演算子テキストを貼ること(issue #30)
  const coarse = useCoarsePointer()
  const rq = enabled ? rawQuery(platform.id, resolution) : null
  const copyQuery = async () => {
    if (!rq) return
    try {
      await navigator.clipboard.writeText(rq.text)
      setCopied(true)
      setTimeout(() => setCopied(false), rq.excluded.length > 0 ? 2600 : 1800)
    } catch {
      /* クリップボードが使えない環境では何もしない */
    }
  }

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
  // 生URL(条件との同色対応)は開けるカード全部に出すので、ポップは常に中身を持つ
  const showMeta = hover && (popHasContent || !enabled || Boolean(resolution.parts))

  // 翻訳プレビュー: このサイトで実際に効く条件を、読みやすいラベルで常時表示する。
  const parts = enabled ? translationParts(resolution, query) : []
  // 近似(弱まって効く)条件は下線を破線にして、そのまま効く条件と見分ける
  const approxConcepts = new Set(resolution.approximated.map((a) => a.concept))

  return (
    <div
      ref={cardRef}
      className="relative"
      style={{ zIndex: showMeta ? 40 : 1 }}
      onMouseEnter={() => {
        // 下に十分な余白が無ければ上向きに開く。下端でポップアップが
        // スクロール領域をホバーのたびに押し広げてガクつくのを防ぐ
        const rect = cardRef.current?.getBoundingClientRect()
        if (rect) setOpenUpward(window.innerHeight - rect.bottom < 280)
        setHover(true)
      }}
      onMouseLeave={() => setHover(false)}
    >
      <div className="flex items-stretch gap-2">
        <a
          href={resolution.url ?? '#'}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={enabled ? undefined : true}
          tabIndex={enabled ? undefined : -1}
          onClick={onLaunch}
          // Middle-click opens a background tab without firing click; count it too
          onAuxClick={(e) => {
            if (e.button === 1) onLaunch()
          }}
          className="inline-flex h-[42px] w-full flex-1 items-center justify-center gap-2 rounded-[10px] text-sm font-semibold tracking-[-0.01em] no-underline"
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
        {coarse && rq && (
          <button
            type="button"
            data-noscale
            onClick={copyQuery}
            title={t('launch.copyQueryHint')}
            aria-label={t('launch.copyQuery')}
            className="inline-flex h-[42px] w-[42px] shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-border bg-card text-muted"
          >
            <CopyIcon done={copied} />
          </button>
        )}
      </div>
      {copied && (
        <div className="mt-[7px] px-1 text-[11px] leading-[1.4] text-muted">
          {t('ui.copyLinkDone')}
          {rq && rq.excluded.length > 0 && (
            <>
              {' '}
              {tf('launch.copyExcluded', {
                list: rq.excluded.map((c) => t(CONCEPT_MAP[c].labelKey)).join('・'),
              })}
            </>
          )}
        </div>
      )}
      {enabled && (parts.length > 0 || droppedReal.length > 0) && (
        <div className="mt-[7px] px-1">
          {/* 1条件=1トークン。トークンは改行不可にし、区切り(・)でだけ折り返す。
              文字色はホバーポップの生URL断片と対応(同じ概念=同じ色)。近似(弱まって効く)
              条件は斜体にして、そのまま効く条件と見分ける。丸ごと落ちる条件は行に出ない
              代わりに、「使えない {n}」の文字バッジで件数を明示する */}
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-[11px] leading-[1.45] text-muted">
            {parts.map((p, i) => {
              const color = colors.get(p.concept)
              const approx = approxConcepts.has(p.concept)
              return (
                <span key={i} className="whitespace-nowrap">
                  <span
                    className={approx ? 'italic' : undefined}
                    style={color ? { color } : undefined}
                  >
                    {p.label}
                  </span>
                  {i < parts.length - 1 && <span className="text-faint">・</span>}
                </span>
              )
            })}
            {droppedReal.length > 0 && (
              <span
                className="inline-flex items-center gap-1 whitespace-nowrap font-medium"
                style={{ color: dark ? 'oklch(0.76 0.11 75)' : 'oklch(0.54 0.11 70)' }}
              >
                <BanIcon />
                {tf('launch.droppedBadge', { n: String(droppedReal.length) })}
              </span>
            )}
          </div>
        </div>
      )}
      {showMeta && (
        <div
          className={`dl-glass pointer-events-none absolute right-2 left-2 z-30 flex flex-col gap-[11px] rounded-[14px] p-[13px] ${
            openUpward ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]'
          }`}
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
          {enabled && resolution.parts && (
            <div className="flex flex-col gap-[5px]">
              <span className="text-[10px] font-bold tracking-[0.04em] text-muted">
                {t('launch.urlHeading')}
              </span>
              {/* 生URL全文。概念由来の断片は条件ラベルと同じ色(下線+文字色)、
                  土台・区切りは薄く。複合断片(YouTubeのsp=等)はストライプ下線 */}
              <div className="font-mono text-[10px] leading-[1.7] break-all">
                {resolution.parts.map((p, i) => {
                  if (p.concepts.length === 0) {
                    return (
                      <span key={i} className="text-faint">
                        {p.text}
                      </span>
                    )
                  }
                  const cols = p.concepts.map((c) => colors.get(c) ?? SOFT_INK)
                  return (
                    <span key={i} style={{ color: cols[0], ...underlineStyle(cols) }}>
                      {p.text}
                    </span>
                  )
                })}
              </div>
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
  onLaunch,
}: {
  query: QueryState
  dark: boolean
  onGoConditions: () => void
  /** Called when a launch link is opened; App records it as search history */
  onLaunch: () => void
}) {
  const resolutions = useMemo(() => {
    const map = new Map<string, Resolution>()
    for (const p of PLATFORMS) map.set(p.id, resolve(p, query))
    return map
  }, [query])

  // 概念→識別色。サイト非依存の activeConcepts から作るので、全カードで同じ条件が同じ色になる
  const colors = useMemo(() => conceptColors(activeConcepts(query), dark), [query, dark])

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
            <BulkOpen resolutions={resolutions} dark={dark} onLaunch={onLaunch} />
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
                      colors={colors}
                      onLaunch={onLaunch}
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
