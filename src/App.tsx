import { useEffect, useState } from 'react'
import type { ConceptId, PlatformId, QueryState } from '@/core/types'
import { activeConcepts, defaultState } from '@/core/concepts'
import { CONCEPT_DEFS, CONCEPT_MAP, type ConceptDef } from '@/core/conceptDefs'
import { paramsToQuery, stateToParams } from '@/core/permalink'
import { PLATFORMS } from '@/core/platforms'
import { andTerms, exactPhrases, words } from '@/core/text'
import { getLang, setLang, type Lang } from '@/i18n'
import { AppHeader } from '@/components/AppHeader'
import { DotsCanvas } from '@/components/DotsCanvas'
import { ConditionsArea, type ChipsApi } from '@/components/ConditionsArea'
import { LinksArea } from '@/components/LinksArea'
import { ConditionPicker } from '@/components/ConditionPicker'
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
  if (!['', 'illust', 'manga'].includes(query.workType)) query.workType = ''
  if (!['', 'video', 'short', 'channel', 'playlist'].includes(query.resultType)) {
    query.resultType = ''
  }
  if (!['', '00users', '000users', '0000users'].includes(query.pixivPopular)) {
    query.pixivPopular = ''
  }
  if (!['', 'safe', 'r18'].includes(query.ageRating)) query.ageRating = ''
  if (!['new', 'top', 'hot', 'auto'].includes(query.sort)) query.sort = 'new'
  if (!['', 'ja', 'en'].includes(query.language)) query.language = ''
  return query
}

/** 起動時の状態。URLパラメータがあれば最優先、なければ前回のlocalStorage */
function loadInitial(): {
  query: QueryState
  added: ConceptId[]
  filterId: PlatformId | null
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
            parsed.filter(
              (c): c is ConceptId =>
                typeof c === 'string' && c !== 'keywords' && c in CONCEPT_MAP,
            ),
          ),
        ]
      }
    }
  } catch {
    /* 読めなければバーなしから */
  }
  // 値が入っている概念には必ずバーを立てる(URL・保存値のどちら由来でも)
  for (const concept of activeConcepts(query)) {
    if (concept !== 'keywords' && !added.includes(concept)) added.push(concept)
  }

  let filterId: PlatformId | null = null
  try {
    const saved = localStorage.getItem(FILTER_KEY)
    if (saved && saved !== 'null' && PLATFORMS.some((p) => p.id === saved)) {
      filterId = saved as PlatformId
    }
  } catch {
    /* 読めなければ絞り込みなし */
  }

  return { query, added, filterId }
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
  const [filterId, setFilterId] = useState(init.filterId)
  // t() はモジュールの現在言語を読むだけなので、切替時はこのstate更新で全体を再描画する
  const [lang, setLangState] = useState<Lang>(getLang)
  // ダークモード。初期値は index.html の先読みスクリプトが付けた class から拾う
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  )
  const [area, setArea] = useState<AreaId>('conditions')
  const [pickerOpen, setPickerOpen] = useState(false)

  const patchQuery = (patch: Partial<QueryState>) =>
    setQuery((q) => ({ ...q, ...patch }))

  const toggleLang = () => {
    const next: Lang = lang === 'ja' ? 'en' : 'ja'
    setLang(next)
    setLangState(next)
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
  // ただし条件が1つも無いとき(v= だけ)はクエリを付けず、初期表示のURLを汚さない
  useEffect(() => {
    const params = stateToParams(query)
    const hasConditions = [...params.keys()].some((k) => k !== 'v')
    history.replaceState(
      null,
      '',
      hasConditions ? `${location.pathname}?${params}` : location.pathname,
    )
  }, [query])

  // 次回起動時の復元用。URLと違い、バー構成やサイト絞り込みも覚える
  useEffect(() => {
    try {
      localStorage.setItem(QUERY_KEY, JSON.stringify(query))
      localStorage.setItem(ADDED_KEY, JSON.stringify(added))
      localStorage.setItem(FILTER_KEY, filterId ?? 'null')
    } catch {
      /* 保存できなくても動作は続行 */
    }
  }, [query, added, filterId])

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
  const addConcept = (concept: ConceptId) => {
    setPickerOpen(false)
    if (added.includes(concept)) return
    // トグル系はOFFのバーを置いても意味がないので、追加した時点でONにする
    const def = CONCEPT_MAP[concept]
    if (def.widget === 'toggle') patchQuery({ [def.field]: true })
    setAdded((a) => [...a, concept])
  }
  const removeConcept = (concept: ConceptId) => {
    const def = CONCEPT_MAP[concept]
    // 値も一緒に空へ戻す(残すと次回起動時のバー復元で復活してしまう)
    if (concept === 'exactPhrase') patchQuery({ exactPhrase: [''] })
    else if (concept === 'period') patchQuery({ since: '', until: '' })
    else if (concept === 'sortOrder') patchQuery({ sort: 'new' })
    else if (def.widget === 'toggle') patchQuery({ [def.field]: false })
    else patchQuery({ [def.field]: '' })
    setAdded((a) => a.filter((c) => c !== concept))
    if (def.widget === 'chips') {
      setChips((c) => ({ ...c, [concept]: [] }))
      setRaw((r) => ({ ...r, [concept]: '' }))
    }
  }

  // 検索条件をまとめて初期状態へ戻す。バー構成・チップ・入力中テキストも空にする。
  // サイト絞り込み(filterId)は検索条件ではなくモーダルの表示設定なので残す
  const clearAll = () => {
    setQuery(defaultState())
    setAdded([])
    setChips({})
    setRaw({})
  }
  // 消すものが何も無い(初期状態)ときはクリアを出さない。
  // 入力中テキストも emitChips で query に即反映されるため activeConcepts で拾える
  const canClear = added.length > 0 || activeConcepts(query).length > 0

  return (
    <div className="fixed inset-0 overflow-hidden bg-bg text-fg">
      <DotsCanvas dark={dark} />
      <AppHeader
        dark={dark}
        onToggleDark={() => setDark((d) => !d)}
        onToggleLang={toggleLang}
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
          onOpenPicker={() => setPickerOpen(true)}
          onGoLinks={() => setArea('links')}
        />
        <LinksArea
          query={query}
          dark={dark}
          onGoConditions={() => setArea('conditions')}
        />
      </div>
      <ConditionPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        added={added}
        filterId={filterId}
        query={query}
        dark={dark}
        onAdd={addConcept}
        onRemove={removeConcept}
        onSetFilter={setFilterId}
      />
    </div>
  )
}
