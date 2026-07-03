import type { PlatformDef, QueryState } from '../types'
import { andTerms, quoteIfPhrase, stripHash, words } from '../text'

// 出典: docs/operator-research.md(2026-07-03調査、件数比較で実測)
// イラストは seiga.nicovideo.jp/search/{query}?target=illust_all(キーワード)と
// /tag/{タグ}(タグ一致)。AND(スペース)・除外(-)・OR が実測で効く。
// 並び順は sort=image_created(新着)/image_view(閲覧数順=人気の代用)。
// マンガは別ドメイン manga.nicovideo.jp/search?q= で、並び順の指定方法は未確認のため送らない。
function buildUrl(state: QueryState): string | null {
  const textParts = [...andTerms(state).map(quoteIfPhrase)]
  if (state.exactPhrase.trim()) textParts.push(`"${state.exactPhrase.trim()}"`)
  const tagNames = words(state.hashtag).map(stripHash)
  const excludes = words(state.exclude).map((w) => `-${w}`)

  // マンガはニコニコ漫画の検索へ。タグもキーワードに畳み込む
  if (state.workType === 'manga') {
    const parts = [...textParts, ...tagNames, ...excludes]
    if (textParts.length === 0 && tagNames.length === 0) return null
    return `https://manga.nicovideo.jp/search?q=${encodeURIComponent(parts.join(' '))}`
  }

  const params = new URLSearchParams()
  // image_created=投稿の新しい順、image_view=閲覧数順(人気の代用)。
  // おまかせは指定しない(サイト既定はコメントの新しい順)
  if (state.sort === 'new') params.set('sort', 'image_created')
  else if (state.sort === 'top') params.set('sort', 'image_view')
  const qs = params.toString()
  const query = qs ? `?${qs}` : ''

  // タグ単独(1つ)ならタグ一致検索。併用時はキーワードに畳み込む
  if (tagNames.length === 1 && textParts.length === 0 && excludes.length === 0) {
    return `https://seiga.nicovideo.jp/tag/${encodeURIComponent(tagNames[0])}${query}`
  }

  const parts = [...textParts, ...tagNames, ...excludes]
  if (textParts.length === 0 && tagNames.length === 0) return null
  return `https://seiga.nicovideo.jp/search/${encodeURIComponent(parts.join(' '))}?target=illust_all${qs ? `&${qs}` : ''}`
}

export const seiga: PlatformDef = {
  id: 'seiga',
  name: 'ニコニコ静画',
  group: 'image',
  // 静画のシンボル(テレビちゃんの頭の双葉)の緑。favicon実測は#33FF00だが、
  // ボタン背景に使うためやや暗めて可読性を確保する
  brandColor: '#2FBF00',
  requiresLogin: false,
  googleSite: 'seiga.nicovideo.jp',
  support: {
    keywords: { level: 'full' },
    exactPhrase: { level: 'partial', noteKey: 'note.exact.unreliable' },
    exclude: { level: 'full' },
    hashtag: { level: 'full', noteKey: 'note.tagPage.combined' },
    workType: { level: 'full' },
    mediaOnly: { level: 'none', noteKey: 'note.imageOnly' },
    japaneseOnly: { level: 'none', noteKey: 'note.jaOnly.service' },
    sortOrder: { level: 'partial', noteKey: 'note.seiga.sort' },
  },
  buildUrl,
}
