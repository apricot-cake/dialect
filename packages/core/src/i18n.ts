import { ja } from './ja.js'
import { en } from './en.js'

export { ja, en }
export type MessageKey = keyof typeof ja
export type Lang = 'ja' | 'en'

const DICTS: Record<Lang, Record<MessageKey, string>> = { ja, en }

/** Look up a message in an explicit language, independent of any ambient current-language state. */
export function translate(lang: Lang, key: MessageKey): string {
  return DICTS[lang][key] ?? ja[key]
}
