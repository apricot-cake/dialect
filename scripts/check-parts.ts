/**
 * UrlPart 帰属(どのURL断片がどの概念由来か)の整合を機械検査する CLI チェック。
 *
 * なぜ要るか:
 *   buildParts は URL を UrlPart[](断片+概念への帰属)で組み立て、UIはそれを
 *   「条件⇄URL部分の同色対応」として表示する。帰属がズレると、ハイライトが
 *   嘘を教える(効いていない条件に色が付く/効いている条件に色が付かない)。
 *   演算子を足すとき帰属を書き忘れても型エラーにはならないので、CIで止める。
 *
 * 何をするか(網羅サンプル=全概念の単発指定+その全ペア合成、を全サイトに通す):
 *   1. 過剰帰属: parts に現れる概念はすべて applied ∪ approximated に含まれること。
 *      (dropped/未指定の概念に色が付く=「効いていないのに効いて見える」嘘を止める)
 *   2. 取りこぼし: applied ∪ approximated の各概念が最低1つのパーツに帰属していること。
 *      (「効いているのにURL上のどこか分からない」を止める。URLを変えない固定挙動で
 *       意図が満たされる例外は COVERAGE_EXEMPT に理由つきで列挙)
 *   3. 結合整合: joinParts(parts) === resolve().url (ヘルパーの壊れ検知)
 *
 * 実行: npm run check:parts   (tsx で直接実行)
 */
import { PLATFORMS } from '@/core/platforms'
import { resolve } from '@/core/resolve'
import { defaultState } from '@/core/concepts'
import { CONCEPT_DEFS, SELECT_OPTIONS, SORT_OPTIONS } from '@/core/conceptDefs'
import { joinParts } from '@/core/urlParts'
import type { ConceptId, PlatformId, QueryState } from '@/core/types'

const BASE: QueryState = { ...defaultState(), terms: ['猫'] }

/**
 * 取りこぼし検査(2)の免除: 「URLに固有の断片を生まないが、サイトの固定挙動や
 * 既定値で意図が満たされる」(サイト×概念×状態)。check-operators の SATISFIED_BY_DEFAULT と
 * 同じ流儀で、①理由を明記 ②濫用しない(迷ったら免除せず buildParts 側で帰属するか
 * dynamicSupport で正直に落とす)。when で「その値のときだけ」に絞る(全状態の免除は避ける)
 */
const COVERAGE_EXEMPT: ReadonlyArray<{
  platform: PlatformId
  concept: ConceptId
  when: (state: QueryState) => boolean
  reason: string
}> = [
  {
    platform: 'fivech',
    concept: 'titleOnly',
    when: () => true,
    reason: 'ff5chは常にスレタイトルだけを検索する(演算子を持たず、既定挙動が意図を満たす)',
  },
  {
    platform: 'pixiv',
    concept: 'sortOrder',
    when: (s) => s.sort === 'new',
    reason: '新着はpixivの既定(order=date_dはscd/ecd併用でエラーになるため明示しない)',
  },
  {
    platform: 'bluesky',
    concept: 'sortOrder',
    when: (s) => s.sort === 'top',
    reason: '人気はBlueskyの既定タブ(Top)なので何も送らない',
  },
  {
    platform: 'tumblr',
    concept: 'sortOrder',
    when: (s) => s.sort === 'top',
    reason: '人気順はTumblr検索の既定なので何も送らない(/recentは新着のみ)',
  },
]

function isExempt(platform: PlatformId, concept: ConceptId, state: QueryState): boolean {
  return COVERAGE_EXEMPT.some(
    (e) => e.platform === platform && e.concept === concept && e.when(state),
  )
}

/** 単発の上書き(=1概念の指定)を列挙する。check-operators の sampleStates と同じ選び方+α */
function singleOverrides(): Array<Partial<QueryState>> {
  const out: Array<Partial<QueryState>> = [{}]
  for (const def of CONCEPT_DEFS) {
    const f = def.field
    if (def.id === 'keywords') continue // BASE が既に terms:['猫']=指定あり
    if (def.id === 'exactPhrase') {
      out.push({ exactPhrase: ['冷蔵庫で富士山'] })
      out.push({ exactPhrase: ['冷蔵庫 富士山', '青い空'] })
      continue
    }
    if (def.widget === 'toggle') out.push({ [f]: true })
    else if (def.widget === 'sort') {
      for (const o of SORT_OPTIONS) out.push({ sort: o.value })
    } else if (def.widget === 'select') {
      for (const o of SELECT_OPTIONS[def.id] ?? []) if (o.value) out.push({ [f]: o.value })
    } else if (def.widget === 'period') {
      out.push({ since: '2026-06-01', until: '2026-06-30' })
      out.push({ since: '2026-06-01' })
      out.push({ until: '2026-06-30' })
    } else {
      const sentinel =
        f === 'domain'
          ? 'nhk.or.jp'
          : f === 'minLikes' || f === 'minReposts' || f === 'minReplies'
            ? '500'
            : f === 'subreddit'
              ? 'japan'
              : f === 'xList'
                ? '1215911364234924032'
                : f === 'hashtag'
                  ? 'ゲーム'
                  : 'nhk'
      out.push({ [f]: sentinel })
      // 複数値の枠はスペース区切りの2値も(OR括弧・複数タグ等の別経路を踏む)
      if (f === 'hashtag') out.push({ hashtag: 'ゲーム 実況' })
      if (f === 'keywordsOr') out.push({ keywordsOr: 'nhk asahi' })
      if (f === 'toUser') out.push({ toUser: 'nhk asahi' })
      if (f === 'mentionsUser') out.push({ mentionsUser: 'nhk asahi' })
      if (f === 'subreddit') out.push({ subreddit: 'japan tokyo' })
      if (f === 'excludeUser') out.push({ excludeUser: 'nhk asahi' })
      if (f === 'exclude') out.push({ exclude: '犬 うさぎ' })
      if (f === 'hashtagOr') out.push({ hashtagOr: 'cat dog' })
      if (f === 'excludeHashtag') out.push({ excludeHashtag: 'cat dog' })
      if (f === 'excludeMentions') out.push({ excludeMentions: 'nhk asahi' })
      if (f === 'excludeDomain') out.push({ excludeDomain: 'nhk.or.jp example.org' })
    }
  }
  // 特殊形: フレーズ入りキーワード、タグ単独(タグページ分岐)、除外単独、送信者単独
  out.push({ terms: ['初音 ミク'] })
  out.push({ terms: ['猫', '犬'] })
  out.push({ terms: [], hashtag: 'ゲーム' })
  out.push({ terms: [], hashtag: 'ゲーム 実況' })
  out.push({ terms: [], exclude: '犬' })
  out.push({ terms: [], fromUser: 'nhk' })
  return out
}

