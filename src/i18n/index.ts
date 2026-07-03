import { ja } from './ja'
import { en } from './en'

export type MessageKey = keyof typeof ja
export type Lang = 'ja' | 'en'

const DICTS: Record<Lang, Record<MessageKey, string>> = { ja, en }
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

export function getLang(): Lang {
  return currentLang
}

/** 言語を切り替えて保存する。呼び出し側で再描画をトリガーすること */
export function setLang(lang: Lang): void {
  currentLang = lang
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    /* 保存できなくても表示切替は成立する */
  }
  document.documentElement.lang = lang
}

export function t(key: MessageKey): string {
  return DICTS[currentLang][key] ?? ja[key]
}

/**
 * {name} などのプレースホルダを差し込む。語順が言語で変わる文言に使う
 * (例: 「{name}で検索」/「Search {name}」)
 */
export function tf(key: MessageKey, params: Record<string, string>): string {
  return t(key).replace(/\{(\w+)\}/g, (_, k: string) => params[k] ?? '')
}
