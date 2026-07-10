import type { ConceptId, ConceptSupport, ParsedSearch, PlatformDef, QueryState } from '../types'
import { andTerms, exactPhrases, words } from '../text'
import { hostMatches, leftoverParams, pathSegments } from '../parse'

// 出典: 2026-07-08 実機確認(未ログイン、GUI操作)。pinterest.com/search/pins/?q= はログイン不要。
// フィルターパネル(調整アイコン)には「すべてのピン/動画/ボード/プロフィール」の4択のみで、
// 期間・並び順・送信者・ハッシュタグの絞り込みは無い。選ぶとパスが
// /search/{pins|videos|boards|users}/ に切り替わる(実機確認)。
// 検索は関連度ベースのゆるい一致(公式のBoolean演算子は無い)。
// `-語`(除外)を試したところ、Pinterest自身が「"猫 -犬"の検索結果です。"猫 -犬"で検索し
// 直しますか?」と表示し、`-`をそのまま検索語の一部として扱う(除外にならない)ことを実機確認。
function buildUrl(state: QueryState): string | null {
  const terms = [...andTerms(state), ...exactPhrases(state)]
  if (terms.length === 0) return null
  const q = encodeURIComponent(terms.join(' '))
  const path =
    state.resultType === 'video' ? 'videos'
    : state.resultType === 'board' ? 'boards'
    : state.resultType === 'people' ? 'users'
    : 'pins'
  return `https://www.pinterest.com/search/${path}/?q=${q}`
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
  buildUrl,
  parseUrl,
  dynamicSupport,
}
