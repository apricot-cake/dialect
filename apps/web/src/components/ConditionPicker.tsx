import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { RotateCcw, Search } from 'lucide-react'
import {
  PLATFORMS,
  supportOf,
  type ConceptId,
  type PlatformId,
  type QueryState,
  CONCEPT_DEFS,
  CONCEPT_MAP,
  splitSupporters,
  SUPPORT_COUNT,
  type ConceptDef,
  buildSearchIndex,
  searchConcepts,
  type MatchTier,
  CATEGORIES,
  CONCEPT_CATEGORY,
  FAMILIES,
  type CategoryId,
} from '@apricot-cake/dialect-core'
import { GROUPS } from '@/lib/platformGroups'
import { conceptFrecency, type ConceptUsageMap } from '@/core/storage'
import { t, type Lang } from '@/i18n'
import { PlatformBadge } from './PlatformBadge'
import { CONCEPT_ICONS } from './conceptIcons'

/** サイトフィルタの選択中スタイル(アクセントを薄く差した枠+地)。
   card/border と混ぜると OKLCH の白補間で色相が紫に転ぶため、ピッカー選択済み行と
   同じく accent-bright を透明と混ぜて色相を保つ(ダークで沈まない変種でもある) */
function activeChipStyle(on: boolean): CSSProperties | undefined {
  if (!on) return undefined
  return {
    borderColor: 'color-mix(in oklch, var(--accent-bright) 55%, transparent)',
    background: 'color-mix(in oklch, var(--accent-bright) 14%, transparent)',
  }
}

/** 行ホバーで右側に出す、完全対応/一部対応のバッジ列 */
function InlineSupport({
  concept,
  query,
  dark,
}: {
  concept: ConceptId
  query: QueryState
  dark: boolean
}) {
  const { full, partial } = splitSupporters(concept, query)
  return (
    <span
      className="inline-flex shrink-0 flex-col items-start justify-center gap-1"
      style={{ animation: 'dl-fade 140ms ease both' }}
    >
      {full.length > 0 && (
        <span className="inline-flex items-center justify-start gap-[5px]">
          <span className="text-[10.5px] font-semibold whitespace-nowrap text-faint">
            {t('support.full')}
          </span>
          {full.map((p) => (
            <PlatformBadge key={p.id} platform={p} dark={dark} size={15} />
          ))}
        </span>
      )}
      {partial.length > 0 && (
        <span className="inline-flex items-center justify-start gap-[5px]">
          <span className="text-[10.5px] font-semibold whitespace-nowrap text-faint">
            {t('support.partial')}
          </span>
          {partial.map((p) => (
            <PlatformBadge key={p.id} platform={p} dark={dark} size={15} />
          ))}
        </span>
      )}
    </span>
  )
}

/**
 * 条件追加モーダル。対応サイト数の多い順のフラットリスト+サイトフィルタ。
 * 追加済みの行はチェックつきで、クリックすると条件ごと外れる
 */
