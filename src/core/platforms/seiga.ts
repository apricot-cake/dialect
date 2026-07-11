import type {
  ConceptId,
  ConceptSupport,
  ParsedSearch,
  PlatformDef,
  QueryState,
  UrlPart,
} from '../types'
import { limitSort } from '../types'
import { stripHash, words } from '../text'
import {
  encodeTokens,
  lit,
  minusExcludeTokens,
  ParamParts,
  part,
  quotedTermTokens,
  tok,
} from '../urlParts'
import {
  applyBins,
  emptyBins,
  extractBareOrChain,
  hostIs,
  leftoverParams,
  pathSegments,
  tokenize,
  unquote,
} from '../parse'

// 出典: docs/operator-research.md + 2026-07-07 実機再確認(件数比較)。ログイン不要。
// イラストは seiga.nicovideo.jp/search/{クエリ}?target=illust、タグ単独は /tag/{タグ}。
// マンガは manga.nicovideo.jp/search?q=(別エンジン。target=manga はここへリダイレクトされる)。
// スペースAND・除外(-語)・完全一致("…")は両エンジンで実測(件数が整合)。
// 並び順はイラストのみ: image_created(新着)/image_view(閲覧数=人気の代用)。既定は
// comment_created(コメント新着)なので、新着順・人気順は必ず明示する。
// マンガは並び順パラメータを送ると結果集合が変わる癖があるため送らない(既定=関連度)。
function buildParts(state: QueryState): UrlPart[] | null {
  const textToks = quotedTermTokens(state)
  // スコープ限定OR(「このどれかを含む」)。niconico動画と同じ基盤・同じ文法
  // (括弧禁止・並置)。2026-07-11に issue #26 で導入
  const orWords = words(state.keywordsOr)
  const orToks =
    orWords.length >= 2
      ? [tok(orWords.join(' OR '), 'keywordsOr')]
      : orWords.map((w) => tok(w, 'keywordsOr'))
  const tagToks = words(state.hashtag).map((t) => tok(stripHash(t), 'hashtag'))
  const excludeToks = minusExcludeTokens(state)

  // マンガ(ニコニコ漫画)。別ドメイン・別エンジンで、並び順は送らない
  if (state.workType === 'manga') {
    const positive = [...orToks, ...textToks, ...tagToks]
    if (positive.length === 0) return null
    // 別ドメインへの切り替えは「マンガ」の指定が生む断片なので、URL土台を workType に帰属。
    // q= は1ペアに全トークンが畳み込まれるため、含まれる概念すべての複合断片になる
    const toks = [...positive, ...excludeToks]
    const params = new ParamParts()
    params.set('q', toks.map((t) => t.text).join(' '), ...new Set(toks.flatMap((t) => t.concepts)))
    return [part('https://manga.nicovideo.jp/search', 'workType'), ...params.parts('?')]
  }

  // イラスト(既定)。target=illust を明示し、新着/閲覧数のときだけ sort を送る。
  // target=illust は指定なしでも常に送る固定値なので、「イラスト」を明示したときだけ帰属させる
  const params = new ParamParts()
  params.set('target', 'illust', ...(state.workType === 'illust' ? (['workType'] as const) : []))
  if (state.sort === 'new') params.set('sort', 'image_created', 'sortOrder')
  else if (state.sort === 'top') params.set('sort', 'image_view', 'sortOrder')

  // タグ単独(+除外)ならタグ一致検索。OR指定があるときはキーワード検索が要るので対象外。
  // 除外・並び順はタグページでも有効(実測)
  if (tagToks.length > 0 && textToks.length === 0 && orToks.length === 0) {
    return [
      lit('https://seiga.nicovideo.jp/tag/'),
      ...encodeTokens([...tagToks, ...excludeToks]),
      ...params.parts('?'),
    ]
  }

  // 除外語は正の条件に数えない(「足す=絞る」原則。他サイトと揃える)
  const positive = [...orToks, ...textToks, ...tagToks]
  if (positive.length === 0) return null
  return [
    lit('https://seiga.nicovideo.jp/search/'),
    ...encodeTokens([...positive, ...excludeToks]),
    ...params.parts('?'),
  ]
}

