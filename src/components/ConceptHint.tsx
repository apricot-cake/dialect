import { PLATFORMS } from '@/core/platforms'
import type { ConceptId } from '@/core/types'
import { t } from '@/i18n'

/**
 * 制限のあるSNSだけを短文で知らせる。全SNSで使える条件には何も表示しない。
 * 制限の詳しい内容は起動パネル側で条件ごとに表示される。
 */
export function ConceptHint({ concept }: { concept: ConceptId }) {
  const unsupported = PLATFORMS.filter(
    (p) => p.support[concept].level === 'none',
  ).map((p) => p.name)
  const limited = PLATFORMS.filter(
    (p) => p.support[concept].level === 'partial',
  ).map((p) => p.name)

  if (unsupported.length === 0 && limited.length === 0) return null

  const parts: string[] = []
  if (unsupported.length > 0) {
    parts.push(`${unsupported.join('・')}${t('hint.unsupported')}`)
  }
  if (limited.length > 0) {
    parts.push(`${limited.join('・')}${t('hint.limited')}`)
  }

  return <p className="text-xs text-muted-foreground">{parts.join('。')}</p>
}
