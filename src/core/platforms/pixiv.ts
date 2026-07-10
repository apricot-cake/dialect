import type { ConceptId, ConceptSupport, ParsedSearch, PlatformDef, QueryState, UrlPart } from '../types'
import { limitSort } from '../types'
import { andTerms, exactPhrases, stripHash, words } from '../text'
import { encodeTokens, lit, minusExcludeTokens, ParamParts, part, tok, type Token } from '../urlParts'
import { hostMatches, isIsoDate, leftoverParams, pathSegments, tokenize } from '../parse'

// 出典: docs/operator-research.md(2026-07-03調査)
// 検索は /tags/{クエリ}/artworks(イラスト・マンガ)。作品の種類を指定したときは
// /illustrations(イラスト)・/manga(マンガ)にパスを切り替える。
// デフォルトはタグの部分一致(s_mode=s_tag)。
// OR・除外(-)・括弧グループは公式ヘルプに記載あり。引用符の完全一致はなくキーワード扱い。
// ハッシュタグ=pixivのタグそのものなので、#を外してタグ語として畳み込む。
// 期間(scd=/ecd=)は非公式なURLパラメータ。人気順(order=popular_d)はプレミアム会員のみ有効。
//
// タグ・タイトル・キャプション(s_mode=tag_tc)だけは /tags/{q}/{section} パスでは
// 「不正なリクエスト」エラーになり、/search?q=…&type=… という別エンドポイントが必要
// (2026-07-07にGUI操作で実測)。作品の種類のtype値もこのエンドポイント独自:
// 既定=artwork、manga=manga、novel=novel、illust=illust、ugoira=ugoira
// (/tagsのillustrationsセクション+type=ugoiraサブ絞り込みと違い、5値がそれぞれ独立)
const SEARCH_ENDPOINT_TYPE: Record<'' | 'illust' | 'manga' | 'ugoira' | 'novel', string> = {
  '': 'artwork',
  illust: 'illust',
  manga: 'manga',
  ugoira: 'ugoira',
  novel: 'novel',
}

