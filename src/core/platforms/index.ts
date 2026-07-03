import type { PlatformDef } from '../types'
import { x } from './x'
import { bluesky } from './bluesky'
import { mastodon } from './mastodon'
import { youtube } from './youtube'
import { note } from './note'
import { niconico } from './niconico'
import { threads } from './threads'
import { instagram } from './instagram'
import { tiktok } from './tiktok'
import { reddit } from './reddit'
import { pixiv } from './pixiv'
import { misskey } from './misskey'
import { hatebu } from './hatebu'
import { twitch } from './twitch'
import { fivech } from './fivech'
import { animanch } from './animanch'
import { seiga } from './seiga'

export const PLATFORMS: PlatformDef[] = [
  x,
  bluesky,
  youtube,
  note,
  niconico,
  threads,
  instagram,
  tiktok,
  reddit,
  pixiv,
  misskey,
  mastodon,
  hatebu,
  twitch,
  fivech,
  animanch,
  seiga,
]
