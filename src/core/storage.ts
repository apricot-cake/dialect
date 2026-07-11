import type { PlatformId, QueryState } from './types'
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
}

function isHistoryEntry(e: unknown): e is HistoryEntry {
  return (
    typeof e === 'object' &&
    e !== null &&
    typeof (e as HistoryEntry).params === 'string' &&
    typeof (e as HistoryEntry).lastUsedAt === 'number' &&
    typeof (e as HistoryEntry).count === 'number'
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
  const count = (prev.find((e) => e.params === params)?.count ?? 0) + 1
  const rest = prev.filter((e) => e.params !== params)
  return storeHistory([{ params, lastUsedAt: now, count }, ...rest].slice(0, HISTORY_MAX))
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
