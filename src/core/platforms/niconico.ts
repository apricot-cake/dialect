import type { PlatformDef, QueryState } from '../types'
import { limitSort } from '../types'
import { minusExcludes, quotedTerms, stripHash, words } from '../text'

// 出典: docs/operator-research.md(2026-07-02追加調査、27パターン実測済み)
// ログイン不要。AND/完全一致/除外(-)/任意期間(start=/end=)/新着順が全てURLで効く。
// デフォルトソートはABテストで変わり得るため sort は常に明示する。
// タグ単独なら /tag/(タグ一致検索)、ことばと併用時はキーワード検索に畳み込む。
function buildUrl(state: QueryState): string | null {
  const textParts = quotedTerms(state)
  const tagNames = words(state.hashtag).map(stripHash)
  const excludes = minusExcludes(state)

  const params = new URLSearchParams()
  // sort=f&order=d=投稿が新しい順、sort=h=人気(注目度)順。
  // おまかせは指定しない(デフォルトソートはABテスト依存でサイト任せになる)
  if (state.sort === 'new') {
    params.set('sort', 'f')
    params.set('order', 'd')
  } else if (state.sort === 'top') {
    params.set('sort', 'h')
  }
  if (state.since) params.set('start', state.since)
  if (state.until) params.set('end', state.until)
  // 「ふつう(4〜20分)」に相当する値はniconicoに存在しないため指定しない
  if (state.videoLength === 'short') params.set('l_range', '1')
  if (state.videoLength === 'long') params.set('l_range', '2')
  // ジャンル。/search・/tag の両方で有効(2026-07-06 実測: ゲーム2万≪音楽29万<無し38万)
  if (state.genre) params.set('genre', state.genre)
  const qs = params.toString()
  const query = qs ? `?${qs}` : ''

  // タグ単独(+除外)ならタグ検索。除外はタグページでも有効(実測)
  if (tagNames.length > 0 && textParts.length === 0) {
    const path = [...tagNames, ...excludes].join(' ')
    return `https://www.nicovideo.jp/tag/${encodeURIComponent(path)}${query}`
  }

  // 除外語は正の条件に数えない。キーワード/完全一致/タグが空で除外だけの入力では
  // 検索として成立しない(「足す=絞る」原則。他サイトと揃える)
  const positive = [...textParts, ...tagNames]
  if (positive.length === 0) return null
  const parts = [...positive, ...excludes]

  return `https://www.nicovideo.jp/search/${encodeURIComponent(parts.join(' '))}${query}`
}

export const niconico: PlatformDef = {
  id: 'niconico',
  name: 'niconico',
  group: 'video',
  brandColor: '#252525',
  requiresLogin: false,
  googleSite: 'nicovideo.jp',
  support: {
    keywords: { level: 'full' },
    exactPhrase: { level: 'full' },
    exclude: { level: 'full' },
    fromUser: { level: 'none' },
    hashtag: { level: 'full', noteKey: 'note.tagPage.combined' },
    period: { level: 'full' },
    mediaOnly: { level: 'none', noteKey: 'note.videoOnly' },
    videoLength: { level: 'partial', noteKey: 'note.niconico.videoLength' },
    genre: { level: 'full' },
    sortOrder: { level: 'full' },
  },
  buildUrl,
  // 「ふつう(4〜20分)」に当たる値は niconico に無く l_range で送れない(buildUrl も出さない)。
  // その値のときだけ「使えない」に落とし、プレビュー・完全度ドット・ホバーで正直に表す。
  // short/long は l_range=1/2 で実際に送れるので partial のまま
  dynamicSupport: (state) => ({
    ...limitSort(state.sort, ['new', 'top'], 'note.sortOrder.otherSite'),
    ...(state.videoLength === 'medium'
      ? { videoLength: { level: 'none', noteKey: 'note.niconico.videoLength' } }
      : {}),
  }),
}
