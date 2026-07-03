import {
  siBluesky,
  siFacebook,
  siGoogle,
  siHatenabookmark,
  siInstagram,
  siMastodon,
  siMisskey,
  siNiconico,
  siNote,
  siPixiv,
  siReddit,
  siThreads,
  siTiktok,
  siTwitch,
  siX,
  siYoutube,
} from 'simple-icons'
import type { PlatformId } from '@/core/types'

// simple-icons(CC0)のブランドロゴ。色は currentColor を継承する。
// ブランドロゴがないサイト(5ちゃんねる・あにまん)は吹き出し+文字の自作アイコン、
// ニコニコ静画はniconicoのロゴを静画のブランド色で使い分ける
const ICONS: Partial<Record<PlatformId, { path: string }>> = {
  x: siX,
  bluesky: siBluesky,
  mastodon: siMastodon,
  youtube: siYoutube,
  note: siNote,
  niconico: siNiconico,
  threads: siThreads,
  instagram: siInstagram,
  tiktok: siTiktok,
  facebook: siFacebook,
  reddit: siReddit,
  pixiv: siPixiv,
  misskey: siMisskey,
  hatebu: siHatenabookmark,
  twitch: siTwitch,
  seiga: siNiconico,
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
}: {
  id: PlatformId
  className?: string
  style?: React.CSSProperties
}) {
  if (id === 'fivech') {
    return <BubbleIcon label="5" fontSize={12} className={className} style={style} />
  }
  if (id === 'animanch') {
    return <BubbleIcon label="あ" fontSize={11} className={className} style={style} />
  }
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={style}
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
