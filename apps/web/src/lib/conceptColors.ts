import type { ConceptId } from '@apricot-cake/dialect-core'

/**
 * 概念→識別色のパレット。翻訳プレビューの「条件⇄URL部分の同色対応」に使う。
 * ブランド色とは無関係の識別用で、色相を黄金角(137.5°)で離して概念の数だけ生成する。
 * 同じ検索条件なら全カードで同じ概念が同じ色になるよう、呼び出し側は
 * サイト非依存の集合(activeConcepts)を渡す。明度・彩度はテーマ別に固定
 * (ライト=濃いめの文字色として読める明度、ダーク=明るめ)
 */
export function conceptColors(concepts: ConceptId[], dark: boolean): Map<ConceptId, string> {
  const map = new Map<ConceptId, string>()
  concepts.forEach((c, i) => {
    const hue = Math.round((i * 137.508 + 25) % 360)
    map.set(c, dark ? `oklch(0.78 0.13 ${hue})` : `oklch(0.52 0.15 ${hue})`)
  })
  return map
}
