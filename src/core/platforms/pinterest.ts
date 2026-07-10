import type { ConceptId, ConceptSupport, ParsedSearch, PlatformDef, QueryState, UrlPart } from '../types'
import { andTerms, exactPhrases, words } from '../text'
import { encodeTokens, lit, part, tok, type Token } from '../urlParts'
import { hostMatches, leftoverParams, pathSegments } from '../parse'

// 出典: 2026-07-08 実機確認(未ログイン、GUI操作)。pinterest.com/search/pins/?q= はログイン不要。
// フィルターパネル(調整アイコン)には「すべてのピン/動画/ボード/プロフィール」の4択のみで、
// 期間・並び順・送信者・ハッシュタグの絞り込みは無い。選ぶとパスが
// /search/{pins|videos|boards|users}/ に切り替わる(実機確認)。
// 検索は関連度ベースのゆるい一致(公式のBoolean演算子は無い)。
// `-語`(除外)を試したところ、Pinterest自身が「"猫 -犬"の検索結果です。"猫 -犬"で検索し
// 直しますか?」と表示し、`-`をそのまま検索語の一部として扱う(除外にならない)ことを実機確認。
function buildParts(state: QueryState): UrlPart[] | null {
  // 引用符構文がないため、完全一致の語句もそのままキーワードとして埋め込む(ゆるい一致)
  const toks: Token[] = [
    ...andTerms(state).map((t) => tok(t, 'keywords')),
    ...exactPhrases(state).map((p) => tok(p, 'exactPhrase')),
  ]
  if (toks.length === 0) return null
  // フィルターの4択はパスの切り替え。既定(すべてのピン=pins)は無帰属
  const path =
    state.resultType === 'video' ? part('videos', 'resultType')
    : state.resultType === 'board' ? part('boards', 'resultType')
    : state.resultType === 'people' ? part('users', 'resultType')
    : lit('pins')
  return [
    lit('https://www.pinterest.com/search/'),
    path,
    lit('/?q='),
    ...encodeTokens(toks),
  ]
}

// 逆翻訳: /search/{pins|videos|boards|users}/?q=…。日本の pinterest.jp も受ける
const SEARCH_PATH_RESULT_TYPE: Record<string, QueryState['resultType']> = {
  pins: '',
  videos: 'video',
  boards: 'board',
  users: 'people',
}

function parseUrl(url: URL): ParsedSearch | null {
  if (!hostMatches(url, 'pinterest.com', 'pinterest.jp')) return null
  const segs = pathSegments(url)
  if (segs[0] !== 'search' || !(segs[1] in SEARCH_PATH_RESULT_TYPE)) return null
  const q = url.searchParams.get('q')
  if (!q) return null

  const patch: Partial<QueryState> = {}
  const ignored: string[] = []
  if (SEARCH_PATH_RESULT_TYPE[segs[1]]) patch.resultType = SEARCH_PATH_RESULT_TYPE[segs[1]]
  const terms = words(q)
  if (terms.length > 0) patch.terms = terms
  leftoverParams(url, new Set(['q']), ignored)
  return { patch, ignored }
}

const PINTEREST_RESULT_TYPES: ReadonlySet<string> = new Set(['video', 'board', 'people'])

function dynamicSupport(
  state: QueryState,
): Partial<Record<ConceptId, ConceptSupport>> {
  if (state.resultType && !PINTEREST_RESULT_TYPES.has(state.resultType)) {
    return { resultType: { level: 'none', noteKey: 'note.resultType.otherSite' } }
  }
  return {}
}

export const pinterest: PlatformDef = {
  id: 'pinterest',
  name: 'Pinterest',
  group: 'image',
  brandColor: '#E60023',
  requiresLogin: false,
  googleSite: 'pinterest.com',
  support: {
    keywords: { level: 'partial', noteKey: 'note.loose.and' },
    exactPhrase: { level: 'partial', noteKey: 'note.loose.exact' },
    exclude: { level: 'none', noteKey: 'note.exclude.literal' },
    resultType: { level: 'full' },
    sortOrder: { level: 'none', noteKey: 'note.nosort' },
  },
  buildParts,
  parseUrl,
  dynamicSupport,
}
