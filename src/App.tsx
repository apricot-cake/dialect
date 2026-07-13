import { useEffect, useState, useSyncExternalStore } from 'react'
import type { ConceptId, InstanceHosts, PlatformId, QueryState } from '@/core/types'
import { NICO_GENRES, POST_LANGUAGE_CODES } from '@/core/types'
import { activeConcepts, defaultState } from '@/core/concepts'
import { CONCEPT_DEFS, CONCEPT_MAP, type ConceptDef } from '@/core/conceptDefs'
import { paramsToQuery, permalinkUrl, stateToParams } from '@/core/permalink'
import { PLATFORMS } from '@/core/platforms'
import { searchSummary } from '@/core/preview'
import {
  clearHistory,
  deleteHistory,
  deleteSaved,
  loadConceptUsage,
  loadHistory,
  loadHistoryEnabled,
  loadInstanceHosts,
  loadSaved,
  markHistorySuggested,
  persistHistoryEnabled,
  persistInstanceHosts,
  recordConceptUsage,
  recordHistory,
  saveSearch,
  toQuery,
  type HistoryEntry,
  type StoredQuery,
} from '@/core/storage'
import { andTerms, exactPhrases, words } from '@/core/text'
import { getLang, setLang, subscribe, t, type Lang } from '@/i18n'
import { AppHeader } from '@/components/AppHeader'
import { DotsCanvas } from '@/components/DotsCanvas'
import { ConditionsArea, type ChipsApi } from '@/components/ConditionsArea'
import { LinksArea } from '@/components/LinksArea'
import { ConditionPicker } from '@/components/ConditionPicker'
import { SaveSearchDialog, SavedListDialog } from '@/components/SavedSearches'
import { ReverseDialog } from '@/components/ReverseDialog'
import { QrDialog } from '@/components/QrDialog'
import { useSnapAreas, type AreaId } from '@/hooks/useSnapAreas'

const QUERY_KEY = 'dialect.v2.query'
const ADDED_KEY = 'dialect.v2.added'
const FILTER_KEY = 'dialect.v2.filter'

type ChipMap = Partial<Record<ConceptId, string[]>>
type RawMap = Partial<Record<ConceptId, string>>

/** localStorageのJSONから、既知のキーを型が合うときだけ取り込む */
function sanitizeQuery(parsed: unknown): QueryState {
  const query = defaultState()
  if (typeof parsed !== 'object' || parsed === null) return query
  const source = parsed as Record<string, unknown>
  for (const key of Object.keys(query) as Array<keyof QueryState>) {
    const value = source[key]
    if (
      value !== undefined &&
      typeof value === typeof query[key] &&
      Array.isArray(value) === Array.isArray(query[key])
    ) {
      ;(query as unknown as Record<string, unknown>)[key] = value
    }
  }
  // 配列と列挙値は中身まで確かめる(壊れた値をURL生成へ流さない)
  const strArray = (v: string[]): string[] =>
    v.every((x) => typeof x === 'string') && v.length > 0 ? v : ['']
  query.terms = strArray(query.terms)
  query.exactPhrase = strArray(query.exactPhrase)
  if (!['', 'short', 'medium', 'long'].includes(query.videoLength)) query.videoLength = ''
  if (!['', 'illust', 'manga', 'ugoira', 'novel'].includes(query.workType)) query.workType = ''
  if (!['', 'video', 'short', 'channel', 'playlist'].includes(query.resultType)) {
    query.resultType = ''
  }
  if (!['', '00users', '000users', '0000users'].includes(query.pixivPopular)) {
    query.pixivPopular = ''
  }
  if (!['', 'safe', 'r18'].includes(query.ageRating)) query.ageRating = ''
  if (!['new', 'top', 'auto'].includes(query.sort)) query.sort = 'new'
  if (!(['', ...POST_LANGUAGE_CODES] as string[]).includes(query.language)) query.language = ''
  if (!(['', ...NICO_GENRES] as string[]).includes(query.genre)) query.genre = ''
  return query
}

