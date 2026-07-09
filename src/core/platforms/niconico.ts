import type { PlatformDef, QueryState, SortOrder } from '../types'
import { limitSort } from '../types'
import { minusExcludes, quotedTerms, stripHash, words } from '../text'

// 出典: docs/operator-research.md(2026-07-02追加調査27パターン+2026-07-09ログイン済みGUI操作)
// ログイン不要。AND/完全一致/除外(-)/任意期間(start=/end=)/並び順が全てURLで効く。
// デフォルトソートはABテスト+アカウント永続で変わり得るため sort は常に明示する。
// タグ単独なら /tag/(タグ一致検索)、ことばと併用時はキーワード検索に畳み込む。
//
// 並び順は 2026-07-09 に検索フォームのドロップダウンをGUI操作で採取した現行形式
// sort=<名前>&order=desc に揃える(旧 sort=f&order=d / sort=h も有効なエイリアスだが、
// 実プロダクトが今生成するのはこの形)。top=再生数(viewCount)は bilibili の
// top=click(最多播放)と同じ「動画サイトの人気=再生数」の扱い。ニコニコで人気
// (hotLikeAndMylist)はサイト既定なので指定なし(auto)が事実上これに当たる。
const SORT_PARAM: Partial<Record<SortOrder, string>> = {
  new: 'registeredAt', // 投稿日時
  top: 'viewCount', // 再生数
  comments: 'commentCount', // コメント数
  likes: 'likeCount', // いいね！数
  favorites: 'mylistCount', // マイリスト登録数
  commentDate: 'lastCommentTime', // コメント日時(直近にコメントが付いた順、2026-07-09 GUI採取)
}

function buildUrl(state: QueryState): string | null {
  const textParts = quotedTerms(state)
  const tagNames = words(state.hashtag).map(stripHash)
  const excludes = minusExcludes(state)

  const params = new URLSearchParams()
  // 指定なし(auto)は何も送らない(既定の並び=ニコニコで人気/永続状態にサイト任せ)
  const sortVal = SORT_PARAM[state.sort]
  if (sortVal) {
    params.set('sort', sortVal)
    params.set('order', 'desc')
  }
  if (state.since) params.set('start', state.since)
  if (state.until) params.set('end', state.until)
  // 「ふつう(4〜20分)」に相当する値はniconicoに存在しないため指定しない
  if (state.videoLength === 'short') params.set('l_range', '1')
  if (state.videoLength === 'long') params.set('l_range', '2')
  // ジャンル。/search・/tag の両方で有効(2026-07-06 実測: ゲーム2万≪音楽29万<無し38万)
  if (state.genre) params.set('genre', state.genre)
  // 動画種別(kind=user:ユーザー投稿 / channel:公式チャンネル)。2026-07-09 GUI採取
  if (state.nicoKind) params.set('kind', state.nicoKind)
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
    nicoKind: { level: 'full' },
    sortOrder: { level: 'full' },
  },
  buildUrl,
  // 「ふつう(4〜20分)」に当たる値は niconico に無く l_range で送れない(buildUrl も出さない)。
  // その値のときだけ「使えない」に落とし、プレビュー・完全度ドット・ホバーで正直に表す。
  // short/long は l_range=1/2 で実際に送れるので partial のまま
  dynamicSupport: (state) => ({
    ...limitSort(
      state.sort,
      ['new', 'top', 'comments', 'likes', 'favorites', 'commentDate'],
      'note.sortOrder.otherSite',
    ),
    ...(state.videoLength === 'medium'
      ? { videoLength: { level: 'none', noteKey: 'note.niconico.videoLength' } }
      : {}),
  }),
}