// 逆翻訳: seiga.nicovideo.jp/{search|tag}/{q} と manga.nicovideo.jp/search?q=(マンガ)。
// 旧形式の target=manga も「マンガ」として読む(現行サイトは manga.nicovideo.jp へ誘導)
function parseUrl(url: URL): ParsedSearch | null {
  const patch: Partial<QueryState> = {}
  const ignored: string[] = []

  if (hostIs(url, 'manga.nicovideo.jp')) {
    if (pathSegments(url)[0] !== 'search') return null
    const q = url.searchParams.get('q')
    if (!q) return null
    patch.workType = 'manga'
    const { orTerms, rest } = extractBareOrChain(tokenize(q))
    const bins = emptyBins()
    for (const token of rest) {
      if (token.startsWith('-') && token.length > 1) bins.excludes.push(token.slice(1))
      else if (token.startsWith('"')) bins.phrases.push(unquote(token))
      else bins.terms.push(token)
    }
    applyBins(patch, bins)
    if (orTerms.length > 0) patch.keywordsOr = orTerms.join(' ')
    leftoverParams(url, new Set(['q']), ignored)
    return { patch, ignored }
  }

  if (!hostIs(url, 'seiga.nicovideo.jp')) return null
  const segs = pathSegments(url)
  if ((segs[0] !== 'search' && segs[0] !== 'tag') || !segs[1]) return null
  // タグページ(segs[0]==='tag')はOR構文を送らない(buildParts参照)ので、そのままトークン化する
  const rawTokens = tokenize(segs[1])
  const { orTerms, rest } =
    segs[0] === 'tag' ? { orTerms: [], rest: rawTokens } : extractBareOrChain(rawTokens)
  const bins = emptyBins()
  for (const token of rest) {
    if (token.startsWith('-') && token.length > 1) bins.excludes.push(token.slice(1))
    else if (token.startsWith('"')) bins.phrases.push(unquote(token))
    else if (segs[0] === 'tag') bins.hashtags.push(token)
    else bins.terms.push(token)
  }
  applyBins(patch, bins)
  if (orTerms.length > 0) patch.keywordsOr = orTerms.join(' ')

  const target = url.searchParams.get('target')
  if (target === 'manga') patch.workType = 'manga'
  else if (target !== null && target !== 'illust' && target !== 'illust_all') {
    ignored.push(`target=${target}`)
  }
  const sort = url.searchParams.get('sort')
  if (sort === 'image_created') patch.sort = 'new'
  else if (sort === 'image_view') patch.sort = 'top'
  else if (sort !== null) ignored.push(`sort=${sort}`)
  leftoverParams(url, new Set(['target', 'sort']), ignored)
  return { patch, ignored }
}

export const seiga: PlatformDef = {
  id: 'seiga',
  name: 'ニコニコ静画',
  group: 'image',
  brandColor: '#252525',
  requiresLogin: false,
  support: {
    keywords: { level: 'full' },
    exactPhrase: { level: 'full' },
    keywordsOr: { level: 'full' },
    exclude: { level: 'full' },
    hashtag: { level: 'full', noteKey: 'note.tagPage.combined' },
    // イラスト(target=illust)とマンガ(manga.nicovideo.jp)を切り替える。
    // うごくイラスト・小説は静画にないので、その値のとき dynamicSupport で落とす
    workType: { level: 'full' },
    mediaOnly: { level: 'none', noteKey: 'note.imageOnly' },
    sortOrder: { level: 'full' },
  },
  buildParts,
  parseUrl,
  dynamicSupport: (state) => {
    const overrides: Partial<Record<ConceptId, ConceptSupport>> = {
      // 新着/閲覧数以外(急上昇)は静画に無いので落とす
      ...limitSort(state.sort, ['new', 'top'], 'note.sortOrder.otherSite'),
    }
    // 静画にはイラストとマンガしかない。うごく・小説は「使えない」に落として正直に
    if (state.workType === 'ugoira' || state.workType === 'novel') {
      overrides.workType = { level: 'none', noteKey: 'note.seiga.workType' }
    }
    // マンガは別エンジンで並び順を送ると結果集合が変わるため、そのときは並び順を落とす
    if (state.workType === 'manga') {
      overrides.sortOrder = { level: 'none', noteKey: 'note.seiga.mangaSort' }
    }
    return overrides
  },
}
