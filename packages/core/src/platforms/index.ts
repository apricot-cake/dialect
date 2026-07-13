import type { PlatformDef } from '../types.js'
import { x } from './x.js'
import { bluesky } from './bluesky.js'
import { youtube } from './youtube.js'
import { niconico } from './niconico.js'
import { seiga } from './seiga.js'
import { instagram } from './instagram.js'
import { pixiv } from './pixiv.js'
import { misskey } from './misskey.js'
import { tumblr } from './tumblr.js'
import { mastodon } from './mastodon.js'
import { fanbox } from './fanbox.js'
import { bilibili } from './bilibili.js'
import { fantia } from './fantia.js'
import { google } from './google.js'

// 並び順はグループ順(SNS→動画→イラスト・画像→Web検索)に揃える。
// この配列順が、起動画面のカード・条件追加モーダルのフィルタ・対応ポップの
// バッジ並びすべての元になるので、一箇所直せば全画面で一致する。
// (起動画面はさらにグループ見出しで区切るが、各グループ内の順は同じ)
export const PLATFORMS: PlatformDef[] = [
  // SNS
  x,
  bluesky,
  instagram,
  misskey,
  tumblr,
  mastodon,
  // 動画
  youtube,
  niconico,
  bilibili,
  // イラスト・画像
  pixiv,
  seiga,
  fanbox,
  fantia,
  // Web検索
  google,
]
