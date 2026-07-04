import type { PlatformDef } from '../types'
import { x } from './x'
import { bluesky } from './bluesky'
import { youtube } from './youtube'
import { note } from './note'
import { niconico } from './niconico'
import { instagram } from './instagram'
import { reddit } from './reddit'
import { pixiv } from './pixiv'
import { misskey } from './misskey'
import { hatebu } from './hatebu'
import { twitch } from './twitch'
import { fivech } from './fivech'
import { animanch } from './animanch'

// 並び順はグループ順(SNS→動画→イラスト・画像→ブログ・掲示板)に揃える。
// この配列順が、起動画面のカード・条件追加モーダルのフィルタ・対応ポップの
// バッジ並びすべての元になるので、一箇所直せば全画面で一致する。
// (起動画面はさらにグループ見出しで区切るが、各グループ内の順は同じ)
export const PLATFORMS: PlatformDef[] = [
  // SNS
  x,
  bluesky,
  instagram,
  misskey,
  // 動画
  youtube,
  niconico,
  twitch,
  // イラスト・画像
  pixiv,
  // ブログ・掲示板
  note,
  reddit,
  hatebu,
  fivech,
  animanch,
]
