import type { QueryState } from './types'
import { paramsToQuery, stateToParams } from './permalink'

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

/** 保存した検索を復元用の条件へ戻す */
export function toQuery(entry: StoredQuery): QueryState {
  return paramsToQuery(new URLSearchParams(entry.params))
}