/** 網羅サンプル: 単発すべて+同一フィールドを触らない全ペア合成(相互作用も踏む) */
function sampleStates(): QueryState[] {
  const singles = singleOverrides()
  const states = new Map<string, QueryState>()
  const add = (over: Partial<QueryState>) => {
    const k = JSON.stringify(over)
    if (!states.has(k)) states.set(k, { ...BASE, ...over })
  }
  for (const s of singles) add(s)
  for (let i = 0; i < singles.length; i++) {
    for (let j = i + 1; j < singles.length; j++) {
      const a = singles[i]
      const b = singles[j]
      if (Object.keys(a).some((k) => k in b)) continue
      add({ ...a, ...b })
    }
  }
  return [...states.values()]
}

interface Fail {
  kind: 'over' | 'missing' | 'join'
  platform: PlatformId
  detail: string
}
const fails: Fail[] = []
/** 同じ (サイト×概念×種別) の失敗は代表1件だけ報告する(サンプルが多く重複しやすい) */
const seenFail = new Set<string>()
function report(kind: Fail['kind'], platform: PlatformId, key: string, detail: string): void {
  const k = `${kind}::${platform}::${key}`
  if (seenFail.has(k)) return
  seenFail.add(k)
  fails.push({ kind, platform, detail })
}

const states = sampleStates()
let checked = 0
for (const state of states) {
  for (const platform of PLATFORMS) {
    let resolution
    try {
      resolution = resolve(platform, state)
    } catch (e) {
      report(
        'join',
        platform.id,
        'throw',
        `resolve が例外: ${String(e)} state=${JSON.stringify(state)}`,
      )
      continue
    }
    const { parts, url } = resolution
    if (!parts) continue
    checked++

    // 3) 結合整合
    if (joinParts(parts) !== url) {
      report('join', platform.id, 'mismatch', `joinParts(parts) !== url: ${url}`)
    }

    const effective = new Set<ConceptId>([
      ...resolution.applied,
      ...resolution.approximated.map((a) => a.concept),
    ])
    const attributed = new Set<ConceptId>()
    for (const p of parts) for (const c of p.concepts) attributed.add(c)

    // 1) 過剰帰属
    for (const c of attributed) {
      if (!effective.has(c)) {
        report(
          'over',
          platform.id,
          c,
          `${c} に帰属したパーツがあるが applied/approximated に無い(dropped または未指定)。url=${url} state=${JSON.stringify(state)}`,
        )
      }
    }

    // 2) 取りこぼし
    for (const c of effective) {
      if (attributed.has(c)) continue
      if (isExempt(platform.id, c, state)) continue
      report(
        'missing',
        platform.id,
        c,
        `${c} は applied/approximated なのに、どのパーツにも帰属していない。url=${url} state=${JSON.stringify(state)}`,
      )
    }
  }
}

console.log(
  `check:parts — サンプル ${states.length} 状態 × ${PLATFORMS.length} サイト(URL生成 ${checked} 件)`,
)
if (COVERAGE_EXEMPT.length > 0) {
  console.log('免除(URL断片を生まないが固定挙動・既定値で意図が満たされる):')
  for (const e of COVERAGE_EXEMPT) console.log(`  ${e.platform}::${e.concept} — ${e.reason}`)
}

if (fails.length === 0) {
  console.log('✅ 帰属の過不足なし・結合整合OK')
} else {
  const over = fails.filter((f) => f.kind === 'over')
  const missing = fails.filter((f) => f.kind === 'missing')
  const join = fails.filter((f) => f.kind === 'join')
  if (over.length) {
    console.log('\n🟥 過剰帰属(効いていない概念に断片が帰属=ハイライトが嘘をつく):')
    for (const f of over) console.log(`  ${f.platform}: ${f.detail}`)
  }
  if (missing.length) {
    console.log('\n🟥 取りこぼし(効いている概念がどの断片にも帰属していない):')
    for (const f of missing) console.log(`  ${f.platform}: ${f.detail}`)
  }
  if (join.length) {
    console.log('\n🟥 結合不整合(joinParts と resolve().url がズレている):')
    for (const f of join) console.log(`  ${f.platform}: ${f.detail}`)
  }
  console.log(`\n合計 ${fails.length} 件`)
  process.exitCode = 1
}
