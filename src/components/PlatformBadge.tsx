import {
  siBluesky,
  siHatenabookmark,
  siInstagram,
  siMisskey,
  siNiconico,
  siNote,
  siPixiv,
  siReddit,
  siTwitch,
  siX,
  siYoutube,
} from 'simple-icons'
import type { PlatformDef, PlatformId } from '@/core/types'

// simple-icons(CC0)のブランドロゴ。simple-iconsにないサイトは角丸矩形+1文字で代替
const ICONS: Partial<Record<PlatformId, { path: string }>> = {
  x: siX,
  bluesky: siBluesky,
  youtube: siYoutube,
  note: siNote,
  niconico: siNiconico,
  instagram: siInstagram,
  reddit: siReddit,
  pixiv: siPixiv,
  misskey: siMisskey,
  hatebu: siHatenabookmark,
  twitch: siTwitch,
}

const BUBBLE: Partial<Record<PlatformId, string>> = { fivech: '5', animanch: 'あ' }

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

/**
 * ブランドアイコン1つ。simple-iconsのロゴ、なければ角丸矩形+1文字の吹き出し風。
 * color/bubbleBg/bubbleFg を渡すと配色を上書きできる(ブランド色ボタンの上など)
 */
export function PlatformBadge({
  platform,
  dark,
  size = 15,
  color,
  bubbleBg,
  bubbleFg,
}: {
  platform: PlatformDef
  dark: boolean
  size?: number
  color?: string
  bubbleBg?: string
  bubbleFg?: string
}) {
  const c = color ?? badgeColor(platform, dark)
  const char = BUBBLE[platform.id]
  if (char) {
    return (
      <span
        aria-hidden
        className="inline-flex shrink-0 items-center justify-center rounded-[3px] font-bold"
        style={{
          width: size,
          height: size - 1,
          fontSize: Math.round(size * 0.55),
          color: bubbleFg ?? '#fff',
          background: bubbleBg ?? c,
        }}
      >
        {char}
      </span>
    )
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={c}
      aria-hidden
      className="block shrink-0"
    >
      <path d={ICONS[platform.id]!.path} />
    </svg>
  )
}

/** 対応ポップオーバー用: 淡い角丸タイルに載せたバッジ */
export function PlatformBadgeTile({
  platform,
  dark,
}: {
  platform: PlatformDef
  dark: boolean
}) {
  return (
    <span
      title={platform.name}
      className="inline-flex size-[26px] items-center justify-center rounded-[7px] bg-secondary"
    >
      <PlatformBadge platform={platform} dark={dark} size={15} />
    </span>
  )
}
