import type {
  ConceptId,
  ConceptSupport,
  ParsedSearch,
  PlatformDef,
  QueryState,
  SortOrder,
  UrlPart,
} from '../types'
import { limitSort, NICO_GENRES } from '../types'
import { stripHash, words } from '../text'
import {
  encodeTokens,
  lit,
  minusExcludeTokens,
  ParamParts,
  part,
  quotedTermTokens,
  tok,
} from '../urlParts'
import {
  applyBins,
  emptyBins,
  extractBareOrChain,
  hostIs,
  isIsoDate,
  leftoverParams,
  pathSegments,
  tokenize,
  unquote,
} from '../parse'

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

// シリーズ・マイリスト検索専用の並び順(2026-07-09 GUI操作で採取、シリーズ・マイリスト双方で
// 同一パラメータ名と確認済み)。既定「ニコニコで人気」は明示選択でも sort=_hotTotalScore という
// 特殊値を送るだけで無指定時の既定と一致するため、動画側の「ニコニコで人気」と同様に
// 指定なし(auto=無送信)へ畳み込む。newは「作成日」に流用(投稿日時を新しい順に見る動画のnewと
// 同型)、videoCountは収録動画数、videoAddedは動画が最後に追加された日時
const SERIES_SORT_PARAM: Partial<Record<SortOrder, string>> = {
  new: 'startTime',
  videoCount: 'videoCount',
  videoAdded: 'lastAddedTime',
}

// ユーザー検索専用の並び順(2026-07-09 GUI操作で採取)。既定「あなたへのおすすめ」は
// sort=_personalized というログイン依存の特殊値で、無指定時の既定と一致することを
// 未訪問のクエリで確認したためauto(無送信)へ畳み込む。videoCountはこのユーザーの
// 投稿動画数(シリーズ/マイリストの収録動画数と同じ「動画の数」という意味で概念を共用)
const PEOPLE_SORT_PARAM: Partial<Record<SortOrder, string>> = {
  videoCount: 'videoCount',
  followerCount: 'followerCount',
  liveCount: 'liveCount',
}

// 検索結果タブ「動画/ショート/シリーズ/マイリスト/ユーザー」のパス切り替え(2026-07-09 GUI採取)。
// 動画(既定・''値、明示的な'video'値も同じ)は /search/ のためここには含めない
const RESULT_TYPE_PATH: Partial<Record<QueryState['resultType'], string>> = {
  short: 'search_shorts',
  series: 'series_search',
  playlist: 'mylist_search',
  people: 'user_search',
}

// niconico が対応する値(他サイト専用のchannel/posts/…等はここに含めない)
const NICONICO_RESULT_TYPES: ReadonlySet<QueryState['resultType']> = new Set([
  '',
  'video',
  'short',
  'series',
  'playlist',
  'people',
])

// 動画と同じ検索基盤(ジャンル/動画種別/再生時間/期間/並び順=sort・order・genre・kind・
// l_range・start・end)を共有するのは動画本体(既定/明示'video')とショートのみ(2026-07-09 GUI操作:
// ショートのフィルタパネル・並び順ドロップダウンが動画と同じ選択肢・生成パラメータを持つことを確認)。
// シリーズ(登録動画数/作成日/動画追加日時)・マイリスト(同3値)・ユーザー(フォロワー数/
// 投稿動画数/生放送番組数)はそれぞれ専用の並び順を持ち、フィルタパネル自体が無い(GUI操作で確認)。
// 専用並び順は 2026-07-09 に SERIES_SORT_PARAM/PEOPLE_SORT_PARAM として実装
const VIDEO_LIKE_RESULT_TYPES: ReadonlySet<QueryState['resultType']> = new Set([
  '',
  'video',
  'short',
])

// シリーズ・マイリストは同一の並び順パラメータを共有する(2026-07-09 GUI操作で確認)
const SERIES_LIKE_RESULT_TYPES: ReadonlySet<QueryState['resultType']> = new Set([
  'series',
  'playlist',
])

