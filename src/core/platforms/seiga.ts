import type { ConceptId, ConceptSupport, PlatformDef, QueryState } from '../types'
import { limitSort } from '../types'
import { minusExcludes, quotedTerms, stripHash, words } from '../text'

// 出典: docs/operator-research.md + 2026-07-07 実機再確認(件数比較)。ログイン不要。
// イラストは seiga.nicovideo.jp/search/{クエリ}?target=illust、タグ単独は /tag/{タグ}。
// マンガは manga.nicovideo.jp/search?q=(別エンジン。target=manga はここへリダイレクトされる)。
// スペースAND・除外(-語)・完全一致("…")は両エンジンで実測(件数が整合)。
// 並び順はイラストのみ: image_created(新着)/image_view(閲覧数=人気の代用)。既定は
// comment_created(コメント新着)なので、新着順・人気順は必ず明示する。
// マンガは並び順パラメータを送ると結果集合が変わる癖があるため送らない(既定=関連度)。
function buildUrl(state: QueryState): string | null {
  const textParts = quotedTerms(state)
  const tagNames = words(state.hashtag).map(stripHash)
  const excludes = minusExcludes(state)

  // マンガ(ニコニコ漫画)。別ドメイン・別エンジンで、並び順は送らない
  if (state.workType === 'manga') {
    const positive = [...textParts, ...tagNames]
    if (positive.length === 0) return null
    const params = new URLSearchParams()
    params.set('q', [...positive, ...excludes].join(' '))
    return `https://manga.nicovideo.jp/search?${params.toString()}`
  }

  // イラスト(既定)。target=illust を明示し、新着/閲覧数のときだけ sort を送る
  const params = new URLSearchParams()
  params.set('target', 'illust')
  if (state.sort === 'new') params.set('sort', 'image_created')
  else if (state.sort === 'top') params.set('sort', 'image_view')
  const qs = `?${params.toString()}`

  // タグ単独(+除外)ならタグ一致検索。除外・並び順はタグページでも有効(実測)
  if (tagNames.length > 0 && textParts.length === 0) {
    const path = [...tagNames, ...excludes].join(' ')
    return `https://seiga.nicovideo.jp/tag/${encodeURIComponent(path)}${qs}`
  }

  // 除外語は正の条件に数えない(「足す=絞る」原則。他サイトと揃える)
  const positive = [...textParts, ...tagNames]
  if (positive.length === 0) return null
  const parts = [...positive, ...excludes]
  return `https://seiga.nicovideo.jp/search/${encodeURIComponent(parts.join(' '))}${qs}`
}

export const seiga: PlatformDef = {
  id: 'seiga',
  name: 'ニコニコ静画',
  group: 'image',
  brandColor: '#252525',
  requiresLogin: false,
  googleSite: 'seiga.nicovideo.jp',
  support: {
    keywords: { level: 'full' },
    exactPhrase: { level: 'full' },
    exclude: { level: 'full' },
    hashtag: { level: 'full', noteKey: 'note.tagPage.combined' },
    // イラスト(target=illust)とマンガ(manga.nicovideo.jp)を切り替える。
    // うごくイラスト・小説は静画にないので、その値のとき dynamicSupport で落とす
    workType: { level: 'full' },
    mediaOnly: { level: 'none', noteKey: 'note.imageOnly' },
    sortOrder: { level: 'full' },
  },
  buildUrl,
  dynamicSupport: (state) => {
    const overrides: Partial<Record<ConceptId, ConceptSupport>> = {
      // 新着/閲覧数以外(急上昇)は静画に無いので落とす
      ...limitSort(state.sort, ['new', 'top'], 'note.sortOrder.otherSite'),
    }
    // 静画にはイラストとマンガしかない。うごく・小説は「使えない」に落として正直に
    if (state.workType === 'ugoira' || state.workType === 'novel') {
      overrides.workType = { level: 'none', noteKey: 'note.seiga.workType' }
    }
    // マンガは別エンジンで並び順を送ると結果集合が変わるため、そのときは並び順を落とす
    if (state.workType === 'manga') {
      overrides.sortOrder = { level: 'none', noteKey: 'note.seiga.mangaSort' }
    }
    return overrides
  },
}
