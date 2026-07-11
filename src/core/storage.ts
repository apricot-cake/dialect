import type { ConceptId, PlatformId, QueryState } from './types'
import { paramsToQuery, stateToParams } from './permalink'
import { PLATFORMS } from './platforms'

// 名前付きで保存した検索を localStorage に持つ。保存形式は条件をパーマリンクと同じ
// クエリ文字列(params)に畳んだもので、バージョン管理は permalink.ts に相乗りする。
// 同じ条件(params一致)を保存し直したら名前を上書きして1件にまとめる。
const SAVED_KEY = 'dialect.saved.v1'

export interface StoredQuery {
  /** 表示名(ユーザーが保存時に付ける) */
  name: string
  /** 条件をパーマリンクのクエリ文字列に畳んだもの。一意キーも兼ねる */
  params: string
  /** 保存時刻(ミリ秒)。新しい順に並べるために持つ */
  savedAt: number
}

function isStored(e: unknown): e is StoredQuery {
  return (
    typeof e === 'object' &&
    e !== null &&
    typeof (e as StoredQuery).params === 'string' &&
    typeof (e as StoredQuery).name === 'string'
  )
}

export function loadSaved(): StoredQuery[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isStored) : []
  } catch {
    return []
  }
}

function store(entries: StoredQuery[]): StoredQuery[] {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(entries))
  } catch {
    /* 保存できなくても一覧はそのまま返す(このセッションでは使える) */
  }
  return entries
}

/** 現在の条件を名前付きで保存する。同じ条件が既にあれば名前を更新して先頭へ */
export function saveSearch(name: string, state: QueryState, now: number): StoredQuery[] {
  const params = stateToParams(state).toString()
  const rest = loadSaved().filter((e) => e.params !== params)
  return store([{ name: name.trim(), params, savedAt: now }, ...rest])
}

export function deleteSaved(params: string): StoredQuery[] {
  return store(loadSaved().filter((e) => e.params !== params))
}

/** 保存した検索・履歴を復元用の条件へ戻す */
export function toQuery(entry: { params: string }): QueryState {
  return paramsToQuery(new URLSearchParams(entry.params))
}

// Search history: recorded automatically when a launch link is opened. Entries
// reuse the same params string as saved searches, so the unique key and the
// restore path are shared with StoredQuery.
const HISTORY_KEY = 'dialect.history.v1'
const HISTORY_ENABLED_KEY = 'dialect.history.enabled'
const HISTORY_MAX = 50

export interface HistoryEntry {
  /** Conditions folded into a permalink query string; doubles as the unique key */
  params: string
  /** Last time this search was executed (ms) */
  lastUsedAt: number
  /** How many times this exact search was executed */
  count: number
  /** Whether the "save this search?" suggestion has already been shown once */
  suggested?: boolean
}

function isHistoryEntry(e: unknown): e is HistoryEntry {
  return (
    typeof e === 'object' &&
    e !== null &&
    typeof (e as HistoryEntry).params === 'string' &&
    typeof (e as HistoryEntry).lastUsedAt === 'number' &&
    typeof (e as HistoryEntry).count === 'number' &&
    ((e as HistoryEntry).suggested === undefined ||
      typeof (e as HistoryEntry).suggested === 'boolean')
  )
}

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isHistoryEntry) : []
  } catch {
    return []
  }
}

function storeHistory(entries: HistoryEntry[]): HistoryEntry[] {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries))
  } catch {
    /* keep the in-memory list usable even when persisting fails */
  }
  return entries
}

/**
 * Record an executed search. Re-running the same conditions bumps its count
 * and moves it to the front; the list is capped at HISTORY_MAX (oldest dropped).
 */
