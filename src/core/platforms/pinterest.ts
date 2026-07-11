import type { ConceptId, ConceptSupport, ParsedSearch, PlatformDef, QueryState, UrlPart } from '../types'
import { andTerms, words } from '../text'
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
  // 完全一致は引用符が効かず(実機確認)ゆるい一致に化けるだけなので送らない(非対応)
  const toks: Token[] = andTerms(state).map((t) => tok(t, 'keywords'))
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
  support: {
    keywords: { level: 'partial', noteKey: 'note.loose.and' },
    exactPhrase: { level: 'none', noteKey: 'note.exactPhrase.dropped' },
    exclude: { level: 'none', noteKey: 'note.exclude.literal' },
    resultType: { level: 'full' },
    sortOrder: { level: 'none', noteKey: 'note.nosort' },
  },
  buildParts,
  parseUrl,
  dynamicSupport,
}