function buildParts(state: QueryState): UrlPart[] | null {
  // 引用符構文がないため、スペースを含む語もそのまま埋め込む(タグの部分一致)
  const toks: Token[] = andTerms(state).map((t) => tok(t, 'keywords'))
  // 引用符構文は無いが、語句はつながったままタグへの部分一致で効く(スペース入りは語ごとに分かれる)
  toks.push(...exactPhrases(state).map((p) => tok(p, 'exactPhrase')))
  toks.push(...words(state.hashtag).map((t) => tok(stripHash(t), 'hashtag')))
  // 人気の目安=「{N}users入り」タグの部分パターン(例: 000users)を語として足す。
  // 先頭の桁を固定しないので 1000/5000/10000…users入り をまとめて拾える。
  // 部分一致には s_mode=s_tag が必須。タイトルだけ(s_tc)・完全一致(s_tag_full)・
  // タグ・タイトル・キャプション(tag_tc)が s_mode 枠を取ると効かないので、
  // そのときは term も足さない(送っても嘘になる)。
  const usePopular =
    Boolean(state.pixivPopular) && !state.titleOnly && !state.exactTag && !state.tagTitleCaption
  if (usePopular) toks.push(tok(state.pixivPopular, 'pixivPopular'))
  // 正の条件がなければ検索として成立しない(除外だけでは開けない)
  if (toks.length === 0) return null
  toks.push(...minusExcludeTokens(state))

  const params = new ParamParts()
  // s_mode は1枠。優先度 タイトルだけ(s_tc) > タグ完全一致(s_tag_full) >
  // タグ・タイトル・キャプション(tag_tc) > 人気の目安(s_tag)。
  // タイトルだけ=タイトル・キャプション検索(公式ヘルプ記載)。完全一致=s_tag_full(2026-07-06実測、
  // 部分732千→完全724千で実際に絞られる)。タグ・タイトル・キャプションは通常のタグ部分一致より
  // 広い範囲がヒットする(2026-07-07実測、猫の部分一致24万件→tag_tcで112万件)。
  // 人気の目安は部分一致が要るので s_tag を明示。
  if (state.titleOnly) params.set('s_mode', 's_tc', 'titleOnly')
  else if (state.exactTag) params.set('s_mode', 's_tag_full', 'exactTag')
  else if (state.tagTitleCaption) params.set('s_mode', 'tag_tc', 'tagTitleCaption')
  else if (usePopular) params.set('s_mode', 's_tag', 'pixivPopular')
  // 新着は既定なので order を付けない。order=date_d は scd/ecd と併用すると
  // pixiv がエラーページを返すため明示しない(2026-07-04 実測)。
  // popular_d=人気(プレミアム限定)のときだけ order を指定する。指定なしも何も送らない
  if (state.sort === 'top') params.set('order', 'popular_d', 'sortOrder')
  if (state.since) params.set('scd', state.since, 'period')
  if (state.until) params.set('ecd', state.until, 'period')
  // 年齢制限とAI生成は /tags エンドポイントでも有効(2026-07-05実機確認)。
  // mode=safe(全年齢)/r18(R18のみ)。空(すべて)はアカウント既定なので送らない。
  // ai_type=1 でAI生成作品を除外(送らなければアカウント既定に従う)。どちらも非会員でも効く
  if (state.ageRating) params.set('mode', state.ageRating, 'ageRating')
  if (state.excludeAi) params.set('ai_type', '1', 'excludeAi')

  if (state.tagTitleCaption) {
    // タグ・タイトル・キャプションのときだけ /search?q=…&type=… エンドポイントへ。
    // type= は作品の種類が指定なし(artwork)でも常に送るので、そのときは無帰属
    params.set('type', SEARCH_ENDPOINT_TYPE[state.workType], ...(state.workType ? (['workType'] as const) : []))
    return [
      lit('https://www.pixiv.net/search?q='),
      ...encodeTokens(toks),
      ...params.parts('&'),
    ]
  }

  // うごくイラストは専用パスが無く(/tags/…/ugoira は「不正なリクエスト」)、
  // illustrations カテゴリで type=ugoira を付けて絞る(2026-07-06 実測: 全72万→約7千)。
  if (state.workType === 'ugoira') params.set('type', 'ugoira', 'workType')

  // イラスト・うごくイラストは illustrations、マンガは manga、小説は novels、
  // 指定なしは全作品(artworks)。うごくは上の type=ugoira で更に絞る
  const section =
    state.workType === 'manga'
      ? 'manga'
      : state.workType === 'novel'
        ? 'novels'
        : state.workType === 'illust' || state.workType === 'ugoira'
          ? 'illustrations'
          : 'artworks'
  return [
    lit('https://www.pixiv.net/tags/'),
    ...encodeTokens(toks),
    lit('/'),
    state.workType ? part(section, 'workType') : lit(section),
    ...params.parts('?'),
  ]
}

// 逆翻訳: /tags/{q}/{section} と /search?q=…&type=…(タグ・タイトル・キャプション)。
// -語は除外、00users/000users/0000users は人気の目安の部分パターンとして読む
function parseUrl(url: URL): ParsedSearch | null {
  if (!hostMatches(url, 'pixiv.net')) return null
  const segs = pathSegments(url)
  const patch: Partial<QueryState> = {}
  const ignored: string[] = []
  const consumed = new Set(['s_mode', 'order', 'scd', 'ecd', 'mode', 'ai_type', 'type'])

  let q: string
  if (segs[0] === 'tags' && segs[1]) {
    q = segs[1]
    const section = segs[2] ?? 'artworks'
    if (section === 'illustrations') patch.workType = 'illust'
    else if (section === 'manga') patch.workType = 'manga'
    else if (section === 'novels') patch.workType = 'novel'
    else if (section !== 'artworks') ignored.push(`/${section}`)
    const type = url.searchParams.get('type')
    // うごくイラストは illustrations セクション + type=ugoira の組み合わせ
    if (type === 'ugoira' && patch.workType === 'illust') patch.workType = 'ugoira'
    else if (type !== null) ignored.push(`type=${type}`)
  } else if (segs[0] === 'search') {
    const qp = url.searchParams.get('q')
    if (!qp) return null
    q = qp
    consumed.add('q')
    const type = url.searchParams.get('type')
    const wt = Object.entries(SEARCH_ENDPOINT_TYPE).find(([, v]) => v === type)?.[0]
    if (wt !== undefined) {
      if (wt) patch.workType = wt as QueryState['workType']
    } else if (type !== null) ignored.push(`type=${type}`)
  } else return null

  const sMode = url.searchParams.get('s_mode')
  if (sMode === 's_tc') patch.titleOnly = true
  else if (sMode === 's_tag_full') patch.exactTag = true
  else if (sMode === 'tag_tc') patch.tagTitleCaption = true
  else if (sMode !== null && sMode !== 's_tag') ignored.push(`s_mode=${sMode}`)
  // /search エンドポイントはタグ・タイトル・キャプション検索の入り口(s_mode省略時も同義)
  if (segs[0] === 'search' && (sMode === null || sMode === 'tag_tc')) patch.tagTitleCaption = true

  const terms: string[] = []
  const excludes: string[] = []
  for (const token of tokenize(q)) {
    if (token.startsWith('-') && token.length > 1) excludes.push(token.slice(1))
    else if (/^0+users$/.test(token)) patch.pixivPopular = token as QueryState['pixivPopular']
    else terms.push(token)
  }
  if (terms.length > 0) patch.terms = terms
  if (excludes.length > 0) patch.exclude = excludes.join(' ')

  const order = url.searchParams.get('order')
  if (order === 'popular_d') patch.sort = 'top'
  else if (order === 'date_d') patch.sort = 'new'
  else if (order !== null) ignored.push(`order=${order}`)
  const scd = url.searchParams.get('scd')
  if (scd !== null) {
    if (isIsoDate(scd)) patch.since = scd
    else ignored.push(`scd=${scd}`)
  }
  const ecd = url.searchParams.get('ecd')
  if (ecd !== null) {
    if (isIsoDate(ecd)) patch.until = ecd
    else ignored.push(`ecd=${ecd}`)
  }
  const mode = url.searchParams.get('mode')
  if (mode === 'safe' || mode === 'r18') patch.ageRating = mode
  else if (mode !== null) ignored.push(`mode=${mode}`)
  const aiType = url.searchParams.get('ai_type')
  if (aiType === '1') patch.excludeAi = true
  else if (aiType !== null) ignored.push(`ai_type=${aiType}`)

  leftoverParams(url, consumed, ignored)
  return { patch, ignored }
}

