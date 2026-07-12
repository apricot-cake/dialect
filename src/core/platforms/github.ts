import type {
  ConceptId,
  ConceptSupport,
  ParsedSearch,
  PlatformDef,
  QueryState,
  ResultType,
  UrlPart,
} from '../types'
import { quoteIfPhrase, stripAt, words } from '../text'
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

// 出典: 2026-07-12にGUI操作で実測(issue #53・#64、github.com/search/advanced の詳細検索
// フォームへ実際に値を入力し、画面下の隠しクエリ入力(input[name=q]、React管理下のため
// ネイティブsetter経由で値を設定しinput/changeイベントを発火)へ実際に合成されたqualifier
// 文字列を採取。フォーム送信もして最終URLが github.com/search?q=<query>&type=<Type> に
// なることも確認)。詳細は docs/operator-research.md の「GitHub / Qiita / Zenn 調査」節と
// 「GitHub 第2弾調査」節を参照。
//
// GitHubは演算子点数が既存サイト中最多(20種前後)なため、issue #53でPhase 1(主要概念)を
// 実装し、残りをissue #64(本ファイルの今回分)で実装した。resultTypeがさらに5種
// (commits/registrypackages/wikis/topics/marketplace)存在することが#64の調査中に判明したが、
// これは#53・#64のいずれの起票時点でも把握されていなかった調査漏れのため、別issue(#65・
// 第3弾)へ切り出し済み(取捨選択ではなく作業分割)。

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
// forks:/size:/license:/topic:/in:/archived:/mirror:/pushed: は「Repositories options」節
// 専用でコード検索には存在しない(fork inclusionはコード検索にも別途あるためREPO_LIKEを使う)
const REPO_ONLY_TYPES: ReadonlySet<ResultType> = new Set(['', 'repositories'])
// extension/path/filenameの3欄(すべてpath:へ合成)は「Code options」節専用
const CODE_ONLY_TYPES: ReadonlySet<ResultType> = new Set(['code'])
// state:/reason:/comments:/label:/mentions:/assignee:/updated: は「Issues options」節専用
// (docs.github.comの記載どおりIssue・プルリクエストで共通のためISSUE_LIKEを再利用)
const ISSUE_FIELD_TYPES: ReadonlySet<ResultType> = ISSUE_LIKE
// fullname:/location:/followers:/repos: は「Users options」節専用
const PEOPLE_TYPES: ReadonlySet<ResultType> = new Set(['people'])

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

  // リポジトリ・コード共用(REPO_LIKE)
  if (state.includeForks && REPO_LIKE.has(state.resultType)) {
    toks.push(tok(`fork:${state.includeForks}`, 'includeForks'))
  }
  if (state.visibility && REPO_LIKE.has(state.resultType)) {
    toks.push(tok(`is:${state.visibility}`, 'visibility'))
  }
  if (state.org.trim() && REPO_LIKE.has(state.resultType)) {
    toks.push(tok(`org:${stripAt(state.org)}`, 'org'))
  }

  // リポジトリ専用(REPO_ONLY_TYPES)
  if (REPO_ONLY_TYPES.has(state.resultType)) {
    if (state.minForks.trim()) toks.push(tok(`forks:>=${state.minForks.trim()}`, 'minForks'))
    if (state.minSizeKb.trim()) toks.push(tok(`size:>=${state.minSizeKb.trim()}`, 'minSizeKb'))
    if (state.codeLicense) toks.push(tok(`license:${state.codeLicense}`, 'codeLicense'))
    for (const t of words(state.topic)) toks.push(tok(`topic:${t}`, 'topic'))
    const inScopes: string[] = []
    const inConcepts: ConceptId[] = []
    if (state.searchInName) {
      inScopes.push('name')
      inConcepts.push('searchInName')
    }
    if (state.searchInDescription) {
      inScopes.push('description')
      inConcepts.push('searchInDescription')
    }
    if (state.searchInReadme) {
      inScopes.push('readme')
      inConcepts.push('searchInReadme')
    }
    if (inScopes.length > 0) toks.push(tok(`in:${inScopes.join(',')}`, ...inConcepts))
    if (state.archived) toks.push(tok(`archived:${state.archived}`, 'archived'))
    if (state.mirror) toks.push(tok(`mirror:${state.mirror}`, 'mirror'))
    if (state.pushedSince && state.pushedUntil) {
      toks.push(tok(`pushed:${state.pushedSince}..${state.pushedUntil}`, 'pushedPeriod'))
    } else if (state.pushedSince) toks.push(tok(`pushed:>=${state.pushedSince}`, 'pushedPeriod'))
    else if (state.pushedUntil) toks.push(tok(`pushed:<=${state.pushedUntil}`, 'pushedPeriod'))
  }

  // コード検索専用(CODE_ONLY_TYPES)。3欄いずれもpath:のglobパターンへ合成される
  if (CODE_ONLY_TYPES.has(state.resultType)) {
    if (state.fileExtension.trim())
      toks.push(tok(`path:*.${state.fileExtension.trim()}`, 'fileExtension'))
    if (state.filePath.trim()) toks.push(tok(`path:${state.filePath.trim()}`, 'filePath'))
    if (state.fileName.trim()) toks.push(tok(`path:**/${state.fileName.trim()}`, 'fileName'))
  }

  // Issue・プルリクエスト専用(ISSUE_FIELD_TYPES)
  if (ISSUE_FIELD_TYPES.has(state.resultType)) {
    if (state.issueState) toks.push(tok(`state:${state.issueState}`, 'issueState'))
    if (state.issueReason)
      toks.push(tok(`reason:${quoteIfPhrase(state.issueReason)}`, 'issueReason'))
    if (state.minComments.trim())
      toks.push(tok(`comments:>=${state.minComments.trim()}`, 'minComments'))
    for (const l of words(state.label)) toks.push(tok(`label:${l}`, 'label'))
    for (const a of words(state.assignee)) toks.push(tok(`assignee:${a}`, 'assignee'))
    if (state.mentionsUser.trim())
      toks.push(tok(`mentions:${stripAt(state.mentionsUser)}`, 'mentionsUser'))
    if (state.updatedSince && state.updatedUntil) {
      toks.push(tok(`updated:${state.updatedSince}..${state.updatedUntil}`, 'updatedPeriod'))
    } else if (state.updatedSince)
      toks.push(tok(`updated:>=${state.updatedSince}`, 'updatedPeriod'))
    else if (state.updatedUntil) toks.push(tok(`updated:<=${state.updatedUntil}`, 'updatedPeriod'))
  }

  // ユーザー検索専用(PEOPLE_TYPES)
  if (PEOPLE_TYPES.has(state.resultType)) {
    if (state.fullName.trim())
      toks.push(tok(`fullname:${quoteIfPhrase(state.fullName.trim())}`, 'fullName'))
    if (state.userLocation.trim())
      toks.push(tok(`location:"${state.userLocation.trim()}"`, 'userLocation'))
    if (state.minFollowers.trim())
      toks.push(tok(`followers:>=${state.minFollowers.trim()}`, 'minFollowers'))
    if (state.minRepos.trim()) toks.push(tok(`repos:>=${state.minRepos.trim()}`, 'minRepos'))
  }

  if (toks.length === 0) return null

  const parts: UrlPart[] = [lit('https://github.com/search?q='), ...encodeTokens(toks)]
  const typeParam = RESULT_TYPE_PARAM[state.resultType]
  if (typeParam) parts.push(lit('&type='), part(typeParam, 'resultType'))
  return parts
}

