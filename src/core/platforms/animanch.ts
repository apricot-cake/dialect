import type { ParsedSearch, PlatformDef, QueryState, UrlPart } from '../types'
import { andTerms, exactPhrases, words } from '../text'
import { hostIs, leftoverParams, pathSegments } from '../parse'
import { encodeTokens, lit, part, tok, type Token } from '../urlParts'

// 出典: docs/operator-research.md(2026-07-03調査、実測)
// 検索はパスにキーワードを埋め込む形式。スペース区切りのANDが効く(実測)。
// /searchRes/=レス本文検索(β。インデックスに取りこぼしの可能性あり)、
// /search2/=全期間の過去ログのスレタイトル検索、/search/=現行スレのみ(直近約2か月)。
// 既定はレス本文(searchRes)、「タイトルだけ」ONで過去ログタイトル(search2)へ切り替える。
// 演算子(除外・引用符)や並び順・期間のパラメータは存在しない。
function buildParts(state: QueryState): UrlPart[] | null {
  const toks: Token[] = andTerms(state).map((t) => tok(t, 'keywords'))
  // 引用符構文がないため語句もそのままキーワードとして埋め込む
  toks.push(...exactPhrases(state).map((p) => tok(p, 'exactPhrase')))
  if (toks.length === 0) return null

  return [
    lit('https://bbs.animanch.com/'),
    // 過去ログタイトル検索への切り替えは「タイトルだけ」が生む断片(既定の searchRes は無帰属)
    state.titleOnly ? part('search2', 'titleOnly') : lit('searchRes'),
    lit('/'),
    ...encodeTokens(toks),
  ]
}

// 逆翻訳: /searchRes/{q}(レス本文)・/search2/{q}(過去ログタイトル=タイトルだけ)・
// /search/{q}(現行スレのタイトル検索。全期間のタイトル検索として読み、その旨を残す)
function parseUrl(url: URL): ParsedSearch | null {
  if (!hostIs(url, 'bbs.animanch.com')) return null
  const segs = pathSegments(url)
  if (!['searchRes', 'search2', 'search'].includes(segs[0]) || !segs[1]) return null

  const patch: Partial<QueryState> = {}
  const ignored: string[] = []
  const terms = words(segs[1])
  if (terms.length > 0) patch.terms = terms
  if (segs[0] === 'search2') patch.titleOnly = true
  else if (segs[0] === 'search') {
    patch.titleOnly = true
    ignored.push('/search/(現行スレのみ)')
  }
  leftoverParams(url, new Set(), ignored)
  return { patch, ignored }
}

export const animanch: PlatformDef = {
  id: 'animanch',
  name: 'あにまん掲示板',
  group: 'text',
  brandColor: '#104CD0',
  requiresLogin: false,
  googleSite: 'bbs.animanch.com',
  support: {
    keywords: { level: 'partial', noteKey: 'note.animanch.keywords' },
    exactPhrase: { level: 'partial', noteKey: 'note.loose.exact' },
    titleOnly: { level: 'partial', noteKey: 'note.animanch.titleOnly' },
    sortOrder: { level: 'none', noteKey: 'note.nosort' },
  },
  buildParts,
  parseUrl,
}