export function recordHistory(state: QueryState, now: number): HistoryEntry[] {
  const params = stateToParams(state).toString()
  const prev = loadHistory()
  const existing = prev.find((e) => e.params === params)
  const count = (existing?.count ?? 0) + 1
  const rest = prev.filter((e) => e.params !== params)
  return storeHistory(
    [{ params, lastUsedAt: now, count, suggested: existing?.suggested }, ...rest].slice(
      0,
      HISTORY_MAX,
    ),
  )
}

/** 昇格サジェストを表示したことを記録する(以後そのエントリでは二度と出さない) */
export function markHistorySuggested(params: string): HistoryEntry[] {
  return storeHistory(
    loadHistory().map((e) => (e.params === params ? { ...e, suggested: true } : e)),
  )
}

export function deleteHistory(params: string): HistoryEntry[] {
  return storeHistory(loadHistory().filter((e) => e.params !== params))
}

export function clearHistory(): HistoryEntry[] {
  return storeHistory([])
}

/** Whether automatic history recording is on (defaults to on) */
export function loadHistoryEnabled(): boolean {
  try {
    return localStorage.getItem(HISTORY_ENABLED_KEY) !== 'false'
  } catch {
    return true
  }
}

export function persistHistoryEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(HISTORY_ENABLED_KEY, String(enabled))
  } catch {
    /* the toggle still applies for this session */
  }
}

// Bulk-open site selection: stored as the EXCLUDED set, not the selected one.
// This keeps the default "all sites" correct after a new platform is added
// later, even for users who already opened the picker and unchecked a few.
const BULK_OPEN_EXCLUDED_KEY = 'dialect.bulkOpen.excluded.v1'

export function loadBulkOpenExcluded(): PlatformId[] {
  try {
    const raw = localStorage.getItem(BULK_OPEN_EXCLUDED_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (v): v is PlatformId => typeof v === 'string' && PLATFORMS.some((p) => p.id === v),
    )
  } catch {
    return []
  }
}

export function persistBulkOpenExcluded(excluded: PlatformId[]): void {
  try {
    localStorage.setItem(BULK_OPEN_EXCLUDED_KEY, JSON.stringify(excluded))
  } catch {
    /* the selection still applies for this session */
  }
}

// Picker default-order frecency: how often/recently each concept was added.
// Recorded on concept-add operations only (not removal), read back to boost
// the picker's default ordering (see ConditionPicker.tsx).
const CONCEPT_USAGE_KEY = 'dialect.conceptUsage.v1'

export interface ConceptUsage {
  count: number
  lastUsedAt: number
}

export type ConceptUsageMap = Partial<Record<ConceptId, ConceptUsage>>

function isConceptUsage(v: unknown): v is ConceptUsage {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as ConceptUsage).count === 'number' &&
    typeof (v as ConceptUsage).lastUsedAt === 'number'
  )
}

