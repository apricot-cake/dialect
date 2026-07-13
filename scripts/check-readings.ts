/**
 * 読み辞書(readings.generated.ts)がコードとズレていないかを、kuromoji もネットワークも
 * 使わず静的に検査する CLI。フィールド(同義語・ラベル・値)を足したのに読みの再生成を
 * 忘れる、という追加漏れをマージ前に落とす(柱A=対応表⇄生成物の自動同期の読み版)。
 *
 * 何をするか: 「漢字を含む対象語」の集合と READINGS のキー集合を突き合わせ、
 *   - 未生成(対象語なのに READINGS に無い) → 追加漏れ
 *   - 不要(コードから消えたのに READINGS に残っている) → 消し忘れ
 * のどちらかがあれば落とす。読みの中身の正しさ(取り違え)は gen 時の人手目視の担当で、
 * ここはキーの網羅だけを見る(だから kuromoji 不要=決定論的で CI に載せられる)。
 *
 * 実行: npm run check:readings
 */
import { READINGS } from '@apricot-cake/dialect-core'
import { collectReadingPhrases } from './readingCorpus'

const required = collectReadingPhrases()
const have = new Set(Object.keys(READINGS))
const need = new Set(required)

const missing = required.filter((p) => !have.has(p))
const stale = [...have].filter((p) => !need.has(p))

if (missing.length || stale.length) {
  console.error('🟥 読み辞書がコードとズレています。`npm run gen:readings` で再生成してください。')
  if (missing.length) {
    console.error(`\n未生成(READINGS に無い) ${missing.length} 語:`)
    for (const p of missing) console.error(`  ${p}`)
  }
  if (stale.length) {
    console.error(`\n不要(コードに無いのに READINGS に残っている) ${stale.length} 語:`)
    for (const p of stale) console.error(`  ${p}`)
  }
  process.exit(1)
}

console.log(`読み辞書OK: 対象 ${required.length} 語すべてが READINGS に存在`)
