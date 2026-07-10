import type { ParsedSearch, PlatformDef, QueryState, UrlPart } from '../types'
import { andTerms, exactPhrases, words } from '../text'
import { encodeTokens, lit, minusExcludeTokens, tok, type Token } from '../urlParts'
import { hostIs, leftoverParams, tokenize } from '../parse'

// 出典: docs/operator-research.md(2026-07-03調査、実測)
// 5chは2026-03に5ch.net→5ch.ioへドメイン移行。公式スレタイ検索(find.5ch.io)は
// スペース区切りが絞り込みにならない(関連度ベース)ため「足す=絞る」を満たさず、
// AND・除外(-)・板指定(@板ID)が全て実測で効く ff5ch.syoboi.jp を検索先にする。
// 部分文字列マッチ型なので引用符は不要(存在しない)。検索対象はスレタイトルのみ。
// 板は複数指定でいずれか(OR)。@板ID を並べると和集合になる(2026-07-04実測)。
function buildParts(state: QueryState): UrlPart[] | null {
  const toks: Token[] = andTerms(state).map((t) => tok(t, 'keywords'))
  // 引用符構文はないが部分文字列マッチのため、語句はそのまま埋め込めば効く
  toks.push(...exactPhrases(state).map((p) => tok(p, 'exactPhrase')))
  const boardToks = words(state.subreddit).map((b) => tok(`@${b.replace(/^@+/, '')}`, 'subreddit'))
  // 正の条件はキーワード/フレーズ、または板指定。除外だけでは検索にならない
  if (toks.length === 0 && boardToks.length === 0) return null
  toks.push(...minusExcludeTokens(state))
  toks.push(...boardToks)

  return [lit('https://ff5ch.syoboi.jp/?q='), ...encodeTokens(toks)]
}

// 逆翻訳: ff5ch.syoboi.jp/?q=…。@板ID=板の絞り込み、-語=除外、他は語
function parseUrl(url: URL): ParsedSearch | null {
  if (!hostIs(url, 'ff5ch.syoboi.jp')) return null
  const q = url.searchParams.get('q')
  if (!q) return null

  const patch: Partial<QueryState> = {}
  const ignored: string[] = []
  const terms: string[] = []
  const excludes: string[] = []
  const boards: string[] = []
  for (const token of tokenize(q)) {
    if (token.startsWith('@') && token.length > 1) boards.push(token.slice(1))
    else if (token.startsWith('-') && token.length > 1) excludes.push(token.slice(1))
    else terms.push(token)
  }
  if (terms.length > 0) patch.terms = terms
  if (excludes.length > 0) patch.exclude = excludes.join(' ')
  if (boards.length > 0) patch.subreddit = boards.join(' ')
  leftoverParams(url, new Set(['q']), ignored)
  return { patch, ignored }
}

export const fivech: PlatformDef = {
  id: 'fivech',
  name: '5ちゃんねる',
  group: 'text',
  brandColor: '#8A6D3B',
  requiresLogin: false,
  googleSite: '5ch.io',
  support: {
    keywords: { level: 'partial', noteKey: 'note.fivech.keywords' },
    exactPhrase: { level: 'partial', noteKey: 'note.exact.substring' },
    exclude: { level: 'full' },
    // ff5chは元々スレタイのみ検索。トグルは何も変えない(常にタイトル対象)ので注記で伝える
    titleOnly: { level: 'partial', noteKey: 'note.fivech.titleOnly' },
    subreddit: { level: 'partial', noteKey: 'note.fivech.subreddit' },
    sortOrder: { level: 'none', noteKey: 'note.nosort' },
  },
  buildParts,
  parseUrl,
}
