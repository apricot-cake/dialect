import type { ConceptId, ConceptSupport, ParsedSearch, PlatformDef, QueryState, UrlPart } from '../types'
import { limitSort } from '../types'
import { andTerms, stripAt, stripHash, words } from '../text'
import { encodeTokens, lit, part, tok, type Token } from '../urlParts'
import { hostIs, leftoverParams, pathSegments, tokenize } from '../parse'

// 出典: docs/operator-research.md
// 演算子は from:@noteID のみ(公式機能)。除外・完全一致・期間は非対応。
// ハッシュタグ単独ならタグページ(厳密一致)、他条件と併用時はキーワードとして検索。
// new=新着、top=人気(既定)、hot=急上昇。指定なし(auto)は何も送らない。全て実測で動作
const SORT_PARAM: Partial<Record<QueryState['sort'], string>> = {
  new: 'new',
  top: 'popular',
  hot: 'hot',
}

/**
 * 単一タグのみ(ことば・送信者なし)のとき /hashtag/{タグ} のタグページへ行くか。
 * タグページには並び順・有料などの検索フィルタが無いので、その概念を落とす判定に使う
 */
function isTagPath(state: QueryState): boolean {
  const textCount = andTerms(state).length
  const tagNames = words(state.hashtag).map(stripHash)
  return tagNames.length === 1 && !stripAt(state.fromUser) && textCount === 0
}

// 検索結果タブ「記事/マガジン/クリエイター/メンバーシップ」のうち、クリエイター(探す=プロフィール)・
// マガジン(探す=シリーズ。記事をまとめた企画という点でniconicoのシリーズと同種)は
// context=user/magazine への切り替えで実現できる(2026-07-09 GUI操作で確認)。どちらも記事本文の
// 検索とは別対象で、並び順チップ・from:演算子・タグページ分岐を持たない(GUI操作で確認)。
// メンバーシップ(有料コミュニティ、探す=メンバーシップ)は context=circle で実現できる
// (2026-07-09 GUI操作で確認)。クリエイター・マガジンと異なり並び順チップは「人気(既定)/新着」の
// 2値だけ持つ(急上昇は無い)。from:演算子は0件になり効かない(fromUserは他2タブ同様none)。
// 有料のみは全件がそもそも有料のため意味を持たない(paidOnlyはnone)
const NOTE_RESULT_TYPE_CONTEXT: Partial<Record<QueryState['resultType'], string>> = {
  people: 'user',
  series: 'magazine',
  circle: 'circle',
}

// メンバーシップ検索の並び順は人気(popular)・新着(new)の2値のみ(2026-07-09 GUI採取、SORT_PARAMの
// 部分集合)。急上昇(hot)を選んでいてもここでは送らない(未確認のため落とす)
const CIRCLE_SORT_VALUES: ReadonlySet<QueryState['sort']> = new Set(['new', 'top'])

function buildParts(state: QueryState): UrlPart[] | null {
  const handle = stripAt(state.fromUser)
  // 完全一致・引用符は効かない(実測で非対応)ため送らない
  const textToks: Token[] = andTerms(state).map((t) => tok(t, 'keywords'))
  const tagNames = words(state.hashtag).map(stripHash)
  const tagToks = tagNames.map((t) => tok(t, 'hashtag'))

  const altContext = NOTE_RESULT_TYPE_CONTEXT[state.resultType]
  if (altContext) {
    const toks = [...textToks, ...tagToks]
    if (toks.length === 0) return null
    // クリエイター・マガジン・メンバーシップへの context 切替は「探すもの」の指定が生む断片
    const parts: UrlPart[] = [
      lit('https://note.com/search?context='),
      part(altContext, 'resultType'),
      lit('&q='),
      ...encodeTokens(toks),
    ]
    if (state.resultType === 'circle' && CIRCLE_SORT_VALUES.has(state.sort)) {
      parts.push(part(`&sort=${SORT_PARAM[state.sort]}`, 'sortOrder'))
    }
    return parts
  }

  if (isTagPath(state)) {
    return [lit('https://note.com/hashtag/'), part(encodeURIComponent(tagNames[0]), 'hashtag')]
  }

  const toks = [...textToks, ...tagToks]
  if (handle) toks.push(tok(`from:@${handle}`, 'fromUser'))
  if (toks.length === 0) return null

  const sortVal = SORT_PARAM[state.sort]
  // 有料のみ(paidOnly)は context を note_for_sale に切り替えて表現(2026-07-09 GUI採取)。
  // 指定なしの context=note は常に送る既定値なので無帰属
  const parts: UrlPart[] = [
    lit('https://note.com/search?context='),
    state.paidOnly ? part('note_for_sale', 'paidOnly') : lit('note'),
    lit('&q='),
    ...encodeTokens(toks),
  ]
  if (sortVal) parts.push(part(`&sort=${sortVal}`, 'sortOrder'))
  return parts
}

// note が対応する値のみ(他サイト専用の値はここに含めない)
const NOTE_RESULT_TYPES: ReadonlySet<QueryState['resultType']> = new Set([
  '', 'people', 'series', 'circle',
])

