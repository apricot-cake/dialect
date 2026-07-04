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
import { badgeColor } from '@/lib/color'

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
