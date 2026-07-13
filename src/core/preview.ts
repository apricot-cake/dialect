import type { ConceptId, PlatformDef, QueryState, Resolution } from './types'
import {
  CONCEPT_DEFS,
  CONCEPT_MAP,
  SELECT_OPTIONS,
  SORT_OPTIONS,
  supportersOf,
} from './conceptDefs'
import { t, tf } from '@/i18n'
import { activeConcepts } from './concepts'
import { andTerms, exactPhrases, words } from './text'

/** セレクト式の条件で、いま選ばれている値の表示ラベルを引く */
function selectLabel(concept: ConceptId, value: string): string {
  const opt = SELECT_OPTIONS[concept]?.find((o) => o.value === value)
  return opt ? t(opt.labelKey) : ''
}

/**
 * 1つの条件を、起動カードのプレビュー用に「読みやすい日本語ラベル」へ畳む。
 * 生のクエリ文字列(min_faves: や NOT(...) やパスの tags/ 等)は見せず、意味だけを短く伝える。
 * 値を持つ条件は値込みで(例: 「宣伝を除く」「100いいね以上」)、トグル/セレクトは既存ラベルを再利用する。
 */
export function conceptSummary(concept: ConceptId, state: QueryState): string {
  switch (concept) {
    case 'keywords':
      return andTerms(state).join(' ')
    case 'exactPhrase':
      return exactPhrases(state)
        .map((p) => `「${p}」`)
        .join(' ')
    case 'keywordsOr':
      return tf('sum.anyOf', { v: words(state.keywordsOr).join('・') })
    case 'exclude':
      return tf('sum.exclude', { v: words(state.exclude).join('・') })
    case 'fromUser':
      return tf('sum.from', { v: `@${state.fromUser.trim()}` })
    case 'excludeUser':
      return tf('sum.excludeUser', {
        v: words(state.excludeUser)
          .map((u) => `@${u}`)
          .join('・'),
      })
    case 'toUser':
      return tf('sum.to', {
        v: words(state.toUser)
          .map((u) => `@${u}`)
          .join('・'),
      })
    case 'mentionsUser':
      return tf('sum.mentions', { v: `@${state.mentionsUser.trim()}` })
    case 'excludeMentions':
      return tf('sum.exclude', {
        v: words(state.excludeMentions)
          .map((u) => `@${u}`)
          .join('・'),
      })
    case 'domain':
      return tf('sum.domain', { v: state.domain.trim() })
    case 'excludeDomain':
      return tf('sum.exclude', { v: words(state.excludeDomain).join('・') })
    case 'linkUrl':
      return tf('sum.domain', { v: state.linkUrl.trim() })
    case 'excludeLinkUrl':
      return tf('sum.exclude', { v: state.excludeLinkUrl.trim() })
    case 'xList':
      return t('sum.xList')
    case 'hashtag':
      return words(state.hashtag)
        .map((w) => `#${w}`)
        .join(' ')
    case 'hashtagOr':
      return tf('sum.anyOf', {
        v: words(state.hashtagOr)
          .map((w) => `#${w}`)
          .join('・'),
      })
    case 'excludeHashtag':
      return tf('sum.exclude', {
        v: words(state.excludeHashtag)
          .map((w) => `#${w}`)
          .join('・'),
      })
    case 'period':
      if (state.since && state.until) return tf('sum.between', { a: state.since, b: state.until })
      if (state.since) return tf('sum.since', { v: state.since })
      if (state.until) return tf('sum.until', { v: state.until })
      return ''
    case 'minLikes':
      return tf('sum.minLikes', { v: state.minLikes.trim() })
    case 'minReposts':
      return tf('sum.minReposts', { v: state.minReposts.trim() })
    case 'minReplies':
      return tf('sum.minReplies', { v: state.minReplies.trim() })
    case 'videoLength':
      return selectLabel('videoLength', state.videoLength)
    case 'workType':
      return selectLabel('workType', state.workType)
    case 'genre':
      return selectLabel('genre', state.genre)
    case 'resultType':
      return selectLabel('resultType', state.resultType)
    case 'language':
      return selectLabel('language', state.language)
    case 'ageRating':
      return selectLabel('ageRating', state.ageRating)
    case 'pixivPopular':
      return selectLabel('pixivPopular', state.pixivPopular)
    case 'sortOrder': {
      const opt = SORT_OPTIONS.find((o) => o.value === state.sort)
      return opt ? t(opt.labelKey) : ''
    }
    // トグル系は概念ラベルをそのまま(「リプライを除く」「ライブ配信だけ」など)
    default:
      return t(CONCEPT_MAP[concept].labelKey)
  }
}

/**
 * いま指定されている条件をまとめた短い要約。保存した検索の初期名などに使う。
 * サイト非依存で、条件バーと同じ CONCEPT_DEFS 順に「・」で連ねる(キーワードが先頭)。
 */
export function searchSummary(state: QueryState): string {
  const active = new Set(activeConcepts(state))
  const parts: string[] = []
  for (const def of CONCEPT_DEFS) {
    if (!active.has(def.id)) continue
    const s = conceptSummary(def.id, state)
    if (s) parts.push(s)
  }
  return parts.join('・')
}

/**
 * 起動カードの翻訳プレビュー。そのサイトで実際に効く条件(applied＋近似)だけを、
 * 読みやすいラベル(+由来の概念)の配列にして返す。落ちる条件(dropped)は含めない
 * ——「各サイトで効く条件の違い」がそのまま見え、打ち消し線の羅列にもならない。
 * 並びは条件バーと同じ CONCEPT_DEFS 順。1要素=1条件で、表示側は要素の途中で改行させず
 * 区切りでだけ折り返す(「初音ミ／ク」のような中途改行を避ける)。
 * concept は生URL(UrlPart)との同色対応に使う
 */
export interface TranslationPart {
  concept: ConceptId
  label: string
}

export function translationParts(resolution: Resolution, state: QueryState): TranslationPart[] {
  const effective = new Set<ConceptId>([
    ...resolution.applied,
    ...resolution.approximated.map((a) => a.concept),
  ])
  const parts: TranslationPart[] = []
  for (const def of CONCEPT_DEFS) {
    if (!effective.has(def.id)) continue
    const s = conceptSummary(def.id, state)
    if (s) parts.push({ concept: def.id, label: s })
  }
  return parts
}

/**
 * その概念が単一サイト専用なら、その持ち主サイトを返す(そうでなければ null)。
 * 他サイトのカードで「pixiv専用」等の静かな表示に使い、他サイトの完全度を下げないためにも使う。
 */
export function specialtyOwner(concept: ConceptId): PlatformDef | null {
  const supporters = supportersOf(concept)
  return supporters.length === 1 ? supporters[0] : null
}