function buildParts(state: QueryState): UrlPart[] | null {
  const textToks = quotedTermTokens(state)
  // スコープ限定OR(「このどれかを含む」)。括弧は使えない(リテラル扱いで検索が壊れる)ため
  // 並置文法(a OR b)にする。OR連鎖はスペースANDより強く結合するため、直後に続く通常の語との
  // ANDが自然に成立する(「猫 OR 犬 手芸」=(猫 OR 犬) AND 手芸。2026-07-11に
  // nicovideo.jpの検索ボックスをGUI操作で実測、issue #26)。1語は通常の語と同じ扱い
  const orWords = words(state.keywordsOr)
  const orToks =
    orWords.length >= 2
      ? [tok(orWords.join(' OR '), 'keywordsOr')]
      : orWords.map((w) => tok(w, 'keywordsOr'))
  const tagToks = words(state.hashtag).map((t) => tok(stripHash(t), 'hashtag'))
  const excludeToks = minusExcludeTokens(state)
  const isVideoLike = VIDEO_LIKE_RESULT_TYPES.has(state.resultType)
  const isSeriesLike = SERIES_LIKE_RESULT_TYPES.has(state.resultType)
  const isPeopleLike = state.resultType === 'people'

  const params = new ParamParts()
  if (isVideoLike) {
    // 指定なし(auto)は何も送らない(既定の並び=ニコニコで人気/永続状態にサイト任せ)
    const sortVal = SORT_PARAM[state.sort]
    if (sortVal) {
      params.set('sort', sortVal, 'sortOrder')
      params.set('order', 'desc', 'sortOrder')
    }
    if (state.since) params.set('start', state.since, 'period')
    if (state.until) params.set('end', state.until, 'period')
    // 「ふつう(4〜20分)」に相当する値はniconicoに存在しないため指定しない
    if (state.videoLength === 'short') params.set('l_range', '1', 'videoLength')
    if (state.videoLength === 'long') params.set('l_range', '2', 'videoLength')
    // ジャンル。/search・/tag の両方で有効(2026-07-06 実測: ゲーム2万≪音楽29万<無し38万)
    if (state.genre) params.set('genre', state.genre, 'genre')
    // 動画種別(kind=user:ユーザー投稿 / channel:公式チャンネル)。2026-07-09 GUI採取
    if (state.nicoKind) params.set('kind', state.nicoKind, 'nicoKind')
  } else if (isSeriesLike) {
    const sortVal = SERIES_SORT_PARAM[state.sort]
    if (sortVal) {
      params.set('sort', sortVal, 'sortOrder')
      params.set('order', 'desc', 'sortOrder')
    }
  } else if (isPeopleLike) {
    const sortVal = PEOPLE_SORT_PARAM[state.sort]
    if (sortVal) {
      params.set('sort', sortVal, 'sortOrder')
      params.set('order', 'desc', 'sortOrder')
    }
  }

  // タグ単独(+除外)ならタグ検索。動画(既定)のときだけ(シリーズ等にタグページは無い)。
  // OR指定があるときはタグの厳密一致ではなくキーワード検索が要るので対象外。除外はタグページでも有効(実測)
  if (
    state.resultType === '' &&
    tagToks.length > 0 &&
    textToks.length === 0 &&
    orToks.length === 0
  ) {
    return [
      lit('https://www.nicovideo.jp/tag/'),
      ...encodeTokens([...tagToks, ...excludeToks]),
      ...params.parts('?'),
    ]
  }

  // 除外語は正の条件に数えない。キーワード/完全一致/OR/タグが空で除外だけの入力では
  // 検索として成立しない(「足す=絞る」原則。他サイトと揃える)
  const positive = [...orToks, ...textToks, ...tagToks]
  if (positive.length === 0) return null

  // タブ切り替えのパスは「探すもの」の指定が生む断片(既定の /search/ は無帰属。
  // 他サイト専用の値で /search/ へ落ちたときも既定のままなので帰属させない=そのとき
  // resultType は dynamicSupport で「使えない」になっている)
  const basePath = RESULT_TYPE_PATH[state.resultType] ?? 'search'
  return [
    lit('https://www.nicovideo.jp/'),
    state.resultType && NICONICO_RESULT_TYPES.has(state.resultType)
      ? part(basePath, 'resultType')
      : lit(basePath),
    lit('/'),
    ...encodeTokens([...positive, ...excludeToks]),
    ...params.parts('?'),
  ]
}

