import type { ConceptId, ConceptSupport, ParsedSearch, PlatformDef, QueryState } from '../types'
import { andTerms, exactPhrases, stripHash, words } from '../text'
import { hostMatches, leftoverParams, pathSegments, tokenize } from '../parse'

// 出典: docs/operator-research.md(2026-07-02追加調査)
// 検索・タグページともログイン必須(未ログインは即ログイン画面)。演算子は実質ゼロ。
// タグ単独ならタグページ(人気投稿のみ)、それ以外はキーワードSERP。
function buildUrl(state: QueryState): string | null {
  // 完全一致は近似のキーワード扱い
  const textParts = [...andTerms(state)]
  textParts.push(...exactPhrases(state))
  const tagNames = words(state.hashtag).map(stripHash)

  if (tagNames.length === 1 && textParts.length === 0) {
    return `https://www.instagram.com/explore/tags/${encodeURIComponent(tagNames[0])}/`
  }

  const parts = [...textParts, ...tagNames.map((t) => `#${t}`)]
  if (parts.length === 0) return null

  return `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(parts.join(' '))}`
}

// タグ1つならタグページ(厳密)だが、2つ以上はキーワードSERPに落ちてAND保証がなくなる
function dynamicSupport(
  state: QueryState,
): Partial<Record<ConceptId, ConceptSupport>> {
  if (words(state.hashtag).length > 1) {
    return { hashtag: { level: 'partial', noteKey: 'note.instagram.multiTag' } }
  }
  return {}
}

// 逆翻訳: /explore/search/keyword/?q=… と /explore/tags/{tag}/
function parseUrl(url: URL): ParsedSearch | null {
  if (!hostMatches(url, 'instagram.com')) return null
  const segs = pathSegments(url)
  const patch: Partial<QueryState> = {}
  const ignored: string[] = []

  if (segs[0] === 'explore' && segs[1] === 'tags' && segs[2]) {
    patch.hashtag = segs[2]
    leftoverParams(url, new Set(), ignored)
    return { patch, ignored }
  }
  if (segs[0] !== 'explore' || segs[1] !== 'search' || segs[2] !== 'keyword') return null
  const q = url.searchParams.get('q')
  if (!q) return null
  const terms: string[] = []
  const hashtags: string[] = []
  for (const token of tokenize(q)) {
    if (token.startsWith('#') && token.length > 1) hashtags.push(token.slice(1))
    else terms.push(token)
  }
  if (terms.length > 0) patch.terms = terms
  if (hashtags.length > 0) patch.hashtag = hashtags.join(' ')
  leftoverParams(url, new Set(['q']), ignored)
  return { patch, ignored }
}

export const instagram: PlatformDef = {
  id: 'instagram',
  name: 'Instagram',
  group: 'sns',
  // グラデーションの代表色はsimple-iconsの公式値(現行ブランドのピンク)を使う
  brandColor: '#FF0069',
  requiresLogin: true,
  googleSite: 'instagram.com',
  support: {
    keywords: { level: 'partial', noteKey: 'note.loose.and' },
    exactPhrase: { level: 'partial', noteKey: 'note.loose.exact' },
    exclude: { level: 'none' },
    fromUser: { level: 'none' },
    hashtag: { level: 'full', noteKey: 'note.instagram.hashtag' },
    period: { level: 'none' },
    mediaOnly: { level: 'none' },
    sortOrder: { level: 'none', noteKey: 'note.nosort' },
  },
  buildUrl,
  parseUrl,
  dynamicSupport,
}
