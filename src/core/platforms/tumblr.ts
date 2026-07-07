import type { ConceptId, ConceptSupport, PlatformDef, QueryState } from '../types'
import { limitSort } from '../types'
import { andTerms, exactPhrases, stripHash, words } from '../text'

// 出典: 2026-07-07 実機確認(未ログイン)。tumblr.com/search/{q}=コンテンツ検索(既定=人気順)、
// /search/{q}/recent=最新順。単一タグは /tagged/{タグ}(人気順のみ。旧 /chrono は廃止され
// /explore/trending へ飛ぶ=タグページの並び替えはボタンのみでURL化できない)。
// ブール演算子(除外・引用符)は無く、キーワードはゆるい一致。タグは1つだけURLで指定できる。
function buildUrl(state: QueryState): string | null {
  // 引用符構文が無いため、語も語句もそのままキーワードとして埋め込む(ゆるい一致)
  const textParts = [...andTerms(state), ...exactPhrases(state)]
  const tagNames = words(state.hashtag).map(stripHash)

  // 単一タグのみ(キーワードなし)ならタグページ。並び順はURLで指定できない(人気順固定)
  if (textParts.length === 0 && tagNames.length === 1) {
    return `https://www.tumblr.com/tagged/${encodeURIComponent(tagNames[0])}`
  }

  // それ以外はコンテンツ検索へまとめる(複数タグ・タグ+キーワードもここへ畳む)
  const parts = [...textParts, ...tagNames]
  if (parts.length === 0) return null
  const path = encodeURIComponent(parts.join(' '))
  // 最新順だけ /recent を付ける。人気順(既定)・おまかせは何も付けない
  const suffix = state.sort === 'new' ? '/recent' : ''
  return `https://www.tumblr.com/search/${path}${suffix}`
}

export const tumblr: PlatformDef = {
  id: 'tumblr',
  name: 'Tumblr',
  group: 'sns',
  brandColor: '#36465D',
  requiresLogin: false,
  googleSite: 'tumblr.com',
  support: {
    keywords: { level: 'partial', noteKey: 'note.loose.and' },
    exactPhrase: { level: 'partial', noteKey: 'note.loose.exact' },
    hashtag: { level: 'full', noteKey: 'note.tagPage.combined' },
    sortOrder: { level: 'full' },
  },
  buildUrl,
  dynamicSupport: (state) => {
    const overrides: Partial<Record<ConceptId, ConceptSupport>> = {
      // 新着/人気以外(急上昇)は無いので落とす
      ...limitSort(state.sort, ['new', 'top'], 'note.sortOrder.otherSite'),
    }
    // タグページ(単一タグ・キーワードなし)は並び順をURLで指定できない(人気順固定)ので落とす
    const textParts = [...andTerms(state), ...exactPhrases(state)]
    const tagNames = words(state.hashtag).map(stripHash)
    if (textParts.length === 0 && tagNames.length === 1) {
      overrides.sortOrder = { level: 'none', noteKey: 'note.tumblr.tagSort' }
    }
    return overrides
  },
}
