import type { ConceptId, ConceptSupport, ParsedSearch, PlatformDef, QueryState, UrlPart } from '../types'
import { limitSort } from '../types'
import { andTerms, exactPhrases, stripHash, words } from '../text'
import { formEncode, lit, minusExcludeTokens, ParamParts, part, quotedTermTokens, tok } from '../urlParts'
import { applyBins, emptyBins, hostIs, isIsoDate, leftoverParams, pathSegments, tokenize, unquote } from '../parse'

// 出典: docs/operator-research.md(2026-07-03調査、実測)
// 検索対象はパスで分ける: /search/text(本文)・/search/title(タイトル)・/search/tag(タグ)。
// AND(スペース)・除外(-)・期間(date_begin/date_end)・並び順(sort=)・
// 最低ブックマーク数(users=)が全てURLで効く。ログイン不要。
// 引用符のフレーズ一致は絞り込み効果を実測したが公式ヘルプに記載なし(中信頼)。
// 注意: 期間を指定しないと、はてブ側の標準で「直近5年・3users以上」に絞られる。
//
// セーフサーチ(safe=on/off、既定on)は2026-07-09にログイン済みGUI操作で発見(サイドバーの
// 「セーフサーチ」オン/オフリンク)。WebFetch(Cookie無し)でも同じサイドバーが出ることを
// 確認済みで、未ログインでも既定・挙動は同じ
//
// ユーザー指定検索(fromUser)は2026-07-09にログイン済みで再検証: `/{username}/search?q=`という
// パスは存在するが、**自分自身のアカウント以外は403 Forbidden**(ブックマーク一覧自体は
// 公開・閲覧できる他ユーザーで確認)。未ログインだとログインページへリダイレクト(WebFetch確認)。
// つまり「ログインすれば他人のブックマークを検索できる」わけではなく、この検索は
// 常に「自分自身のブックマークの中だけ」を対象にした個人用機能であり、Dialectの
// fromUser(指定した任意ユーザーの投稿を探す)とは性質が異なるため引き続き非対応(none)
function buildParts(state: QueryState): UrlPart[] | null {
  const textToks = quotedTermTokens(state)
  const tagToks = words(state.hashtag).map((t) => tok(stripHash(t), 'hashtag'))
  const excludeToks = minusExcludeTokens(state)

  // タグ単独ならタグ検索(タグの完全一致でAND)。キーワード併用時は本文検索へ畳み込む
  const tagOnly = tagToks.length > 0 && textToks.length === 0
  const toks = tagOnly ? [...tagToks, ...excludeToks] : [...textToks, ...tagToks, ...excludeToks]
  if (textToks.length === 0 && tagToks.length === 0) return null

  // q は語・タグ・除外が1つの値に合成されるため、URLSearchParams と同一の
  // form エンコードで語ごとに符号化する(語の区切りのスペースは + になる)
  const qParts: UrlPart[] = []
  toks.forEach((t, i) => {
    if (i > 0) qParts.push(lit(formEncode(' ')))
    qParts.push(part(formEncode(t.text), ...t.concepts))
  })

  const params = new ParamParts()
  // sort=recent=新着、popular=人気(サイト既定)。指定なしは何も送らない
  if (state.sort === 'new') params.set('sort', 'recent', 'sortOrder')
  else if (state.sort === 'top') params.set('sort', 'popular', 'sortOrder')
  if (state.since) params.set('date_begin', state.since, 'period')
  if (state.until) params.set('date_end', state.until, 'period')
  if (state.minLikes.trim()) params.set('users', state.minLikes.trim(), 'minLikes')
  // セーフサーチ(既定=on)を解除。未ログインでも既定は同じ(2026-07-09にWebFetchで確認)
  if (state.safeSearchOff) params.set('safe', 'off', 'safeSearchOff')

  return [
    lit('https://b.hatena.ne.jp/search/'),
    // 検索対象のパス切替はそれを選んだ条件が生む断片(既定の text は無帰属)
    tagOnly ? part('tag', 'hashtag') : state.titleOnly ? part('title', 'titleOnly') : lit('text'),
    lit('?q='),
    ...qParts,
    ...params.parts('&'),
  ]
}