// シリーズ/マイリスト/ユーザー検索にはフィルタパネルが無く、ジャンル・動画種別・
// 再生時間・期間のいずれも効かない(2026-07-09 GUI操作で確認)。並び順は専用の値を持つので
// ここには含めず、各分岐で limitSort により許容値を絞る
const NOT_VIDEO_LIKE: ConceptSupport = {
  level: 'none',
  noteKey: 'note.niconico.resultTypeConflict',
}

function dynamicSupport(state: QueryState): Partial<Record<ConceptId, ConceptSupport>> {
  const resultTypeOverride: Partial<Record<ConceptId, ConceptSupport>> =
    state.resultType && !NICONICO_RESULT_TYPES.has(state.resultType)
      ? { resultType: { level: 'none', noteKey: 'note.resultType.otherSite' } }
      : {}
  if (VIDEO_LIKE_RESULT_TYPES.has(state.resultType)) {
    return {
      ...resultTypeOverride,
      ...limitSort(
        state.sort,
        ['new', 'top', 'comments', 'likes', 'favorites', 'commentDate'],
        'note.sortOrder.otherSite',
      ),
      // 「ふつう(4〜20分)」に当たる値は niconico に無く l_range で送れない(buildUrl も出さない)。
      // その値のときだけ「使えない」に落とし、プレビュー・完全度ドット・ホバーで正直に表す。
      // short/long は l_range=1/2 で実際に送れるので partial のまま
      ...(state.videoLength === 'medium'
        ? { videoLength: { level: 'none', noteKey: 'note.niconico.videoLength' } }
        : {}),
    }
  }
  const nonVideoOverride: Partial<Record<ConceptId, ConceptSupport>> = {
    ...resultTypeOverride,
    genre: NOT_VIDEO_LIKE,
    nicoKind: NOT_VIDEO_LIKE,
    videoLength: NOT_VIDEO_LIKE,
    period: NOT_VIDEO_LIKE,
    // タグページが無いため、タグ語も「厳密一致」ではなくキーワードとして扱われる
    hashtag: { level: 'partial', noteKey: 'note.niconico.hashtagAsKeyword' },
  }
  if (SERIES_LIKE_RESULT_TYPES.has(state.resultType)) {
    return {
      ...nonVideoOverride,
      ...limitSort(state.sort, ['new', 'videoCount', 'videoAdded'], 'note.sortOrder.otherSite'),
    }
  }
  if (state.resultType === 'people') {
    return {
      ...nonVideoOverride,
      ...limitSort(
        state.sort,
        ['videoCount', 'followerCount', 'liveCount'],
        'note.sortOrder.otherSite',
      ),
    }
  }
  // 他サイト専用の resultType 値(resultTypeOverride で既にnone判定済み)。並び順も持たない
  return { ...nonVideoOverride, sortOrder: NOT_VIDEO_LIKE }
}

/** sort= の値 → SortOrder の逆引き表を作る */
function invertSort(map: Partial<Record<SortOrder, string>>): Record<string, SortOrder> {
  const out: Record<string, SortOrder> = {}
  for (const [k, v] of Object.entries(map)) out[v] = k as SortOrder
  return out
}
const VIDEO_SORT_REVERSE = invertSort(SORT_PARAM)
const SERIES_SORT_REVERSE = invertSort(SERIES_SORT_PARAM)
const PEOPLE_SORT_REVERSE = invertSort(PEOPLE_SORT_PARAM)

/** 検索結果タブのパス → resultType(動画/タグは既定='') */
const PATH_RESULT_TYPE: Record<string, QueryState['resultType']> = {
  search: '',
  tag: '',
  search_shorts: 'short',
  series_search: 'series',
  mylist_search: 'playlist',
  user_search: 'people',
}

