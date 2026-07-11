import type { PlatformGroup } from '@/core/types'
import type { MessageKey } from '@/i18n'

/** グループ表示順(SNS→動画→イラスト・画像→ブログ・掲示板)。起動画面とまとめて開くパネルで共有 */
export const GROUPS: Array<{ group: PlatformGroup; labelKey: MessageKey }> = [
  { group: 'sns', labelKey: 'group.sns' },
  { group: 'video', labelKey: 'group.video' },
  { group: 'image', labelKey: 'group.image' },
  { group: 'text', labelKey: 'group.text' },
  { group: 'web', labelKey: 'group.web' },
]
