/**
 * 読み辞書(readings.generated.ts)の対象になる日本語テキストの収集ロジック。
 * 生成(gen-readings)と検査(check-readings)で同じ集合を使うため、ここに一本化する。
 */
import {
  ja,
  CONCEPT_DEFS,
  SELECT_OPTIONS,
  SORT_OPTIONS,
  TAG_DEFS,
} from '@apricot-cake/dialect-core'

/** CJK統合漢字＋々 を含むか(純かな・英字語は正規化側で吸収済みなので読み生成は不要) */
export function hasKanji(s: string): boolean {
  return /[一-龯々]/.test(s)
}

/** 読み辞書の対象(漢字を含む同義語・ラベル・選択肢の値)を重複なく集める */
export function collectReadingPhrases(): string[] {
  const set = new Set<string>()
  for (const def of Object.values(TAG_DEFS)) for (const t of def.synonyms.ja) set.add(t)
  for (const def of CONCEPT_DEFS) set.add(ja[def.labelKey])
  for (const opt of SORT_OPTIONS) set.add(ja[opt.labelKey])
  for (const opts of Object.values(SELECT_OPTIONS))
    for (const opt of opts) set.add(ja[opt.labelKey])
  return [...set].filter(hasKanji)
}