/** 起動時の状態。URLパラメータがあれば最優先、なければ前回のlocalStorage */
function loadInitial(): {
  query: QueryState
  added: ConceptId[]
  filterIds: PlatformId[]
} {
  let query = defaultState()
  if (location.search) {
    query = paramsToQuery(new URLSearchParams(location.search))
  } else {
    try {
      const saved = localStorage.getItem(QUERY_KEY)
      if (saved) query = sanitizeQuery(JSON.parse(saved))
    } catch {
      /* 読めなければ初期状態から */
    }
  }

  let added: ConceptId[] = []
  try {
    const saved = localStorage.getItem(ADDED_KEY)
    if (saved) {
      const parsed: unknown = JSON.parse(saved)
      if (Array.isArray(parsed)) {
        added = [
          ...new Set(
            parsed.filter((c): c is ConceptId => typeof c === 'string' && c in CONCEPT_MAP),
          ),
        ]
      }
    }
  } catch {
    /* 読めなければバーなしから */
  }
  // 値が入っている概念には必ずバーを立てる(URL・保存値のどちら由来でも)
  for (const concept of activeConcepts(query)) {
    if (!added.includes(concept)) added.push(concept)
  }
  // 条件が何も無いときの初期フィールドはワード検索(常に最低1本は入口を出す)
  if (added.length === 0) added = ['keywords']

  // 新形式=PlatformId配列のJSON。旧形式(単一選択時代の生文字列 "x"/"null")は
  // JSONとして不正なのでparseが例外を投げる→そちらを単一IDとして読み替える
  let filterIds: PlatformId[] = []
  try {
    const saved = localStorage.getItem(FILTER_KEY)
    if (saved) {
      let parsed: unknown
      try {
        parsed = JSON.parse(saved)
      } catch {
        parsed = saved
      }
      if (Array.isArray(parsed)) {
        filterIds = [
          ...new Set(parsed.filter((id): id is PlatformId => PLATFORMS.some((p) => p.id === id))),
        ]
      } else if (typeof parsed === 'string' && PLATFORMS.some((p) => p.id === parsed)) {
        filterIds = [parsed as PlatformId]
      }
    }
  } catch {
    /* 読めなければ絞り込みなし */
  }

  return { query, added, filterIds }
}

/** チップ入力の確定リストをqueryの値から初期化する(起動時のみ) */
function seedChips(query: QueryState): ChipMap {
  const chips: ChipMap = {}
  for (const def of CONCEPT_DEFS) {
    if (def.widget !== 'chips') continue
    if (def.id === 'keywords') chips[def.id] = andTerms(query)
    else if (def.id === 'exactPhrase') chips[def.id] = exactPhrases(query)
    else chips[def.id] = words(query[def.field] as string)
  }
  return chips
}

