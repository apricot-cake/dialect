import { ja } from './ja'

export type MessageKey = keyof typeof ja

export function t(key: MessageKey): string {
  return ja[key]
}