// 逆翻訳: github.com/search?q=…&type=…。q内の各qualifier(user:/author:/language:/stars:/
// created:/pushed:/updated:/fork:/is:/org:/forks:/size:/license:/topic:/in:/archived:/
// mirror:/path:/state:/reason:/comments:/label:/assignee:/mentions:/fullname:/location:/
// followers:/repos:)と、type= (探す種類)を読む
function parseUrl(url: URL): ParsedSearch | null {
  if (!hostIs(url, 'github.com')) return null
  if (pathSegments(url)[0] !== 'search') return null
  const q = url.searchParams.get('q')
  if (!q) return null

  const patch: Partial<QueryState> = {}
  const ignored: string[] = []
  const bins = emptyBins()
  const topics: string[] = []
  const labels: string[] = []
  const assignees: string[] = []

  /** created:/pushed:/updated: 共通の日付範囲構文(YYYY-MM-DD、..区切り・>=/<=) */
  function parseDateRange(v: string): { since?: string; until?: string } | null {
    const range = v.match(/^(\d{4}-\d{2}-\d{2})\.\.(\d{4}-\d{2}-\d{2})$/)
    const ge = v.match(/^>=?(\d{4}-\d{2}-\d{2})$/)
    const le = v.match(/^<=?(\d{4}-\d{2}-\d{2})$/)
    if (range) return { since: range[1], until: range[2] }
    if (ge) return { since: ge[1] }
    if (le) return { until: le[1] }
    return null
  }

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
      const range = parseDateRange(token.slice('created:'.length))
      if (range) Object.assign(patch, range)
      else ignored.push(token)
    } else if (token.startsWith('pushed:')) {
      const range = parseDateRange(token.slice('pushed:'.length))
      if (range) {
        if (range.since !== undefined) patch.pushedSince = range.since
        if (range.until !== undefined) patch.pushedUntil = range.until
      } else ignored.push(token)
    } else if (token.startsWith('updated:')) {
      const range = parseDateRange(token.slice('updated:'.length))
      if (range) {
        if (range.since !== undefined) patch.updatedSince = range.since
        if (range.until !== undefined) patch.updatedUntil = range.until
      } else ignored.push(token)
    } else if (token.startsWith('fork:')) {
      const v = token.slice('fork:'.length)
      if (v === 'true' || v === 'only') patch.includeForks = v
      else ignored.push(token)
    } else if (token.startsWith('is:')) {
      const v = token.slice('is:'.length)
      if (v === 'public' || v === 'private') patch.visibility = v
      else ignored.push(token)
    } else if (token.startsWith('org:')) patch.org = token.slice('org:'.length)
    else if (token.startsWith('forks:')) {
      const m = token.slice('forks:'.length).match(/^>=?(\d+)$/)
      if (m) patch.minForks = m[1]
      else ignored.push(token)
    } else if (token.startsWith('size:')) {
      const m = token.slice('size:'.length).match(/^>=?(\d+)$/)
      if (m) patch.minSizeKb = m[1]
      else ignored.push(token)
    } else if (token.startsWith('license:')) {
      patch.codeLicense = token.slice('license:'.length) as QueryState['codeLicense']
    } else if (token.startsWith('topic:')) topics.push(token.slice('topic:'.length))
    else if (token.startsWith('in:')) {
      const scopes = token.slice('in:'.length).split(',')
      if (scopes.includes('name')) patch.searchInName = true
      if (scopes.includes('description')) patch.searchInDescription = true
      if (scopes.includes('readme')) patch.searchInReadme = true
    } else if (token.startsWith('archived:')) {
      const v = token.slice('archived:'.length)
      if (v === 'true' || v === 'false') patch.archived = v
      else ignored.push(token)
    } else if (token.startsWith('mirror:')) {
      const v = token.slice('mirror:'.length)
      if (v === 'true' || v === 'false') patch.mirror = v
      else ignored.push(token)
    } else if (token.startsWith('path:')) patch.filePath = token.slice('path:'.length)
    else if (token.startsWith('state:')) {
      const v = token.slice('state:'.length)
      if (v === 'open' || v === 'closed') patch.issueState = v
      else ignored.push(token)
    } else if (token.startsWith('reason:')) {
      const v = token.slice('reason:'.length)
      const reason = v.startsWith('"') ? unquote(v) : v
      if (reason === 'completed' || reason === 'not planned' || reason === 'reopened')
        patch.issueReason = reason
      else ignored.push(token)
    } else if (token.startsWith('comments:')) {
      const m = token.slice('comments:'.length).match(/^>=?(\d+)$/)
      if (m) patch.minComments = m[1]
      else ignored.push(token)
    } else if (token.startsWith('label:')) {
      const v = token.slice('label:'.length)
      labels.push(v.startsWith('"') ? unquote(v) : v)
    } else if (token.startsWith('assignee:')) assignees.push(token.slice('assignee:'.length))
    else if (token.startsWith('mentions:')) patch.mentionsUser = token.slice('mentions:'.length)
    else if (token.startsWith('fullname:')) {
      const v = token.slice('fullname:'.length)
      patch.fullName = v.startsWith('"') ? unquote(v) : v
    } else if (token.startsWith('location:')) {
      const v = token.slice('location:'.length)
      patch.userLocation = v.startsWith('"') ? unquote(v) : v
    } else if (token.startsWith('followers:')) {
      const m = token.slice('followers:'.length).match(/^>=?(\d+)$/)
      if (m) patch.minFollowers = m[1]
      else ignored.push(token)
    } else if (token.startsWith('repos:')) {
      const m = token.slice('repos:'.length).match(/^>=?(\d+)$/)
      if (m) patch.minRepos = m[1]
      else ignored.push(token)
    } else if (token.startsWith('"')) bins.phrases.push(unquote(token))
    else if (token.startsWith('-') && token.length > 1) bins.excludes.push(token.slice(1))
    else bins.terms.push(token)
  }
  applyBins(patch, bins)
  if (topics.length > 0) patch.topic = topics.join(' ')
  if (labels.length > 0) patch.label = labels.join(' ')
  if (assignees.length > 0) patch.assignee = assignees.join(' ')

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
  } else if (state.resultType === 'code') {
    // 2026-07-12にissue #64の検証中に発覚: コード検索は結果の閲覧にGitHubへのログインが
    // 必要(未ログインで開くと「Sign in to search code on GitHub」の案内のみが出る)。
    // URLの組み立て自体は未ログインでも可能なため、pixivのR18(note.pixiv.r18Login)と
    // 同じ「partial+注記」の型にする(noneに落とさない)
    overrides.resultType = { level: 'partial', noteKey: 'note.github.codeLoginRequired' }
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
  if (state.includeForks && !REPO_LIKE.has(state.resultType)) {
    overrides.includeForks = { level: 'none', noteKey: 'note.github.repoCodeScopeOnly' }
  }
  if (state.visibility && !REPO_LIKE.has(state.resultType)) {
    overrides.visibility = { level: 'none', noteKey: 'note.github.repoCodeScopeOnly' }
  }
  if (state.org.trim() && !REPO_LIKE.has(state.resultType)) {
    overrides.org = { level: 'none', noteKey: 'note.github.repoCodeScopeOnly' }
  }
  if (state.minForks.trim() && !REPO_ONLY_TYPES.has(state.resultType)) {
    overrides.minForks = { level: 'none', noteKey: 'note.github.repoScopeOnly' }
  }
  if (state.minSizeKb.trim() && !REPO_ONLY_TYPES.has(state.resultType)) {
    overrides.minSizeKb = { level: 'none', noteKey: 'note.github.repoScopeOnly' }
  }
  if (state.codeLicense && !REPO_ONLY_TYPES.has(state.resultType)) {
    overrides.codeLicense = { level: 'none', noteKey: 'note.github.repoScopeOnly' }
  }
  if (state.topic.trim() && !REPO_ONLY_TYPES.has(state.resultType)) {
    overrides.topic = { level: 'none', noteKey: 'note.github.repoScopeOnly' }
  }
  if (state.searchInName && !REPO_ONLY_TYPES.has(state.resultType)) {
    overrides.searchInName = { level: 'none', noteKey: 'note.github.repoScopeOnly' }
  }
  if (state.searchInDescription && !REPO_ONLY_TYPES.has(state.resultType)) {
    overrides.searchInDescription = { level: 'none', noteKey: 'note.github.repoScopeOnly' }
  }
  if (state.searchInReadme && !REPO_ONLY_TYPES.has(state.resultType)) {
    overrides.searchInReadme = { level: 'none', noteKey: 'note.github.repoScopeOnly' }
  }
  if (state.archived && !REPO_ONLY_TYPES.has(state.resultType)) {
    overrides.archived = { level: 'none', noteKey: 'note.github.repoScopeOnly' }
  }
  if (state.mirror && !REPO_ONLY_TYPES.has(state.resultType)) {
    overrides.mirror = { level: 'none', noteKey: 'note.github.repoScopeOnly' }
  }
  if ((state.pushedSince || state.pushedUntil) && !REPO_ONLY_TYPES.has(state.resultType)) {
    overrides.pushedPeriod = { level: 'none', noteKey: 'note.github.repoScopeOnly' }
  }
  if (state.fileExtension.trim() && !CODE_ONLY_TYPES.has(state.resultType)) {
    overrides.fileExtension = { level: 'none', noteKey: 'note.github.codeScopeOnly' }
  }
  if (state.filePath.trim() && !CODE_ONLY_TYPES.has(state.resultType)) {
    overrides.filePath = { level: 'none', noteKey: 'note.github.codeScopeOnly' }
  }
  if (state.fileName.trim() && !CODE_ONLY_TYPES.has(state.resultType)) {
    overrides.fileName = { level: 'none', noteKey: 'note.github.codeScopeOnly' }
  }
  if (state.issueState && !ISSUE_FIELD_TYPES.has(state.resultType)) {
    overrides.issueState = { level: 'none', noteKey: 'note.github.issueScopeOnly' }
  }
  if (state.issueReason && !ISSUE_FIELD_TYPES.has(state.resultType)) {
    overrides.issueReason = { level: 'none', noteKey: 'note.github.issueScopeOnly' }
  }
  if (state.minComments.trim() && !ISSUE_FIELD_TYPES.has(state.resultType)) {
    overrides.minComments = { level: 'none', noteKey: 'note.github.issueScopeOnly' }
  }
  if (state.label.trim() && !ISSUE_FIELD_TYPES.has(state.resultType)) {
    overrides.label = { level: 'none', noteKey: 'note.github.issueScopeOnly' }
  }
  if (state.assignee.trim() && !ISSUE_FIELD_TYPES.has(state.resultType)) {
    overrides.assignee = { level: 'none', noteKey: 'note.github.issueScopeOnly' }
  }
  if (state.mentionsUser.trim() && !ISSUE_FIELD_TYPES.has(state.resultType)) {
    overrides.mentionsUser = { level: 'none', noteKey: 'note.github.issueScopeOnly' }
  }
  if ((state.updatedSince || state.updatedUntil) && !ISSUE_FIELD_TYPES.has(state.resultType)) {
    overrides.updatedPeriod = { level: 'none', noteKey: 'note.github.issueScopeOnly' }
  }
  if (state.fullName.trim() && !PEOPLE_TYPES.has(state.resultType)) {
    overrides.fullName = { level: 'none', noteKey: 'note.github.userScopeOnly' }
  }
  if (state.userLocation.trim() && !PEOPLE_TYPES.has(state.resultType)) {
    overrides.userLocation = { level: 'none', noteKey: 'note.github.userScopeOnly' }
  }
  if (state.minFollowers.trim() && !PEOPLE_TYPES.has(state.resultType)) {
    overrides.minFollowers = { level: 'none', noteKey: 'note.github.userScopeOnly' }
  }
  if (state.minRepos.trim() && !PEOPLE_TYPES.has(state.resultType)) {
    overrides.minRepos = { level: 'none', noteKey: 'note.github.userScopeOnly' }
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
    includeForks: { level: 'full' },
    visibility: { level: 'full' },
    org: { level: 'full' },
    minForks: { level: 'full' },
    minSizeKb: { level: 'full' },
    codeLicense: { level: 'full' },
    topic: { level: 'full' },
    searchInName: { level: 'full' },
    searchInDescription: { level: 'full' },
    searchInReadme: { level: 'full' },
    archived: { level: 'full' },
    mirror: { level: 'full' },
    pushedPeriod: { level: 'full' },
    fileExtension: { level: 'full' },
    filePath: { level: 'full' },
    fileName: { level: 'full' },
    issueState: { level: 'full' },
    issueReason: { level: 'full' },
    minComments: { level: 'full' },
    label: { level: 'full' },
    assignee: { level: 'full' },
    mentionsUser: { level: 'full' },
    updatedPeriod: { level: 'full' },
    fullName: { level: 'full' },
    userLocation: { level: 'full' },
    minFollowers: { level: 'full' },
    minRepos: { level: 'full' },
  },
  buildParts,
  parseUrl,
  dynamicSupport,
}