export default function App() {
  const [init] = useState(loadInitial)
  const [query, setQuery] = useState(init.query)
  const [added, setAdded] = useState(init.added)
  const [chips, setChips] = useState<ChipMap>(() => seedChips(init.query))
  const [raw, setRaw] = useState<RawMap>({})
  const [filterIds, setFilterIds] = useState(init.filterIds)
  // t() はモジュールの現在言語を読むだけなので、useSyncExternalStoreの購読で
  // setLang() 呼び出し1回だけから全体の再描画が伝播する(手動の二重呼び出しをやめた)
  const lang: Lang = useSyncExternalStore(subscribe, getLang)
  // ダークモード。初期値は index.html の先読みスクリプトが付けた class から拾う
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [area, setArea] = useState<AreaId>('conditions')
  const [pickerOpen, setPickerOpen] = useState(false)
  // 名前付きで保存した検索(この端末のlocalStorage)。保存ダイアログ・一覧ダイアログ
  const [saved, setSaved] = useState<StoredQuery[]>(loadSaved)
  // What the save dialog would save: the current conditions (from the save
  // button) or a history entry being promoted to a named saved search
  const [saveTarget, setSaveTarget] = useState<QueryState | null>(null)
  const [savedListOpen, setSavedListOpen] = useState(false)
  // Automatically recorded search history (this device's localStorage).
  // Named searchHistory to avoid shadowing window.history used below
  const [searchHistory, setSearchHistory] = useState(loadHistory)
  // ピッカーの既定並びを底上げする使用頻度(frecency)。追加操作でのみ更新
  const [conceptUsage, setConceptUsage] = useState(loadConceptUsage)
  // 同じ検索を3回実行したときに一度だけ出す「保存しますか?」サジェスト
  const [promoteSuggestion, setPromoteSuggestion] = useState<HistoryEntry | null>(null)
  // mastodon/misskeyの設定済みインスタンスホスト(issue #32)
  const [instanceHosts, setInstanceHosts] = useState<InstanceHosts>(loadInstanceHosts)
  const updateInstanceHost = (id: PlatformId, host: string | null) => {
    setInstanceHosts((prev) => {
      const next = { ...prev }
      if (host) next[id] = host
      else delete next[id]
      persistInstanceHosts(next)
      return next
    })
  }
  const [historyEnabled, setHistoryEnabledState] = useState(loadHistoryEnabled)
  // 検索URLの読み込み(逆翻訳)ダイアログ
  const [reverseOpen, setReverseOpen] = useState(false)
  // 条件のパーマリンクをQRコードで見せるダイアログ
  const [qrOpen, setQrOpen] = useState(false)

  const patchQuery = (patch: Partial<QueryState>) => setQuery((q) => ({ ...q, ...patch }))

  const toggleLang = () => {
    setLang(lang === 'ja' ? 'en' : 'ja')
  }

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light')
    } catch {
      /* 保存できなくても表示は切り替わる */
    }
  }, [dark])

  // 現在の条件を常にURLへ反映しておく(ブックマーク・共有用)。
  // ただし条件が1つも無いとき(v= だけ)はクエリを付けず、初期表示のURLを汚さない。
  // 連続入力(1文字ごとのquery更新)でreplaceStateが連打されないよう間引く
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = stateToParams(query)
      const hasConditions = [...params.keys()].some((k) => k !== 'v')
      history.replaceState(
        null,
        '',
        hasConditions ? `${location.pathname}?${params}` : location.pathname,
      )
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // 次回起動時の復元用。URLと違い、バー構成やサイト絞り込みも覚える
  useEffect(() => {
    try {
      localStorage.setItem(QUERY_KEY, JSON.stringify(query))
      localStorage.setItem(ADDED_KEY, JSON.stringify(added))
      localStorage.setItem(FILTER_KEY, JSON.stringify(filterIds))
    } catch {
      /* 保存できなくても動作は続行 */
    }
  }, [query, added, filterIds])

  useSnapAreas(area, pickerOpen, setArea)

  // ---- チップ⇄query同期。確定チップ+入力中テキストが常に条件として効く ----
  const liveTokens = (def: ConceptDef, text: string): string[] => {
    const normalized = text.trim().replace(/[\s　]+/g, ' ')
    if (!normalized) return []
    return def.phrase ? [normalized] : normalized.split(' ')
  }
  const emitChips = (concept: ConceptId, nextChips: string[], nextRaw: string) => {
    const def = CONCEPT_MAP[concept]
    const tokens = [...nextChips, ...liveTokens(def, nextRaw)]
    if (concept === 'keywords') {
      patchQuery({ terms: tokens.length > 0 ? tokens : [''] })
    } else if (concept === 'exactPhrase') {
      patchQuery({ exactPhrase: tokens.length > 0 ? tokens : [''] })
    } else {
      patchQuery({ [def.field]: tokens.join(' ') })
    }
  }
  const chipsApi: ChipsApi = {
    chips,
    raw,
    onRaw: (concept, value) => {
      setRaw((r) => ({ ...r, [concept]: value }))
      emitChips(concept, chips[concept] ?? [], value)
    },
    onCommit: (concept) => {
      const tokens = liveTokens(CONCEPT_MAP[concept], raw[concept] ?? '')
      if (tokens.length === 0) return
      const next = [...(chips[concept] ?? []), ...tokens]
      setChips((c) => ({ ...c, [concept]: next }))
      setRaw((r) => ({ ...r, [concept]: '' }))
      emitChips(concept, next, '')
    },
    onRemoveChip: (concept, index) => {
      const next = (chips[concept] ?? []).filter((_, i) => i !== index)
      setChips((c) => ({ ...c, [concept]: next }))
      emitChips(concept, next, raw[concept] ?? '')
    },
  }

  // ---- 条件バーの追加・削除 ----
  // まだ何も触っていないワード検索1本だけの状態(初期フィールド)かどうか
  const isPristineKeywordSlot = (a: ConceptId[]) =>
    a.length === 1 && a[0] === 'keywords' && !activeConcepts(query).includes('keywords')
  // バーが0本にならないよう、最後の1本まで無くなったら初期フィールドへ戻す
  const withKeywordsFloor = (a: ConceptId[]): ConceptId[] => (a.length === 0 ? ['keywords'] : a)
  const addConcept = (concept: ConceptId) => {
    setPickerOpen(false)
    if (added.includes(concept)) return
    // トグル系はOFFのバーを置いても意味がないので、追加した時点でONにする
    const def = CONCEPT_MAP[concept]
    if (def.widget === 'toggle') patchQuery({ [def.field]: true })
    // 初期フィールドが空のまま条件を追加したときは、そのフィールドを追加した
    // 条件へ差し替える(空のワード検索バーと新しいバーが並ぶのを避ける)
    setAdded((a) => (isPristineKeywordSlot(a) ? [concept] : [...a, concept]))
    setConceptUsage(recordConceptUsage([concept], Date.now()))
  }
  // 家族の「まとめて追加」。未追加のものだけをまとめて足し、トグル系はONにする
  const addConcepts = (concepts: ConceptId[]) => {
    setPickerOpen(false)
    const fresh = concepts.filter((c) => !added.includes(c))
    if (fresh.length === 0) return
    const toggles: Partial<QueryState> = {}
    for (const c of fresh) {
      if (CONCEPT_MAP[c].widget === 'toggle') {
        ;(toggles as Record<string, unknown>)[CONCEPT_MAP[c].field] = true
      }
    }
    if (Object.keys(toggles).length > 0) patchQuery(toggles)
    setAdded((a) => {
      const base = isPristineKeywordSlot(a) ? [] : a
      return [...base, ...fresh.filter((c) => !base.includes(c))]
    })
    setConceptUsage(recordConceptUsage(fresh, Date.now()))
  }
  const removeConcept = (concept: ConceptId) => {
    const def = CONCEPT_MAP[concept]
    // 値も一緒に空へ戻す(残すと次回起動時のバー復元で復活してしまう)
    if (concept === 'keywords') patchQuery({ terms: [''] })
    else if (concept === 'exactPhrase') patchQuery({ exactPhrase: [''] })
    else if (concept === 'period') patchQuery({ since: '', until: '' })
    else if (concept === 'sortOrder') patchQuery({ sort: 'auto' })
    else if (def.widget === 'toggle') patchQuery({ [def.field]: false })
    else patchQuery({ [def.field]: '' })
    setAdded((a) => withKeywordsFloor(a.filter((c) => c !== concept)))
    if (def.widget === 'chips') {
      setChips((c) => ({ ...c, [concept]: [] }))
      setRaw((r) => ({ ...r, [concept]: '' }))
    }
  }

  // 検索条件をまとめて初期状態へ戻す。バー構成・チップ・入力中テキストも空にする。
  // サイト絞り込み(filterIds)は検索条件ではなくモーダルの表示設定なので残す
  const clearAll = () => {
    setQuery(defaultState())
    setAdded(['keywords'])
    setChips({})
    setRaw({})
  }
  // Action buttons (clear all / copy link / QR / save) appear only once some
  // condition holds a committed value — adding an empty bar is not enough.
  // Live (uncommitted) chip text is excluded by rebuilding chip-widget fields
  // from committed chips before counting active concepts
  const committedQuery: QueryState = { ...query }
  for (const def of CONCEPT_DEFS) {
    if (def.widget !== 'chips') continue
    const committed = chips[def.id] ?? []
    if (def.id === 'keywords') {
      committedQuery.terms = committed.length > 0 ? committed : ['']
    } else if (def.id === 'exactPhrase') {
      committedQuery.exactPhrase = committed.length > 0 ? committed : ['']
    } else {
      ;(committedQuery as unknown as Record<string, unknown>)[def.field] = committed.join(' ')
    }
  }
  const canClear = activeConcepts(committedQuery).length > 0
  // The reverse dialog's "will replace" note still counts live text and extra
  // empty bars, because applying a pasted URL wipes those too
  const isPristineAdded = added.length === 0 || (added.length === 1 && added[0] === 'keywords')
  const hasAnyConditions = activeConcepts(query).length > 0 || !isPristineAdded

  // ---- 検索の保存・復元・履歴 ----
  const handleSave = (name: string) => {
    if (saveTarget) setSaved(saveSearch(name, saveTarget, Date.now()))
    setSaveTarget(null)
  }
  const handleDelete = (params: string) => setSaved(deleteSaved(params))
  // Record an executed search when a launch link is opened. Skipped when the
  // user opted out or when there are no conditions to remember
  const recordLaunch = () => {
    if (!historyEnabled || activeConcepts(query).length === 0) return
    const updated = recordHistory(query, Date.now())
    setSearchHistory(updated)
    // 3回目の実行で一度だけ「保存しますか?」を出す(それ以降は二度と出さない)
    const params = stateToParams(query).toString()
    const entry = updated.find((e) => e.params === params)
    if (entry && entry.count === 3 && !entry.suggested) {
      setPromoteSuggestion(entry)
      setSearchHistory(markHistorySuggested(params))
    }
  }
  const toggleHistoryEnabled = (enabled: boolean) => {
    persistHistoryEnabled(enabled)
    setHistoryEnabledState(enabled)
  }
  // 保存した検索を復元。バー構成・チップも条件から組み直す(起動時の復元と同じ手順)
  const restoreSaved = (entry: { params: string }) => {
    const restored = toQuery(entry)
    setQuery(restored)
    setAdded(withKeywordsFloor([...new Set(activeConcepts(restored))]))
    setChips(seedChips(restored))
    setRaw({})
    setSavedListOpen(false)
  }
  // 貼り付けた検索URLの逆翻訳結果を適用。保存の復元と同じ手順でバー・チップを組み直す
  const applyReverse = (state: QueryState) => {
    setQuery(state)
    setAdded(withKeywordsFloor([...new Set(activeConcepts(state))]))
    setChips(seedChips(state))
    setRaw({})
    setReverseOpen(false)
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-bg text-fg">
      <DotsCanvas dark={dark} />
      <AppHeader
        dark={dark}
        onToggleDark={() => setDark((d) => !d)}
        onToggleLang={toggleLang}
        onOpenSaved={() => setSavedListOpen(true)}
      />
      {/* 2画面を縦に重ねたトラック。切り替えはトラックごと1画面分持ち上げる */}
      <div
        className="absolute inset-0 will-change-transform"
        style={{
          transform: area === 'links' ? 'translateY(-100dvh)' : 'translateY(0px)',
          transition: 'transform 780ms cubic-bezier(0.83, 0, 0.17, 1)',
        }}
      >
        <ConditionsArea
          query={query}
          added={added}
          dark={dark}
          chipsApi={chipsApi}
          patch={patchQuery}
          removeConcept={removeConcept}
          onClear={canClear ? clearAll : undefined}
          shareUrl={canClear ? permalinkUrl(query) : undefined}
          onSave={canClear ? () => setSaveTarget(query) : undefined}
          onShowQr={canClear ? () => setQrOpen(true) : undefined}
          onOpenReverse={() => setReverseOpen(true)}
          onOpenPicker={() => setPickerOpen(true)}
          onGoLinks={() => setArea('links')}
        />
        <LinksArea
          query={query}
          dark={dark}
          onGoConditions={() => setArea('conditions')}
          onLaunch={recordLaunch}
          instanceHosts={instanceHosts}
        />
      </div>
      <ConditionPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        added={added}
        filterIds={filterIds}
        query={query}
        conceptUsage={conceptUsage}
        dark={dark}
        lang={lang}
        onAdd={addConcept}
        onAddMany={addConcepts}
        onRemove={removeConcept}
        onSetFilter={setFilterIds}
      />
      <SaveSearchDialog
        open={saveTarget !== null}
        onOpenChange={(open) => {
          if (!open) setSaveTarget(null)
        }}
        defaultName={saveTarget ? searchSummary(saveTarget) : ''}
        onSave={handleSave}
      />
      <SavedListDialog
        open={savedListOpen}
        onOpenChange={setSavedListOpen}
        saved={saved}
        history={searchHistory}
        historyEnabled={historyEnabled}
        onRestore={restoreSaved}
        onDelete={handleDelete}
        onDeleteHistory={(params) => setSearchHistory(deleteHistory(params))}
        onClearHistory={() => setSearchHistory(clearHistory())}
        onToggleHistoryEnabled={toggleHistoryEnabled}
        onPromote={(entry) => setSaveTarget(toQuery(entry))}
        instanceHosts={instanceHosts}
        onChangeInstanceHost={updateInstanceHost}
      />
      <ReverseDialog
        open={reverseOpen}
        onOpenChange={setReverseOpen}
        dark={dark}
        hasConditions={hasAnyConditions}
        onApply={applyReverse}
        instanceHosts={instanceHosts}
      />
      <QrDialog
        open={qrOpen}
        onOpenChange={setQrOpen}
        url={canClear ? permalinkUrl(query) : undefined}
      />
      {promoteSuggestion && (
        <div
          className="fixed inset-x-0 bottom-5 z-[70] flex justify-center px-4"
          style={{ animation: 'dl-fade 180ms ease both' }}
        >
          <div className="flex items-center gap-3 rounded-full border border-border bg-card py-2 pr-2 pl-4 shadow-[0_10px_30px_oklch(0_0_0_/_0.18)]">
            <span className="text-[12.5px] font-medium text-muted">
              {t('history.promoteSuggest.message')}
            </span>
            <button
              type="button"
              data-noscale
              className="inline-flex h-8 cursor-pointer items-center rounded-full bg-accent px-3.5 text-[12.5px] font-semibold text-white"
              onClick={() => {
                setSaveTarget(query)
                setPromoteSuggestion(null)
              }}
            >
              {t('history.promoteSuggest.save')}
            </button>
            <button
              type="button"
              data-noscale
              aria-label={t('history.promoteSuggest.dismiss')}
              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-faint hover:text-fg"
              onClick={() => setPromoteSuggestion(null)}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
