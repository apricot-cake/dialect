import type { PlatformDef } from '@apricot-cake/dialect-core'

/**
 * ブランド色の上に置く文字色を輝度から決める。Misskey(黄緑)のような明るい色は
 * 白だと沈むので濃色にする。YIQ近似の知覚輝度が 0.6 超なら濃色
 */
export function readableInk(hex: string): string {
  const m = hex.replace('#', '')
  const r = parseInt(m.slice(0, 2), 16)
  const g = parseInt(m.slice(2, 4), 16)
  const b = parseInt(m.slice(4, 6), 16)
  return (r * 0.299 + g * 0.587 + b * 0.114) / 255 > 0.6 ? '#1a1a1a' : '#ffffff'
}

function isDarkColor(hex: string): boolean {
  const m = hex.replace('#', '')
  const r = parseInt(m.slice(0, 2), 16)
  const g = parseInt(m.slice(2, 4), 16)
  const b = parseInt(m.slice(4, 6), 16)
  return (r * 0.299 + g * 0.587 + b * 0.114) / 255 < 0.32
}

/** ダーク時、暗いブランド色(X・niconico)は明るいグレーへ寄せて沈みを防ぐ */
export function badgeColor(platform: PlatformDef, dark: boolean): string {
  return dark && isDarkColor(platform.brandColor) ? '#c9d1d9' : platform.brandColor
}
