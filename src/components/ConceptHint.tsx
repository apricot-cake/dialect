import { PLATFORMS } from '@/core/platforms'
import type { ConceptId } from '@/core/types'
import { t } from '@/i18n'

/**
 * 制限のあるSNSだけを短文で知らせる。全SNSで使える条件には何も表示しない。
 * 非対応が多数派の条件は「◯◯で使えます」の肯定形に切り替える。
 * 制限の詳しい内容は起動パネル側で条件ごとに表示される。
 */
export function ConceptHint({ concept }: { concept: ConceptId }) {
  const unsupported = PLATFORMS.filter(
    (p) => p.support[concept].level === 'none',
  ).map((p) => p.name)
  const limited = PLATFORMS.filter(
    (p) => p.support[concept].level === 'partial',
  ).map((p) => p.name)
  const full = PLATFORMS.filter(
    (p) => p.support[concept].level === 'full',
  ).map((p) => p.name)

  if (unsupported.length === 0 && limited.length === 0) return null

  let text: string
  if (unsupported.length > full.length + limited.length) {
    const usable = [...full, ...limited]
    text = `${usable.join('・')}${t('hint.only.suffix')}`
    if (limited.length > 0) {
      text += `(${limited.join('・')}${t('hint.only.partial')})`
    }
  } else {
    const parts: string[] = []
    if (unsupported.length > 0) {
      parts.push(`${unsupported.join('・')}${t('hint.unsupported')}`)
    }
    if (limited.length > 0) {
      parts.push(`${limited.join('・')}${t('hint.limited')}`)
    }
    text = parts.join('。')
  }

  return <p className="text-xs text-muted-foreground">{text}</p>
}
