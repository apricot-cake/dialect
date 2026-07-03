import {
  siBluesky,
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
// simple-iconsにないサイトは自作アイコン: 5ちゃんねる・あにまんは吹き出し+文字、
// ニコニコ静画は公式シンボル(テレビちゃん+双葉)を単色に簡略化したもの
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
  reddit: siReddit,
  pixiv: siPixiv,
  misskey: siMisskey,
  hatebu: siHatenabookmark,
  twitch: siTwitch,
}

/**
 * ニコニコ静画: 公式favicon(白いテレビちゃん+頭の双葉)を忠実にベクター化。
 * 白い本体+緑の葉の固定配色のため、他と違い currentColor を使わない
 */
function SeigaIcon({
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
      aria-hidden="true"
    >
      {/* 茎 */}
      <path d="M11.2 4.6h1.6v5h-1.6z" fill="#333" />
      {/* 双葉(緑+輪郭) */}
      <rect x="3.5" y="4" width="7.4" height="3.3" rx="1" fill="#2FBF00" stroke="#333" strokeWidth="1.4" transform="rotate(-7 7.2 5.65)" />
      <rect x="13.1" y="4" width="7.4" height="3.3" rx="1" fill="#2FBF00" stroke="#333" strokeWidth="1.4" transform="rotate(7 16.8 5.65)" />
      {/* 足 */}
      <path d="M6.5 19h3v2.4h-3zM14.5 19h3v2.4h-3z" fill="#333" />
      {/* テレビ本体(白+輪郭) */}
      <rect x="4" y="9.5" width="16" height="10" rx="1.6" fill="#fff" stroke="#333" strokeWidth="1.8" />
      {/* 目と口(凸) */}
      <path d="M8.1 12.2h1.6v3.4H8.1zM14.3 12.2h1.6v3.4h-1.6zM11.3 15.5h1.4v1.1h1.3v1.4H10v-1.4h1.3z" fill="#333" />
    </svg>
  )
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
  if (id === 'seiga') {
    return <SeigaIcon className={className} style={style} />
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
