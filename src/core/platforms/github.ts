import type {
  ConceptId,
  ConceptSupport,
  ParsedSearch,
  PlatformDef,
  QueryState,
  ResultType,
  UrlPart,
} from '../types'
import { quoteIfPhrase, stripAt } from '../text'
import {
  encodeTokens,
  lit,
  minusExcludeTokens,
  part,
  quotedTermTokens,
  tok,
  type Token,
} from '../urlParts'
import {
  applyBins,
  emptyBins,
  hostIs,
  leftoverParams,
  pathSegments,
  tokenize,
  unquote,
} from '../parse'

// 出典: 2026-07-12にGUI操作で実測(issue #53、github.com/search/advanced の詳細検索フォームへ
// 実際に値を入力し、画面下の隠しクエリ入力(input[name=q])へ実際に合成されたqualifier文字列を
// 採取。フォーム送信もして最終URLが github.com/search?q=<query>&type=<Type> になることも確認)。
// 詳細は docs/operator-research.md の「GitHub / Qiita / Zenn 調査」節を参照。
//
// GitHubは演算子点数が既存サイト中最多(20種前後)なため、今回はPhase 1として主要概念のみ
// 実装する。残り(forks/size/pushed/license/fork inclusion/path系/comments/labels/mentions/
// assignee/updated/fullname/location/followers/repos数/state/reason/is:public,private/
// topic/archived等)は実装コストが大きい独立した塊のため別issueへ切り出し済み(取捨選択では
// なく作業分割)。

const RESULT_TYPE_PARAM: Partial<Record<ResultType, string>> = {
  repositories: 'repositories',
  code: 'code',
  issues: 'issues',
  pullRequests: 'pullrequests',
  discussions: 'discussions',
  people: 'users',
}
const PARAM_RESULT_TYPE: Record<string, ResultType> = Object.fromEntries(
  Object.entries(RESULT_TYPE_PARAM).map(([rt, p]) => [p, rt as ResultType]),
)
const GITHUB_RESULT_TYPES: ReadonlySet<ResultType> = new Set([
  '',
  ...(Object.keys(RESULT_TYPE_PARAM) as ResultType[]),
])

// リポジトリ・コード検索は user: (所有者)、Issue・プルリクエスト検索は author: (投稿者)。
// ディスカッション・ユーザー検索には対応する演算子欄が詳細検索フォームに無い
const REPO_LIKE: ReadonlySet<ResultType> = new Set(['', 'repositories', 'code'])
const ISSUE_LIKE: ReadonlySet<ResultType> = new Set(['issues', 'pullRequests'])
const FROM_USER_TYPES: ReadonlySet<ResultType> = new Set([...REPO_LIKE, ...ISSUE_LIKE])
const PERIOD_TYPES: ReadonlySet<ResultType> = FROM_USER_TYPES
// language: はリポジトリ・コードの「書かれた言語」と、ユーザー検索の「使っている言語」を共用
const CODE_LANGUAGE_TYPES: ReadonlySet<ResultType> = new Set([...REPO_LIKE, 'people'])
// stars: はリポジトリ検索の詳細検索フォームでのみ確認できた
const MIN_STARS_TYPES: ReadonlySet<ResultType> = REPO_LIKE

function buildParts(state: QueryState): UrlPart[] | null {
  const toks: Token[] = [...quotedTermTokens(state), ...minusExcludeTokens(state)]

  const handle = stripAt(state.fromUser)
  if (handle && FROM_USER_TYPES.has(state.resultType)) {
    const qualifier = ISSUE_LIKE.has(state.resultType) ? 'author' : 'user'
    toks.push(tok(`${qualifier}:${handle}`, 'fromUser'))
  }
  if (state.codeLanguage.trim() && CODE_LANGUAGE_TYPES.has(state.resultType)) {
    toks.push(tok(`language:${quoteIfPhrase(state.codeLanguage.trim())}`, 'codeLanguage'))
  }
  if (state.minStars.trim() && MIN_STARS_TYPES.has(state.resultType)) {
    toks.push(tok(`stars:>=${state.minStars.trim()}`, 'minStars'))
  }
  if (PERIOD_TYPES.has(state.resultType)) {
    if (state.since && state.until)
      toks.push(tok(`created:${state.since}..${state.until}`, 'period'))
    else if (state.since) toks.push(tok(`created:>=${state.since}`, 'period'))
    else if (state.until) toks.push(tok(`created:<=${state.until}`, 'period'))
  }
  if (toks.length === 0) return null

  const parts: UrlPart[] = [lit('https://github.com/search?q='), ...encodeTokens(toks)]
  const typeParam = RESULT_TYPE_PARAM[state.resultType]
  if (typeParam) parts.push(lit('&type='), part(typeParam, 'resultType'))
  return parts
}

