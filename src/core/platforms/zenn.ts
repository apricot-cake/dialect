import type {
  ConceptId,
  ConceptSupport,
  ParsedSearch,
  PlatformDef,
  QueryState,
  ResultType,
  UrlPart,
} from '../types'
import { limitSort } from '../types'
import { andTerms } from '../text'
import { encodeTokens, lit, ParamParts, tok } from '../urlParts'
import { hostIs, leftoverParams, pathSegments, tokenize } from '../parse'

// 出典: 2026-07-12にGUI操作で実測(issue #55、zenn.dev/search の各リンク・タブを実操作)。
// 詳細は docs/operator-research.md の「GitHub / Qiita / Zenn 調査」節を参照。
// 除外(-語)は「Python」単独5939件に対し「Python -Django」が全カテゴリ0件になったことから
// 非対応と確定(除外が効くなら微減するはずが全滅した)。完全一致(引用符)は未確認のため
// 実装しない。探す種類は5値(articles/books/scraps/users/publications)で、
// 検索語によって0件のタブが表示されないだけで実際は常に存在する
// (「猫」では見えなかったBooks/Publicationsを「Python」で再検証し発見)
const RESULT_TYPE_SOURCE: Partial<Record<ResultType, string>> = {
  books: 'books',
  scraps: 'scraps',
  people: 'users',
  publications: 'publications',
}
const SOURCE_RESULT_TYPE: Record<string, ResultType> = Object.fromEntries(
  Object.entries(RESULT_TYPE_SOURCE).map(([rt, source]) => [source, rt as ResultType]),
)
const ZENN_RESULT_TYPES: ReadonlySet<ResultType> = new Set([
  '',
  'books',
  'scraps',
  'people',
  'publications',
])

const SORT_ORDER: Partial<Record<QueryState['sort'], string>> = {
  new: 'latest',
  top: 'alltime',
  hot: 'daily',
}
const ORDER_SORT: Record<string, QueryState['sort']> = {
  latest: 'new',
  alltime: 'top',
  daily: 'hot',
}

function buildParts(state: QueryState): UrlPart[] | null {
  const toks = andTerms(state).map((t) => tok(t, 'keywords'))
  if (toks.length === 0) return null

  const params = new ParamParts()
  if (state.semanticSearch) params.set('mode', 'semantic', 'semanticSearch')
  const source = RESULT_TYPE_SOURCE[state.resultType]
  if (source) params.set('source', source, 'resultType')
  const order = SORT_ORDER[state.sort]
  if (order) params.set('order', order, 'sortOrder')

  return [lit('https://zenn.dev/search?q='), ...encodeTokens(toks), ...params.parts('&')]
}

// 逆翻訳: zenn.dev/search?q=…&mode=semantic&source=…&order=…。
// 除外・完全一致は非対応のため、tokenizeした語はすべて通常のキーワードとして読む
function parseUrl(url: URL): ParsedSearch | null {
  if (!hostIs(url, 'zenn.dev')) return null
  if (pathSegments(url)[0] !== 'search') return null
  const q = url.searchParams.get('q')
  if (!q) return null

  const patch: Partial<QueryState> = {}
  const ignored: string[] = []
  const terms = tokenize(q)
  if (terms.length > 0) patch.terms = terms

  const mode = url.searchParams.get('mode')
  if (mode === 'semantic') patch.semanticSearch = true
  else if (mode !== null) ignored.push(`mode=${mode}`)

  const source = url.searchParams.get('source')
  if (source !== null) {
    if (source === 'articles') {
      // 既定値。無帰属
    } else {
      const rt = SOURCE_RESULT_TYPE[source]
      if (rt) patch.resultType = rt
      else ignored.push(`source=${source}`)
    }
  }

  const order = url.searchParams.get('order')
  if (order !== null) {
    const sort = ORDER_SORT[order]
    if (sort) patch.sort = sort
    else ignored.push(`order=${order}`)
  }

  leftoverParams(url, new Set(['q', 'mode', 'source', 'order', 'page']), ignored)
  return { patch, ignored }
}

function dynamicSupport(state: QueryState): Partial<Record<ConceptId, ConceptSupport>> {
  const overrides: Partial<Record<ConceptId, ConceptSupport>> =
    state.resultType && !ZENN_RESULT_TYPES.has(state.resultType)
      ? { resultType: { level: 'none', noteKey: 'note.resultType.otherSite' } }
      : {}
  return {
    ...overrides,
    ...limitSort(state.sort, ['new', 'top', 'hot'], 'note.sortOrder.otherSite'),
  }
}

export const zenn: PlatformDef = {
  id: 'zenn',
  name: 'Zenn',
  group: 'text',
  brandColor: '#3EA8FF',
  requiresLogin: false,
  support: {
    keywords: { level: 'full' },
    exactPhrase: { level: 'none', noteKey: 'note.exactPhrase.dropped' },
    exclude: { level: 'none', noteKey: 'note.zenn.exclude' },
    resultType: { level: 'full' },
    sortOrder: { level: 'full' },
    semanticSearch: { level: 'full' },
  },
  buildParts,
  parseUrl,
  dynamicSupport,
}
