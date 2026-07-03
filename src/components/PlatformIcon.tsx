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
  facebook: siFacebook,
  reddit: siReddit,
  pixiv: siPixiv,
  misskey: siMisskey,
  hatebu: siHatenabookmark,
  twitch: siTwitch,
}

/** ニコニコ静画: テレビちゃん(本体)+頭の双葉。faviconのシンボルを単色に簡略化 */
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
      fill="currentColor"
      aria-hidden="true"
    >
      {/* 双葉(茎+左右の葉) */}
      <path d="M11.4 9V6.2h1.2V9h-1.2z" />
      <path d="M12 6.6C10 7 8.2 5.9 7.6 3.9c2-.5 3.9.7 4.4 2.7z" />
      <path d="M12 6.6c2 .4 3.8-.7 4.4-2.7-2-.5-3.9.7-4.4 2.7z" />
      {/* テレビ本体(白抜きの目と口) */}
      <path
        d="M5 9a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2H5zM7.9 14.3a1.1 1.1 0 1 0 2.2 0 1.1 1.1 0 1 0-2.2 0zm6 0a1.1 1.1 0 1 0 2.2 0 1.1 1.1 0 1 0-2.2 0zM9.1 17.3h5.8v1.2H9.1z"
        fillRule="evenodd"
      />
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
