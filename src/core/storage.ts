import type { PlatformId, QueryState } from './types'
import { paramsToQuery, stateToParams } from './permalink'
import { PLATFORMS } from './platforms'

// 保存形式はパーマリンクと同じクエリ文字列。バージョン管理も permalink.ts に相乗りする。
const SAVED_KEY = 'dialect.saved.v1'
const HISTORY_KEY = 'dialect.history.v1'
const HIDDEN_PLATFORMS_KEY = 'dialect.hiddenPlatforms.v1'
const HISTORY_MAX = 10

export interface StoredQuery {
  params: string
  savedAt: number
}

function load(key: string): StoredQuery[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (e): e is StoredQuery =>
        typeof e === 'object' &&
        e !== null &&
        typeof (e as StoredQuery).params === 'string',
    )
  } catch {
    return []
  }
}

function store(key: string, entries: StoredQuery[]) {
  localStorage.setItem(key, JSON.stringify(entries))
}

export function loadSaved(): StoredQuery[] {
  return load(SAVED_KEY)
}

export function loadHistory(): StoredQuery[] {
  return load(HISTORY_KEY)
}

export function saveSearch(state: QueryState): StoredQuery[] {
  const params = stateToParams(state).toString()
  const entries = loadSaved().filter((e) => e.params !== params)
  entries.unshift({ params, savedAt: Date.now() })
  store(SAVED_KEY, entries)
  return entries
}

export function deleteSaved(params: string): StoredQuery[] {
  const entries = loadSaved().filter((e) => e.params !== params)
  store(SAVED_KEY, entries)
  return entries
}

/** 検索ボタンを押したときに履歴へ積む。直前と同じ条件なら何もしない */
export function recordHistory(state: QueryState): StoredQuery[] {
  const params = stateToParams(state).toString()
  let entries = loadHistory()
  if (entries[0]?.params === params) return entries
  entries = entries.filter((e) => e.params !== params)
  entries.unshift({ params, savedAt: Date.now() })
  entries = entries.slice(0, HISTORY_MAX)
  store(HISTORY_KEY, entries)
  return entries
}

export function toQuery(entry: StoredQuery): QueryState {
  return paramsToQuery(new URLSearchParams(entry.params))
}

/**
 * 非表示にしたサイトのID。「表示」でなく「非表示」を持つことで、
 * 将来サイトが増えたときに新サイトが自動で表示側に入る
 */
export function loadHiddenPlatforms(): PlatformId[] {
  try {
    const raw = localStorage.getItem(HIDDEN_PLATFORMS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return PLATFORMS.filter((p) => parsed.includes(p.id)).map((p) => p.id)
  } catch {
    return []
  }
}

export function storeHiddenPlatforms(ids: PlatformId[]) {
  localStorage.setItem(HIDDEN_PLATFORMS_KEY, JSON.stringify(ids))
}
