import type { SiteGuideRegistry } from './types'
import { x } from './x'
import { pixiv } from './pixiv'
import { youtube } from './youtube'

/**
 * 手書き解説の登録簿(#45)。ガイドが無いサイトは自動生成部(対応条件の一覧表)のみで
 * ページが成立する(段階方式)。主要サイトから順次追加していく。
 */
export const SITE_GUIDES: SiteGuideRegistry = {
  x,
  pixiv,
  youtube,
}
