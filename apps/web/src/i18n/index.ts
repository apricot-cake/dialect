import { translate, type Lang, type MessageKey } from '@apricot-cake/dialect-core'

export type { Lang, MessageKey }

const STORAGE_KEY = 'dialect.lang'

/** 保存された言語 → ブラウザ言語 → 既定(日本語)の順で初期言語を決める */
function detectInitial(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'ja' || saved === 'en') return saved
  } catch {
    /* localStorage 不可のときは既定にフォールバック */
  }
  return navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'ja'
}

let currentLang: Lang = detectInitial()
document.documentElement.lang = currentLang

const listeners = new Set<() => void>()

export function getLang(): Lang {
  return currentLang
}

/**
 * useSyncExternalStore 用の購読登録。App がこれで現在言語を読むことで、setLang() の
 * 呼び出しだけで再描画がReact標準の仕組みで伝播する(手動の二重呼び出しをここに閉じる)
 */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** 言語を切り替えて保存する。購読者(App)への再描画通知もここで完結する */
export function setLang(lang: Lang): void {
  currentLang = lang
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    /* 保存できなくても表示切替は成立する */
  }
  document.documentElement.lang = lang
  for (const listener of listeners) listener()
}

export function t(key: MessageKey): string {
  return translate(currentLang, key)
}

/**
 * {name} などのプレースホルダを差し込む。語順が言語で変わる文言に使う
 * (例: 「{name}で検索」/「Search {name}」)
 */
export function tf(key: MessageKey, params: Record<string, string>): string {
  return t(key).replace(/\{(\w+)\}/g, (_, k: string) => params[k] ?? '')
}