export const pixiv: PlatformDef = {
  id: 'pixiv',
  name: 'pixiv',
  group: 'image',
  brandColor: '#0096FA',
  requiresLogin: false,
  googleSite: 'pixiv.net',
  support: {
    keywords: { level: 'partial', noteKey: 'note.pixiv.keywords' },
    exactPhrase: { level: 'partial', noteKey: 'note.pixiv.exactPhrase' },
    titleOnly: { level: 'partial', noteKey: 'note.pixiv.titleOnly' },
    exactTag: { level: 'full' },
    tagTitleCaption: { level: 'full' },
    exclude: { level: 'full' },
    fromUser: { level: 'none', noteKey: 'note.pixiv.fromUser' },
    hashtag: { level: 'full' },
    period: { level: 'partial' },
    workType: { level: 'full' },
    mediaOnly: { level: 'none', noteKey: 'note.imageOnly' },
    sortOrder: { level: 'partial', noteKey: 'note.pixiv.sort' },
    pixivPopular: { level: 'partial', noteKey: 'note.pixiv.popular' },
    ageRating: { level: 'full' },
    excludeAi: { level: 'full' },
  },
  buildParts,
  parseUrl,
  dynamicSupport: (state) => {
    const overrides: Partial<Record<ConceptId, ConceptSupport>> = {}
    // s_mode は1枠。優先度 titleOnly > exactTag > tagTitleCaption > pixivPopular で
    // 負けた概念は実際には送られないので none に落として正直に(「適用と出るのに効かない」を防ぐ)
    const conflict: ConceptSupport = { level: 'none', noteKey: 'note.pixiv.smodeConflict' }
    if (state.titleOnly) {
      if (state.exactTag) overrides.exactTag = conflict
      if (state.tagTitleCaption) overrides.tagTitleCaption = conflict
      if (state.pixivPopular) overrides.pixivPopular = conflict
    } else if (state.exactTag) {
      if (state.tagTitleCaption) overrides.tagTitleCaption = conflict
      if (state.pixivPopular) overrides.pixivPopular = conflict
    } else if (state.tagTitleCaption && state.pixivPopular) {
      overrides.pixivPopular = conflict
    }
    return {
      ...overrides,
      ...limitSort(state.sort, ['new', 'top'], 'note.sortOrder.otherSite'),
      // R18のみ(mode=r18)は未ログインだと結果に出ないので、その値のときだけ注記つきに落とす。
      // 全年齢(safe)は誰でも効くので full のまま
      ...(state.ageRating === 'r18'
        ? { ageRating: { level: 'partial', noteKey: 'note.pixiv.r18Login' } }
        : {}),
    }
  },
}
