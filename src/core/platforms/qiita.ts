import type {
  ConceptId,
  ConceptSupport,
  ParsedSearch,
  PlatformDef,
  QueryState,
  UrlPart,
} from '../types'
import { limitSort } from '../types'
import {
  andTerms,
  exactPhrases,
  quoteIfPhrase,
  stripAt,
  stripHash,
  stripQuerySyntax,
  words,
} from '../text'
import {
  encodeTokens,
  lit,
  minusExcludeTokens,
  ParamParts,
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

// 出典: 2026-07-12にGUI操作+doc(issue #54)。詳細検索パネル(tuneアイコン)は未ログインだと
// ログインモーダルが開き中身を見られないが、公式ヘルプ記載の演算子(tag:/user:/title:/
// created:/stocks:)は検索ボックスへ直接入力すれば未ログインでも機能することを確認した
// (tag:Python 猫で6348→1128件、title:猫 stocks:>10で52件、user:qiita created:>2024-01-01で
// 38件、といずれも絞り込みが効いた)。除外(-語)はPython 190753件→Python -Djangoで182061件、
// 完全一致("...")はmachine learning 7076件→"machine learning" 6437件と、いずれも
// 微減する形で効くことを確認(完全一致はスラップがあるためpartial扱い)。
// title:は個々の語ごとに付けて安全側に倒す(YouTubeのintitle:と同じ方式)。
// ストックのみ/質問タブの購読のみはログイン必須でパラメータ名を確認できず、別issueへ

function titleScopedTokens(state: { terms: string[]; exactPhrase: string[] }): Token[] {
  return [
    ...andTerms(state).map((t) => tok(`title:${quoteIfPhrase(t)}`, 'keywords', 'titleOnly')),
    ...exactPhrases(state).map((p) =>
      tok(`title:"${stripQuerySyntax(p)}"`, 'exactPhrase', 'titleOnly'),
    ),
  ]
}

function buildParts(state: QueryState): UrlPart[] | null {
  const toks: Token[] = [
    ...(state.titleOnly ? titleScopedTokens(state) : quotedTermTokens(state)),
    ...minusExcludeTokens(state),
  ]
  const handle = stripAt(state.fromUser)
  if (handle) toks.push(tok(`user:${handle}`, 'fromUser'))
  toks.push(...words(state.hashtag).map((w) => tok(`tag:${stripHash(w)}`, 'hashtag')))
  if (state.minStocks.trim()) toks.push(tok(`stocks:>=${state.minStocks.trim()}`, 'minStocks'))
  if (state.since && state.until) toks.push(tok(`created:${state.since}..${state.until}`, 'period'))
  else if (state.since) toks.push(tok(`created:>=${state.since}`, 'period'))
  else if (state.until) toks.push(tok(`created:<=${state.until}`, 'period'))
  if (toks.length === 0) return null

  const base =
    state.resultType === 'questions' ? part('question-search', 'resultType') : lit('search')
  const params = new ParamParts()
  const sortVal = { new: 'created', top: 'stock' }[state.sort as 'new' | 'top']
  if (sortVal) params.set('sort', sortVal, 'sortOrder')

  return [lit('https://qiita.com/'), base, lit('?q='), ...encodeTokens(toks), ...params.parts('&')]
}

// 逆翻訳: qiita.com/search?q=… と /question-search?q=…。tag:/user:/title:/stocks:/created:を
// 読む。titleOnlyは個々のtitle:トークンのどれか1つでもあれば全体をタイトル検索と見なす
function parseUrl(url: URL): ParsedSearch | null {
  if (!hostIs(url, 'qiita.com')) return null
  const segs = pathSegments(url)
  if (segs[0] !== 'search' && segs[0] !== 'question-search') return null
  const q = url.searchParams.get('q')
  if (!q) return null

  const patch: Partial<QueryState> = {}
  const ignored: string[] = []
  const bins = emptyBins()
  let titleOnly = false

  for (const token of tokenize(q)) {
    if (token.startsWith('title:')) {
      titleOnly = true
      const v = token.slice('title:'.length)
      if (v.startsWith('"')) bins.phrases.push(unquote(v))
      else if (v) bins.terms.push(v)
    } else if (token.startsWith('user:')) patch.fromUser = token.slice('user:'.length)
    else if (token.startsWith('tag:')) bins.hashtags.push(token.slice('tag:'.length))
    else if (token.startsWith('stocks:')) {
      const m = token.slice('stocks:'.length).match(/^>=?(\d+)$/)
      if (m) patch.minStocks = m[1]
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
  if (titleOnly) patch.titleOnly = true
  if (segs[0] === 'question-search') patch.resultType = 'questions'

  const sort = url.searchParams.get('sort')
  if (sort === 'created') patch.sort = 'new'
  else if (sort === 'stock') patch.sort = 'top'
  else if (sort !== null && sort !== 'rel') ignored.push(`sort=${sort}`)

  leftoverParams(url, new Set(['q', 'sort']), ignored)
  return { patch, ignored }
}

function dynamicSupport(state: QueryState): Partial<Record<ConceptId, ConceptSupport>> {
  const overrides: Partial<Record<ConceptId, ConceptSupport>> =
    state.resultType && state.resultType !== 'questions'
      ? { resultType: { level: 'none', noteKey: 'note.resultType.otherSite' } }
      : {}
  // title:はキーワード・完全一致の語にしか付かない(タグだけの検索では送る対象が無い)
  if (state.titleOnly && andTerms(state).length === 0 && exactPhrases(state).length === 0) {
    overrides.titleOnly = { level: 'none', noteKey: 'note.titleOnly.needsWords' }
  }
  return { ...overrides, ...limitSort(state.sort, ['new', 'top'], 'note.sortOrder.otherSite') }
}

export const qiita: PlatformDef = {
  id: 'qiita',
  name: 'Qiita',
  group: 'text',
  brandColor: '#55C500',
  requiresLogin: false,
  support: {
    keywords: { level: 'full' },
    exactPhrase: { level: 'partial', noteKey: 'note.exact.unreliable' },
    exclude: { level: 'full' },
    titleOnly: { level: 'full' },
    fromUser: { level: 'full' },
    hashtag: { level: 'full' },
    minStocks: { level: 'full' },
    period: { level: 'full' },
    resultType: { level: 'full' },
    sortOrder: { level: 'full' },
  },
  buildParts,
  parseUrl,
  dynamicSupport,
}