// クリエイター・マガジン・メンバーシップ検索では効かない演算子(2026-07-09 GUI操作で確認:
// from:演算子はいずれのタブでも存在しない)
const NOTE_RESULT_TYPE_CONFLICT: ConceptSupport = {
  level: 'none',
  noteKey: 'note.note.resultTypeConflict',
}

// メンバーシップは全件がそもそも有料のため、有料のみフィルタは意味を持たない
const NOTE_CIRCLE_PAID_ONLY: ConceptSupport = {
  level: 'none',
  noteKey: 'note.note.paidOnly.circle',
}

function dynamicSupport(state: QueryState): Partial<Record<ConceptId, ConceptSupport>> {
  const resultTypeOverride: Partial<Record<ConceptId, ConceptSupport>> =
    state.resultType && !NOTE_RESULT_TYPES.has(state.resultType)
      ? { resultType: { level: 'none', noteKey: 'note.resultType.otherSite' } }
      : {}
  if (state.resultType === 'people' || state.resultType === 'series') {
    return {
      ...resultTypeOverride,
      fromUser: NOTE_RESULT_TYPE_CONFLICT,
      sortOrder: NOTE_RESULT_TYPE_CONFLICT,
      paidOnly: NOTE_RESULT_TYPE_CONFLICT,
    }
  }
  if (state.resultType === 'circle') {
    return {
      ...resultTypeOverride,
      fromUser: NOTE_RESULT_TYPE_CONFLICT,
      paidOnly: NOTE_CIRCLE_PAID_ONLY,
      // メンバーシップ検索の並び順は人気(popular)・新着(new)の2値のみ(急上昇は無い)
      ...limitSort(state.sort, ['new', 'top'], 'note.sortOrder.otherSite'),
    }
  }
  return {
    ...resultTypeOverride,
    // note に無い並び順(コメント数順など)を選んだとき「適用」に見せない
    ...limitSort(state.sort, ['new', 'top', 'hot'], 'note.sortOrder.otherSite'),
    // 単一タグのタグページには有料フィルタが無い。そのときは paidOnly を落とす
    ...(state.paidOnly && isTagPath(state)
      ? { paidOnly: { level: 'none', noteKey: 'note.note.paidOnly.tagPage' } }
      : {}),
    // タグページには並び順も無い(sort= を送れない)ので、指定されていたら落とす
    // (check:parts が検出した食い違い)
    ...(state.sort !== 'auto' && isTagPath(state)
      ? { sortOrder: { level: 'none', noteKey: 'note.note.sort.tagPage' } }
      : {}),
  }
}

// 逆翻訳: note.com/search?context=…&q=…&sort=… と /hashtag/{tag}。
// context: note=記事(既定)、note_for_sale=有料のみ、user/magazine/circle=探すものの切替
function parseUrl(url: URL): ParsedSearch | null {
  if (!hostIs(url, 'note.com')) return null
  const segs = pathSegments(url)
  const patch: Partial<QueryState> = {}
  const ignored: string[] = []

  if (segs[0] === 'hashtag' && segs[1]) {
    patch.hashtag = segs[1]
    leftoverParams(url, new Set(), ignored)
    return { patch, ignored }
  }
  if (segs[0] !== 'search') return null
  const q = url.searchParams.get('q')
  if (!q) return null

  const context = url.searchParams.get('context')
  if (context === 'note_for_sale') patch.paidOnly = true
  else if (context === 'user') patch.resultType = 'people'
  else if (context === 'magazine') patch.resultType = 'series'
  else if (context === 'circle') patch.resultType = 'circle'
  else if (context !== null && context !== 'note') ignored.push(`context=${context}`)

  const sort = url.searchParams.get('sort')
  if (sort === 'new') patch.sort = 'new'
  else if (sort === 'popular') patch.sort = 'top'
  else if (sort === 'hot') patch.sort = 'hot'
  else if (sort !== null) ignored.push(`sort=${sort}`)

  const terms: string[] = []
  for (const token of tokenize(q)) {
    if (token.startsWith('from:')) patch.fromUser = stripAt(token.slice('from:'.length))
    else terms.push(token)
  }
  if (terms.length > 0) patch.terms = terms

  leftoverParams(url, new Set(['q', 'context', 'sort']), ignored)
  return { patch, ignored }
}

export const note: PlatformDef = {
  id: 'note',
  name: 'note',
  group: 'text',
  brandColor: '#13b5b1',
  requiresLogin: false,
  googleSite: 'note.com',
  support: {
    keywords: { level: 'partial', noteKey: 'note.note.keywords' },
    exactPhrase: { level: 'none', noteKey: 'note.exactPhrase.dropped' },
    exclude: { level: 'none', noteKey: 'note.note.exclude' },
    fromUser: { level: 'full', noteKey: 'note.note.fromUser' },
    hashtag: { level: 'full', noteKey: 'note.note.hashtag' },
    period: { level: 'none', noteKey: 'note.note.period' },
    mediaOnly: { level: 'none', noteKey: 'note.note.mediaOnly' },
    resultType: { level: 'full' },
    sortOrder: { level: 'full' },
    paidOnly: { level: 'full' },
  },
  buildParts,
  parseUrl,
  dynamicSupport,
}