export function loadConceptUsage(): ConceptUsageMap {
  try {
    const raw = localStorage.getItem(CONCEPT_USAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return {}
    const out: ConceptUsageMap = {}
    for (const [id, entry] of Object.entries(parsed as Record<string, unknown>)) {
      if (isConceptUsage(entry)) out[id as ConceptId] = entry
    }
    return out
  } catch {
    return {}
  }
}

function storeConceptUsage(usage: ConceptUsageMap): ConceptUsageMap {
  try {
    localStorage.setItem(CONCEPT_USAGE_KEY, JSON.stringify(usage))
  } catch {
    /* 保存できなくても今回のセッションの並びには反映される */
  }
  return usage
}

/** 追加した概念のカウントを+1し、最終使用時刻を更新する */
export function recordConceptUsage(concepts: ConceptId[], now: number): ConceptUsageMap {
  const usage = loadConceptUsage()
  for (const id of concepts) {
    const prev = usage[id]
    usage[id] = { count: (prev?.count ?? 0) + 1, lastUsedAt: now }
  }
  return storeConceptUsage(usage)
}

/** frecencyスコア: count × 0.5^(経過日数/30)。使用実績が無ければ0 */
export function conceptFrecency(usage: ConceptUsageMap, id: ConceptId, now: number): number {
  const entry = usage[id]
  if (!entry) return 0
  const days = (now - entry.lastUsedAt) / (1000 * 60 * 60 * 24)
  return entry.count * Math.pow(0.5, days / 30)
}

// Export/import: bundles every dialect.* localStorage key (saved searches,
// history, current query, language, filter...) into one downloadable JSON,
// since this device's localStorage is the only place any of it lives (no
// backend). Applying a backup only touches localStorage; the caller reloads
// the page afterward so every piece of app state re-syncs from it, the same
// path a fresh visit already takes.
const DIALECT_KEY_PREFIX = 'dialect.'
const BACKUP_VERSION = 1

export interface Backup {
  version: number
  exportedAt: number
  data: Record<string, string>
}

function isBackup(v: unknown): v is Backup {
  if (typeof v !== 'object' || v === null) return false
  const b = v as Backup
  if (typeof b.version !== 'number' || typeof b.data !== 'object' || b.data === null) return false
  return Object.entries(b.data).every(
    ([k, val]) => typeof k === 'string' && typeof val === 'string',
  )
}

export function exportBackup(now: number): Backup {
  const data: Record<string, string> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key || !key.startsWith(DIALECT_KEY_PREFIX)) continue
    const value = localStorage.getItem(key)
    if (value !== null) data[key] = value
  }
  return { version: BACKUP_VERSION, exportedAt: now, data }
}

/** 壊れた・形式の合わないファイルは null を返す(呼び出し側でエラー表示する) */
export function parseBackup(text: string): Backup | null {
  try {
    const parsed: unknown = JSON.parse(text)
    return isBackup(parsed) ? parsed : null
  } catch {
    return null
  }
}

/** 保存検索・履歴の配列を一意キー(params)単位で統合する。競合時はバックアップ側を優先する */
function mergeJsonArray(localRaw: string | null, backupRaw: string): string {
  const asArray = (raw: string | null): Array<{ params?: unknown }> => {
    try {
      const parsed: unknown = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  const map = new Map<string, { params?: unknown }>()
  for (const e of asArray(localRaw)) {
    if (typeof e.params === 'string') map.set(e.params, e)
  }
  for (const e of asArray(backupRaw)) {
    if (typeof e.params === 'string') map.set(e.params, e)
  }
  return JSON.stringify([...map.values()])
}

// 統合(マージ)で「配列を一意キーで足し合わせる」対象キー。それ以外のスカラー系
// キー(現在の条件・言語・設定トグル等)は、既に値があればこの端末側を残す
const MERGE_ARRAY_KEYS = new Set([SAVED_KEY, HISTORY_KEY])

/**
 * バックアップを適用する(localStorageのみ更新。反映には呼び出し側でreloadが必要)。
 * replace: 既存のdialect.*キーを全消去してからバックアップの内容だけを書く。
 * 統合(replace=false): 保存検索・履歴は一意キーで足し合わせ、それ以外は既存値があれば残す
 */
export function applyBackup(backup: Backup, replace: boolean): void {
  try {
    if (replace) {
      const toRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(DIALECT_KEY_PREFIX)) toRemove.push(key)
      }
      for (const key of toRemove) localStorage.removeItem(key)
      for (const [key, value] of Object.entries(backup.data)) {
        if (key.startsWith(DIALECT_KEY_PREFIX)) localStorage.setItem(key, value)
      }
      return
    }
    for (const [key, value] of Object.entries(backup.data)) {
      if (!key.startsWith(DIALECT_KEY_PREFIX)) continue
      if (MERGE_ARRAY_KEYS.has(key)) {
        localStorage.setItem(key, mergeJsonArray(localStorage.getItem(key), value))
      } else if (localStorage.getItem(key) === null) {
        localStorage.setItem(key, value)
      }
    }
  } catch {
    /* 反映できなくても呼び出し側のreloadでこれまでの状態のまま起動する */
  }
}
