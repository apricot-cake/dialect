import type { MessageKey } from '@/i18n'
import type { QueryState } from './types'

// 用途別テンプレート。ことば(keywords)等のユーザー入力は残したまま、
// その用途でよく使う条件だけを上書きする。
export interface TemplateDef {
  id: string
  labelKey: MessageKey
  patch: Partial<QueryState>
  /** 適用時に「◯日前」を since にセットする(0=今日) */
  sinceDaysAgo?: number
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: 'reputation',
    labelKey: 'template.reputation',
    patch: {
      exclude: '広告 PR キャンペーン プレゼント',
      japaneseOnly: true,
      newestFirst: true,
    },
  },
  {
    id: 'live',
    labelKey: 'template.live',
    patch: { until: '', newestFirst: true },
    sinceDaysAgo: 0,
  },
  {
    id: 'media',
    labelKey: 'template.media',
    patch: { mediaOnly: true, newestFirst: true },
  },
]

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export function applyTemplate(
  state: QueryState,
  template: TemplateDef,
): QueryState {
  const next = { ...state, ...template.patch }
  if (template.sinceDaysAgo !== undefined) {
    next.since = isoDaysAgo(template.sinceDaysAgo)
  }
  return next
}
