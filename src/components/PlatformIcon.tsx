import {
  siBluesky,
  siFacebook,
  siInstagram,
  siNiconico,
  siNote,
  siReddit,
  siThreads,
  siTiktok,
  siX,
  siYoutube,
} from 'simple-icons'
import type { PlatformId } from '@/core/types'

// simple-icons(CC0)のブランドロゴ。色は currentColor を継承する
const ICONS: Record<PlatformId, { path: string }> = {
  x: siX,
  bluesky: siBluesky,
  youtube: siYoutube,
  note: siNote,
  niconico: siNiconico,
  threads: siThreads,
  instagram: siInstagram,
  tiktok: siTiktok,
  facebook: siFacebook,
  reddit: siReddit,
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
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={style}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d={ICONS[id].path} />
    </svg>
  )
}