// 逆翻訳: b.hatena.ne.jp/search/{text|title|tag}?q=…。title=タイトルだけ、
// tag=タグ検索(語をタグとして読む)。期間・並び順・ブクマ数・セーフサーチも戻す
function parseUrl(url: URL): ParsedSearch | null {
  if (!hostIs(url, 'b.hatena.ne.jp')) return null
  const segs = pathSegments(url)
  if (segs[0] !== 'search' || !['text', 'title', 'tag'].includes(segs[1])) return null
  const q = url.searchParams.get('q')
  if (!q) return null

  const patch: Partial<QueryState> = {}
  const ignored: string[] = []
  if (segs[1] === 'title') patch.titleOnly = true

  const bins = emptyBins()
  for (const token of tokenize(q)) {
    if (token.startsWith('-') && token.length > 1) bins.excludes.push(token.slice(1))
    else if (token.startsWith('"')) bins.phrases.push(unquote(token))
    else if (segs[1] === 'tag') bins.hashtags.push(token)
    else bins.terms.push(token)
  }
  applyBins(patch, bins)

  const sort = url.searchParams.get('sort')
  if (sort === 'recent') patch.sort = 'new'
  else if (sort === 'popular') patch.sort = 'top'
  else if (sort !== null) ignored.push(`sort=${sort}`)
  const begin = url.searchParams.get('date_begin')
  if (begin !== null) {
    if (isIsoDate(begin)) patch.since = begin
    else ignored.push(`date_begin=${begin}`)
  }
  const end = url.searchParams.get('date_end')
  if (end !== null) {
    if (isIsoDate(end)) patch.until = end
    else ignored.push(`date_end=${end}`)
  }
  const users = url.searchParams.get('users')
  if (users !== null) {
    if (/^\d+$/.test(users)) patch.minLikes = users
    else ignored.push(`users=${users}`)
  }
  const safe = url.searchParams.get('safe')
  if (safe === 'off') patch.safeSearchOff = true
  else if (safe !== null && safe !== 'on') ignored.push(`safe=${safe}`)

  leftoverParams(url, new Set(['q', 'sort', 'date_begin', 'date_end', 'users', 'safe']), ignored)
  return { patch, ignored }
}

// ハッシュタグ単独のときはタグ検索パスになり、「タイトルだけ」は参照されず効かない
function dynamicSupport(
  state: QueryState,
): Partial<Record<ConceptId, ConceptSupport>> {
  const tagOnly =
    words(state.hashtag).length > 0 &&
    andTerms(state).length === 0 &&
    exactPhrases(state).length === 0
  const overrides: Partial<Record<ConceptId, ConceptSupport>> =
    tagOnly && state.titleOnly
      ? { titleOnly: { level: 'none', noteKey: 'note.hatebu.titleTagConflict' } }
      : {}
  // 急上昇(note専用)などはてブにない並び順は落とす
  return { ...overrides, ...limitSort(state.sort, ['new', 'top'], 'note.sortOrder.otherSite') }
}

export const hatebu: PlatformDef = {
  id: 'hatebu',
  name: 'はてなブックマーク',
  group: 'text',
  brandColor: '#00A4DE',
  requiresLogin: false,
  support: {
    keywords: { level: 'full' },
    exactPhrase: { level: 'partial', noteKey: 'note.exact.unreliable' },
    exclude: { level: 'full' },
    titleOnly: { level: 'full' },
    fromUser: { level: 'none', noteKey: 'note.hatebu.fromUser' },
    hashtag: { level: 'full', noteKey: 'note.tagPage.combined' },
    period: { level: 'full' },
    minLikes: { level: 'partial', noteKey: 'note.hatebu.minLikes' },
    sortOrder: { level: 'full' },
    safeSearchOff: { level: 'full' },
  },
  buildParts,
  parseUrl,
  dynamicSupport,
}