// 逆翻訳: github.com/search?q=…&type=…。q内の user:/author:/language:/stars:/created:と、
// type= (探す種類)を読む
function parseUrl(url: URL): ParsedSearch | null {
  if (!hostIs(url, 'github.com')) return null
  if (pathSegments(url)[0] !== 'search') return null
  const q = url.searchParams.get('q')
  if (!q) return null

  const patch: Partial<QueryState> = {}
  const ignored: string[] = []
  const bins = emptyBins()

  for (const token of tokenize(q)) {
    if (token.startsWith('user:')) patch.fromUser = token.slice('user:'.length)
    else if (token.startsWith('author:')) patch.fromUser = token.slice('author:'.length)
    else if (token.startsWith('language:')) {
      const v = token.slice('language:'.length)
      patch.codeLanguage = v.startsWith('"') ? unquote(v) : v
    } else if (token.startsWith('stars:')) {
      const m = token.slice('stars:'.length).match(/^>=?(\d+)$/)
      if (m) patch.minStars = m[1]
      else ignored.push(token)
    } else if (token.startsWith('created:')) {
      const v = token.slice('created:'.length)
      const range = v.match(/^(\d{4}-\d{2}-\d{2})\.\.(\d{4}-\d{2}-\d{2})$/)
      const ge = v.match(/^>=?(\d{4}-\d{2}-\d{2})$/)
      const le = v.match(/^<=?(\d{4}-\d{2}-\d{2})$/)
      if (range) {
        patch.since = range[1]
        patch.until = range[2]
      } else if (ge) patch.since = ge[1]
      else if (le) patch.until = le[1]
      else ignored.push(token)
    } else if (token.startsWith('"')) bins.phrases.push(unquote(token))
    else if (token.startsWith('-') && token.length > 1) bins.excludes.push(token.slice(1))
    else bins.terms.push(token)
  }
  applyBins(patch, bins)

  const type = url.searchParams.get('type')
  if (type !== null) {
    const rt = PARAM_RESULT_TYPE[type.toLowerCase()]
    if (rt) patch.resultType = rt
    else ignored.push(`type=${type}`)
  }

  leftoverParams(url, new Set(['q', 'type', 'ref', 'l']), ignored)
  return { patch, ignored }
}

function dynamicSupport(state: QueryState): Partial<Record<ConceptId, ConceptSupport>> {
  const overrides: Partial<Record<ConceptId, ConceptSupport>> = {}
  if (state.resultType && !GITHUB_RESULT_TYPES.has(state.resultType)) {
    overrides.resultType = { level: 'none', noteKey: 'note.resultType.otherSite' }
  }
  if (state.fromUser.trim() && !FROM_USER_TYPES.has(state.resultType)) {
    overrides.fromUser = { level: 'none', noteKey: 'note.github.repoIssueScopeOnly' }
  }
  if (state.codeLanguage.trim() && !CODE_LANGUAGE_TYPES.has(state.resultType)) {
    overrides.codeLanguage = { level: 'none', noteKey: 'note.github.repoOrUserScopeOnly' }
  }
  if (state.minStars.trim() && !MIN_STARS_TYPES.has(state.resultType)) {
    overrides.minStars = { level: 'none', noteKey: 'note.github.repoScopeOnly' }
  }
  if ((state.since || state.until) && !PERIOD_TYPES.has(state.resultType)) {
    overrides.period = { level: 'none', noteKey: 'note.github.repoIssueScopeOnly' }
  }
  return overrides
}

export const github: PlatformDef = {
  id: 'github',
  name: 'GitHub',
  group: 'text',
  brandColor: '#181717',
  ink: '#ffffff',
  requiresLogin: false,
  support: {
    keywords: { level: 'full' },
    exactPhrase: { level: 'full' },
    exclude: { level: 'full' },
    fromUser: { level: 'full' },
    codeLanguage: { level: 'full' },
    minStars: { level: 'full' },
    period: { level: 'full' },
    resultType: { level: 'full' },
  },
  buildParts,
  parseUrl,
  dynamicSupport,
}
