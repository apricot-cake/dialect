import {
  siBluesky,
  siGoogle,
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
import type { PlatformId } from '@/core/types'
import { cn } from '@/lib/utils'

// simple-icons(CC0)のブランドロゴ。色は currentColor を継承する。
// simple-iconsにないサイトは自作アイコン: 5ちゃんねる・あにまんは吹き出し+文字
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

/** 吹き出しの輪郭(lucideのmessage-square相当)。掲示板サイトの自作アイコン用 */
const BUBBLE_PATH = 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'

/** ブランドロゴのない掲示板用: 塗りつぶした吹き出し+白抜き1文字。
    アイコンは14〜16pxで表示されるため、文字は1文字でないと読めない */
function BubbleIcon({
  label,
  fontSize,
  className,
  style,
}: {
  label: string
  fontSize: number
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={style}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d={BUBBLE_PATH} />
      <text
        x="12"
        y="14"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={fontSize}
        fontWeight="bold"
        fill="#fff"
      >
        {label}
      </text>
    </svg>
  )
}

export function PlatformIcon({
  id,
  className,
  style,
  brandColor,
}: {
  id: PlatformId
  className?: string
  style?: React.CSSProperties
  /** 指定すると色をブランド色に。X/niconico など暗い色はダーク時に白へ寄せて可視化する */
  brandColor?: string
}) {
  // ライト時はブランド色そのまま、ダーク時だけ白へ少し寄せる(暗い色が暗い面に埋もれるのを防ぐ)
  const colorClass = brandColor
    ? 'text-(--brand-icon) dark:text-[color-mix(in_oklch,var(--brand-icon)_72%,white)]'
    : undefined
  const mergedStyle = brandColor
    ? ({ ...style, '--brand-icon': brandColor } as React.CSSProperties)
    : style
  if (id === 'fivech') {
    return (
      <BubbleIcon
        label="5"
        fontSize={12}
        className={cn(colorClass, className)}
        style={mergedStyle}
      />
    )
  }
  if (id === 'animanch') {
    return (
      <BubbleIcon
        label="あ"
        fontSize={11}
        className={cn(colorClass, className)}
        style={mergedStyle}
      />
    )
  }
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn(colorClass, className)}
      style={mergedStyle}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d={ICONS[id]!.path} />
    </svg>
  )
}

/** Googleフォールバックのボタン用(PlatformIdにはGoogleは含まれない) */
export function GoogleIcon({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={style}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d={siGoogle.path} />
    </svg>
  )
}