// 逆翻訳: nicovideo.jp/{search|tag|search_shorts|series_search|mylist_search|user_search}/{q}。
// seiga/manga サブドメインは別サイト(seiga.ts)なのでホスト完全一致で見る。
// 旧形式の並び順(sort=f&order=d / sort=h)や既定値の明示(_hotTotalScore/_personalized)も受ける
function parseUrl(url: URL): ParsedSearch | null {
  if (!hostIs(url, 'nicovideo.jp', 'sp.nicovideo.jp')) return null
  const segs = pathSegments(url)
  if (segs.length < 2) return null
  const [head, rawQuery] = segs
  if (!(head in PATH_RESULT_TYPE)) return null

  const patch: Partial<QueryState> = {}
  const ignored: string[] = []
  const resultType = PATH_RESULT_TYPE[head]
  if (resultType) patch.resultType = resultType

  // タグページ(head==='tag')はOR構文を送らない(buildParts参照)ので、そのままトークン化する。
  // それ以外は括弧なし並置OR(a OR b)の最初の1連なりをkeywordsOrとして抜き出す
  const rawTokens = tokenize(rawQuery)
  const { orTerms, rest } =
    head === 'tag' ? { orTerms: [], rest: rawTokens } : extractBareOrChain(rawTokens)
  const bins = emptyBins()
  for (const token of rest) {
    if (token.startsWith('-') && token.length > 1) bins.excludes.push(token.slice(1))
    else if (token.startsWith('"')) bins.phrases.push(unquote(token))
    else if (head === 'tag') bins.hashtags.push(token)
    else bins.terms.push(token)
  }
  applyBins(patch, bins)
  if (orTerms.length > 0) patch.keywordsOr = orTerms.join(' ')

  const consumed = new Set(['sort', 'order'])
  const isVideoLike = head === 'search' || head === 'tag' || head === 'search_shorts'
  if (isVideoLike) {
    for (const key of ['start', 'end', 'l_range', 'genre', 'kind']) consumed.add(key)
    const start = url.searchParams.get('start')
    if (start !== null) {
      if (isIsoDate(start)) patch.since = start
      else ignored.push(`start=${start}`)
    }
    const end = url.searchParams.get('end')
    if (end !== null) {
      if (isIsoDate(end)) patch.until = end
      else ignored.push(`end=${end}`)
    }
    const lRange = url.searchParams.get('l_range')
    if (lRange === '1') patch.videoLength = 'short'
    else if (lRange === '2') patch.videoLength = 'long'
    else if (lRange !== null) ignored.push(`l_range=${lRange}`)
    const genre = url.searchParams.get('genre')
    if (genre !== null) {
      if ((NICO_GENRES as readonly string[]).includes(genre))
        patch.genre = genre as QueryState['genre']
      else ignored.push(`genre=${genre}`)
    }
    const kind = url.searchParams.get('kind')
    if (kind === 'user' || kind === 'channel') patch.nicoKind = kind
    else if (kind !== null) ignored.push(`kind=${kind}`)
  }

  const sort = url.searchParams.get('sort')
  const order = url.searchParams.get('order')
  if (sort !== null) {
    // 既定値の明示(ニコニコで人気/あなたへのおすすめ)は「指定なし」と同じ。
    // 旧形式 sort=h も「ニコニコで人気」=既定なので同様に畳む
    if (sort === '_hotTotalScore' || sort === '_personalized' || sort === 'h') {
      // 指定なし(auto)のまま
    } else if (order !== null && order !== 'desc' && order !== 'd') {
      // 昇順(古い順など)はDialectに無いので、並び順ごと読めない扱いにする
      ignored.push(`sort=${sort}`, `order=${order}`)
    } else {
      const table = isVideoLike
        ? VIDEO_SORT_REVERSE
        : head === 'user_search'
          ? PEOPLE_SORT_REVERSE
          : SERIES_SORT_REVERSE
      // 旧形式 sort=f&order=d(投稿日時の新しい順)
      const mapped = sort === 'f' && isVideoLike ? 'new' : table[sort]
      if (mapped) patch.sort = mapped
      else ignored.push(`sort=${sort}`)
    }
  }
  leftoverParams(url, consumed, ignored)
  return { patch, ignored }
}

export const niconico: PlatformDef = {
  id: 'niconico',
  name: 'niconico',
  group: 'video',
  brandColor: '#252525',
  requiresLogin: false,
  support: {
    keywords: { level: 'full' },
    exactPhrase: { level: 'full' },
    keywordsOr: { level: 'full' },
    exclude: { level: 'full' },
    fromUser: { level: 'none' },
    hashtag: { level: 'full', noteKey: 'note.tagPage.combined' },
    period: { level: 'full' },
    mediaOnly: { level: 'none', noteKey: 'note.videoOnly' },
    videoLength: { level: 'partial', noteKey: 'note.niconico.videoLength' },
    genre: { level: 'full' },
    nicoKind: { level: 'full' },
    resultType: { level: 'full' },
    sortOrder: { level: 'full' },
  },
  buildParts,
  parseUrl,
  dynamicSupport,
}
