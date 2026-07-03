import type { PlatformDef } from '../types'
import { x } from './x'
import { bluesky } from './bluesky'
import { youtube } from './youtube'
import { note } from './note'
import { niconico } from './niconico'
import { threads } from './threads'
import { instagram } from './instagram'
import { tiktok } from './tiktok'
import { facebook } from './facebook'
import { reddit } from './reddit'
import { pixiv } from './pixiv'
import { misskey } from './misskey'

export const PLATFORMS: PlatformDef[] = [
  x,
  bluesky,
  youtube,
  note,
  niconico,
  threads,
  instagram,
  tiktok,
  facebook,
  reddit,
  pixiv,
  misskey,
]