export function ConditionPicker({
  open,
  onOpenChange,
  added,
  filterIds,
  query,
  conceptUsage,
  dark,
  lang,
  onAdd,
  onAddMany,
  onRemove,
  onSetFilter,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  added: ConceptId[]
  filterIds: PlatformId[]
  query: QueryState
  conceptUsage: ConceptUsageMap
  dark: boolean
  lang: Lang
  onAdd: (concept: ConceptId) => void
  onAddMany: (concepts: ConceptId[]) => void
  onRemove: (concept: ConceptId) => void
  onSetFilter: (ids: PlatformId[]) => void
}) {
  const [hover, setHover] = useState<ConceptId | null>(null)
  const [queryText, setQueryText] = useState('')
  const [categoryId, setCategoryId] = useState<CategoryId | null>(null)
  // スクロール量が閾値を超えたら「最上部へ戻る」ピルを出す。スクロール本体は
  // .dl-modal-scroll なので、その要素の scrollTop を直接見る
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)
  // 閉じたら検索・カテゴリ・ホバーをリセット(次に開いたとき素の状態に戻す)。
  // 条件追加はプログラム的に閉じる(setPickerOpen(false))ため Dialog の onOpenChange
  // では拾えない。open の変化を直接見て確実にリセットする
  useEffect(() => {
    if (!open) {
      setHover(null)
      setQueryText('')
      setCategoryId(null)
      setScrolled(false)
    }
  }, [open])
  // ラベル・ヘルプ・値ラベルは言語依存なので、言語が変わったら索引を作り直す
  const index = useMemo(() => buildSearchIndex(lang), [lang])
  const addedSet = new Set(added)
  const filterPlatforms = PLATFORMS.filter((p) => filterIds.includes(p.id))
  // 複数選んだときは積集合=選んだ全サイトで対応(完全でも一部でも)している条件だけ残す
  const matchesFilter = (id: ConceptId) =>
    filterPlatforms.every((p) => supportOf(p, id).level !== 'none')
  const matchesCategory = (id: ConceptId) => !categoryId || CONCEPT_CATEGORY[id] === categoryId

  const q = queryText.trim()
  const searching = q !== ''

  // 検索中はフィルタの2ブロックを畳んで、一致結果を検索ボックス直下へ引き上げる
  // (狭幅では両ブロックが1画面を占め、結果が画面外に押し出されるため)。ただし
  // 有効な絞り込みは隠さない=filterIds(localStorage永続)/categoryId が効いたまま
  // 見えなくなる「気づけない絞り込み」を防ぐ。解除もそのブロックからできる
  const showSiteFilter = !searching || filterIds.length > 0
  const showCategoryFilter = !searching || categoryId !== null

  // 「関連する条件」= 追加済み条件と同じ意図の家族で、まだ足していないメンバー。
  // 純粋な閲覧中(検索なし・カテゴリなし)だけ出す。姉妹はサイトフィルタで絞らない
  // (別サイト版に気づかせるのが目的)。先に計算して本文リストからは重複除外する
  const relatedFamilies =
    !searching && !categoryId
      ? FAMILIES.map((fam) => ({
          fam,
          unadded: fam.members.filter((m) => !addedSet.has(m)),
          hasAdded: fam.members.some((m) => addedSet.has(m)),
        })).filter((x) => x.hasAdded && x.unadded.length > 0)
      : []
  const relatedIds = new Set(relatedFamilies.flatMap((x) => x.unadded))

  // 検索中は一致した概念をスコア順で、そうでなければ全概念を対応サイト数の多い順で。
  // サイトフィルタ・カテゴリはどちらのモードでも候補を絞る(AND)。追加済みの条件は
  // 検索も絞り込みもしていないときだけ残す(解除操作ができなくなるのを防ぐ)
  let rows: ConceptDef[]
  let searchTier: MatchTier | null = null
  if (searching) {
    const hits = searchConcepts(index, q).filter(
      (h) => matchesFilter(h.id) && matchesCategory(h.id),
    )
    searchTier = hits[0]?.tier ?? null
    rows = hits.map((h) => CONCEPT_MAP[h.id])
  } else {
    // keywords is a regular pickable concept, same as any other
    const candidates = CONCEPT_DEFS.filter(
      (d) =>
        matchesCategory(d.id) &&
        (matchesFilter(d.id) || addedSet.has(d.id)) &&
        !relatedIds.has(d.id),
    )
    // 使用実績(frecency)がある概念はスコア降順で先頭へ浮かせ、残りは従来どおり
    // 対応サイト数の多い順。学習データがゼロなら旧来の並びと完全一致する
    const now = Date.now()
    const scored = candidates.map((d) => ({ d, score: conceptFrecency(conceptUsage, d.id, now) }))
    const used = scored.filter((x) => x.score > 0).sort((a, b) => b.score - a.score)
    const rest = scored
      .filter((x) => x.score === 0)
      .sort((a, b) => SUPPORT_COUNT[b.d.id] - SUPPORT_COUNT[a.d.id])
    rows = [...used, ...rest].map((x) => x.d)
  }
  // fuzzy 段でしか当たらなかったとき(表記ゆれ・タイポ)は「もしかして」として弱く見せる
  const fuzzyMode = searchTier === 'fuzzy'

  // 検索・絞り込みでリストが短くなると scrollTop は自動でクランプされるので、
  // 行数が変わったらピルの表示要否を測り直す(スクロールイベントに頼らず追従)
  useEffect(() => {
    const el = scrollRef.current
    setScrolled(!!el && el.scrollTop > 220)
  }, [rows.length])

  // 本文リストと関連セクションで共有する1行(アイコン+ラベル+ヘルプ+対応バッジ+チェック)
  const renderRow = (def: ConceptDef, dimmed = false) => {
    const isAdded = addedSet.has(def.id)
    const Icon = CONCEPT_ICONS[def.id]
    return (
      <button
        key={def.id}
        type="button"
        data-noscale
        style={dimmed ? { opacity: 0.72 } : undefined}
        className={`dl-pick-row relative mb-[7px] flex w-full cursor-pointer items-center gap-[11px] rounded-[10px] border border-transparent px-[13px] py-3 text-left text-fg ${
          isAdded
            ? 'bg-(--picker-added) border-[color:var(--picker-added-border)]'
            : 'hover:border-border hover:bg-card hover:shadow-[0_2px_10px_oklch(0_0_0_/_0.05)]'
        }`}
        onClick={() => (isAdded ? onRemove(def.id) : onAdd(def.id))}
        onMouseEnter={() => setHover(def.id)}
        onMouseLeave={() => setHover(null)}
      >
        <Icon size={18} color="var(--faint)" className="shrink-0" />
        <span className="flex min-w-0 flex-1 flex-col gap-[3px] text-left">
          <span className="text-[14.5px] font-semibold text-label">{t(def.labelKey)}</span>
          <span className="text-xs leading-snug text-muted">{t(def.helpKey)}</span>
        </span>
        {isAdded ? (
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent-bright)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--faint)"
            strokeWidth="2.2"
            strokeLinecap="round"
            className="shrink-0"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        )}
        {/* ホバー時の対応バッジは絶対配置のオーバーレイにする。フローに置くと flex-1 の
           説明文を横から押し縮め、折り返しが増えて行高が変わり描画がガクッと跳ねるため。
           右端のチェック/プラス(px-13 + 17px + gap-11 = 41px)の内側に浮かせ、左端は
           行の地色へのグラデーションで説明文の裾を隠して溶け込ませる */}
        {hover === def.id && (
          <span
            className="dl-pick-support absolute inset-y-0 flex items-center"
            style={{
              right: 41,
              paddingLeft: 22,
              background: `linear-gradient(to right, transparent, ${isAdded ? 'var(--picker-added)' : 'var(--card)'} 22px)`,
              animation: 'dl-fade 140ms ease both',
            }}
          >
            <InlineSupport concept={def.id} query={query} dark={dark} />
          </span>
        )}
      </button>
    )
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="dl-scrim fixed inset-0 z-[60]" />
        <Dialog.Popup className="dl-sheet fixed top-1/2 left-1/2 z-[61] flex max-h-[88vh] w-[min(900px,94vw)] flex-col overflow-hidden rounded-[18px] bg-card shadow-[0_24px_70px_oklch(0_0_0_/_0.32)] outline-none">
          <div
            ref={scrollRef}
            onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 220)}
            className="dl-modal-scroll mx-auto flex min-h-0 w-full flex-1 flex-col overflow-y-auto"
          >
            {/* スティッキーなガラスヘッダー(タイトル+検索ボックスのみ)。サイトフィルタと
               種類チップは常時見せる必要がない(一度絞ったら用済み)ため通常フローに置き、
               リスト閲覧中はスクロールで流してモーダル全高をリストに明け渡す */}
            <div
              className="sticky top-0 z-[5]"
              style={{
                background: 'color-mix(in oklch, var(--card) 66%, transparent)',
                backdropFilter: 'blur(20px) saturate(1.5)',
                WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
              }}
            >
              <div className="flex items-center gap-3 px-[26px] pt-5 pb-3">
                <Dialog.Title className="m-0 text-base font-bold tracking-[-0.02em] text-label">
                  {t('picker.title')}
                </Dialog.Title>
                <Dialog.Close
                  aria-label="close"
                  className="ml-auto inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-border text-muted"
                  style={{ background: 'color-mix(in oklch, var(--card) 70%, transparent)' }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </Dialog.Close>
              </div>
              {/* 意図語で条件を探す検索ボックス(方言の綴りを知らなくても見つかる) */}
              <div className="px-[26px] pb-3.5">
                <div className="flex h-[42px] items-center gap-2.5 rounded-[11px] border border-border bg-card px-3.5">
                  <Search size={17} color="var(--faint)" className="shrink-0" />
                  <input
                    type="text"
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)}
                    onKeyDown={(e) => {
                      // 入力があるときの Esc はクエリのクリアに使い、モーダルは閉じない
                      // (IME変換中の Esc は候補取消なので拾わない)
                      if (e.key === 'Escape' && !e.nativeEvent.isComposing && queryText) {
                        e.preventDefault()
                        e.stopPropagation()
                        setQueryText('')
                      }
                    }}
                    placeholder={t('picker.search.placeholder')}
                    className="w-full min-w-0 border-none bg-transparent text-[15px] text-fg outline-none"
                  />
                  {queryText && (
                    <button
                      type="button"
                      data-noscale
                      aria-label={t('cal.clear')}
                      className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-faint"
                      onClick={() => setQueryText('')}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
            {/* サイトフィルタ(スティッキーではない=リストと一緒にスクロールで流れる) */}
            {showSiteFilter && (
              <div className="flex flex-col gap-2.5 px-[26px] pt-1 pb-4">
                <div className="flex items-center justify-between">
                  <span
                    data-tip={t('builder.filter.help')}
                    className="cursor-help self-start text-[11.5px] font-medium text-muted"
                  >
                    {t('builder.filter.label')}
                  </span>
                  <button
                    type="button"
                    title={t('builder.filter.all')}
                    aria-label={t('builder.filter.all')}
                    disabled={filterIds.length === 0}
                    onClick={() => onSetFilter([])}
                    className="inline-flex size-7 cursor-pointer items-center justify-center rounded-full text-muted hover:text-fg disabled:pointer-events-none disabled:opacity-30"
                  >
                    <RotateCcw className="size-[15px]" />
                  </button>
                </div>
                <div className="flex flex-wrap items-start gap-2">
                  {GROUPS.map(({ group }) => {
                    const groupPlatforms = PLATFORMS.filter((p) => p.group === group)
                    if (groupPlatforms.length === 0) return null
                    return (
                      <div
                        key={group}
                        className="grid grid-flow-col grid-rows-2 gap-[7px] rounded-[10px] border border-border p-[7px]"
                      >
                        {groupPlatforms.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            data-noscale
                            data-tip={p.name}
                            aria-pressed={filterIds.includes(p.id)}
                            className="inline-flex size-[34px] cursor-pointer items-center justify-center rounded-[9px] border border-border bg-card"
                            style={activeChipStyle(filterIds.includes(p.id))}
                            onClick={() =>
                              onSetFilter(
                                filterIds.includes(p.id)
                                  ? filterIds.filter((id) => id !== p.id)
                                  : [...filterIds, p.id],
                              )
                            }
                          >
                            <PlatformBadge platform={p} dark={dark} size={17} />
                          </button>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {/* 条件の種類でしぼるチップ(サイトフィルタとは別軸・非永続) */}
            {showCategoryFilter && (
              <div className="flex flex-col gap-2.5 px-[26px] pb-4">
                <span className="self-start text-[11.5px] font-medium text-muted">
                  {t('picker.category.label')}
                </span>
                <div className="flex flex-wrap items-center gap-[9px]">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      aria-pressed={categoryId === c.id}
                      className="h-[34px] cursor-pointer rounded-[9px] border border-border bg-card px-3.5 text-[13px] font-semibold text-fg"
                      style={activeChipStyle(categoryId === c.id)}
                      onClick={() => setCategoryId(categoryId === c.id ? null : c.id)}
                    >
                      {t(c.labelKey)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 関連する条件＋条件リスト(検索中はスコア順、それ以外は対応サイト数の多い順) */}
            <div className="px-[22px] pt-3.5 pb-[26px]">
              {relatedFamilies.length > 0 && (
                <div className="mb-4">
                  <div className="mb-2 px-[13px] text-[11.5px] font-semibold text-faint">
                    {t('picker.related.heading')}
                  </div>
                  {relatedFamilies.map(({ fam, unadded }) => (
                    <div
                      key={fam.id}
                      className="mb-3 rounded-[12px] border border-border p-2"
                      style={{
                        background: 'color-mix(in oklch, var(--accent-bright) 5%, transparent)',
                      }}
                    >
                      <div className="mb-1 flex items-center gap-2.5 px-[9px] pt-1">
                        <span className="text-[12px] font-semibold text-muted">
                          {t(fam.labelKey)}
                        </span>
                        {unadded.length >= 2 && (
                          <button
                            type="button"
                            data-noscale
                            className="ml-auto inline-flex h-[26px] cursor-pointer items-center gap-1 rounded-full bg-accent px-3 text-[11.5px] font-semibold text-white"
                            onClick={() => onAddMany(unadded)}
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.6"
                              strokeLinecap="round"
                            >
                              <path d="M12 5v14M5 12h14" />
                            </svg>
                            {t('picker.related.addAll')}
                          </button>
                        )}
                      </div>
                      {unadded.map((id) => renderRow(CONCEPT_MAP[id]))}
                    </div>
                  ))}
                </div>
              )}
              {searching && rows.length === 0 && (
                <div className="py-12 text-center text-[13px] text-muted">
                  {t('picker.search.empty')}
                </div>
              )}
              {!searching && rows.length === 0 && relatedFamilies.length === 0 && (
                <div className="py-12 text-center text-[13px] text-muted">
                  {t('picker.filter.empty')}
                </div>
              )}
              {fuzzyMode && (
                <div className="mb-2.5 px-[13px] text-[11.5px] font-semibold text-faint">
                  {t('picker.search.didYouMean')}
                </div>
              )}
              {rows.map((def) => renderRow(def, fuzzyMode))}
            </div>
          </div>
          {/* スクロールで下へ潜ったときだけ出す「最上部へ戻る」ピル。スクロール本体の
             外(Popup直下)に絶対配置し、下端に浮かせたまま流れないようにする */}
          {scrolled && (
            <div
              className="pointer-events-none absolute right-0 bottom-4 left-0 z-10 flex justify-center"
              style={{ animation: 'dl-fade 160ms ease both' }}
            >
              <button
                type="button"
                aria-label={t('picker.scrollTop')}
                title={t('picker.scrollTop')}
                className="pointer-events-auto inline-flex h-10 cursor-pointer items-center gap-[9px] rounded-full border border-border bg-card pr-4 pl-3 text-[12.5px] font-semibold text-muted shadow-[0_3px_14px_oklch(0_0_0_/_0.11)]"
                onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0"
                  style={{ animation: 'dl-bob-up 1.5s ease-in-out infinite' }}
                >
                  <path d="m18 15-6-6-6 6" />
                </svg>
                {t('picker.scrollTop')}
              </button>
            </div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
