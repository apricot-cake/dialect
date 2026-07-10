import type { MessageKey } from '@/i18n'

/** ビルダーで扱う検索概念。各SNSの演算子はこの概念への翻訳として定義する */
export type ConceptId =
  | 'keywords'
  | 'exactPhrase'
  | 'exclude'
  | 'titleOnly'
  | 'exactTag'
  | 'tagTitleCaption'
  | 'fromUser'
  | 'excludeUser'
  | 'toUser'
  | 'mentionsUser'
  | 'subreddit'
  | 'domain'
  | 'xList'
  | 'hashtag'
  | 'period'
  | 'mediaOnly'
  | 'videoLength'
  | 'linksOnly'
  | 'verifiedOnly'
  | 'excludeReplies'
  | 'liveOnly'
  | 'fourK'
  | 'hdOnly'
  | 'captionsOnly'
  | 'creativeCommons'
  | 'threeSixty'
  | 'vr180'
  | 'threeD'
  | 'hdr'
  | 'locationOnly'
  | 'purchased'
  | 'minLikes'
  | 'minReposts'
  | 'minReplies'
  | 'language'
  | 'workType'
  | 'genre'
  | 'resultType'
  | 'sortOrder'
  | 'pixivPopular'
  | 'ageRating'
  | 'excludeAi'
  | 'nicoKind'
  | 'paidOnly'
  | 'fantiaCategory'
  | 'fantiaAudience'
  | 'safeSearchOff'

export type VideoLength = '' | 'short' | 'medium' | 'long'

/**
 * pixivの人気作の目安。「{N}users入り」タグ(一定ブックマーク数で付く)を、先頭の桁を
 * 固定しない部分パターン(末尾ゼロの数)で拾う。例: '000users' は 1000/5000/10000…users入り
 * を s_mode=s_tag の部分一致でまとめてヒット。空は指定なし。
 * 00users≒100以上 / 000users≒1000以上 / 0000users≒10000以上
 */
export type PixivPopular = '' | '00users' | '000users' | '0000users'

/**
 * pixivの年齢制限フィルタ(mode)。空=指定なし(アカウント既定=すべて)、
 * safe=全年齢のみ(mode=safe)、r18=R18のみ(mode=r18)。実機確認済み(2026-07-05)で
 * safe+r18が件数上ちょうど全件に分割される。R18の表示は未ログインだと出ない
 */
export type AgeRating = '' | 'safe' | 'r18'

/**
 * 投稿の言語コード(ISO 639-1)。lang: 演算子を持つサイト(X/Bluesky)向けの主要言語。
 * 表示ラベルは i18n の concept.language.<code>、選択肢は SELECT_OPTIONS.language。
 * permalink と App の検証もこの配列を単一の真実として参照する(追加時はここだけ増やす)
 */
export const POST_LANGUAGE_CODES = [
  'ja', 'en', 'zh', 'ko', 'es', 'fr', 'de',
  'pt', 'ru', 'it', 'ar', 'hi', 'th', 'id',
] as const

/** 投稿の言語。空は指定なし */
export type PostLanguage = '' | (typeof POST_LANGUAGE_CODES)[number]

/** 作品の種類。イラスト/マンガ/うごくイラスト/小説の投稿サイト(pixiv)向け */
export type WorkType = '' | 'illust' | 'manga' | 'ugoira' | 'novel'

/**
 * niconicoのジャンル(genre=)。niconico専用。空=指定なし。
 * 2026-07-06に /search と /tag の両方で有効(件数が段階的に絞られる)を実測。
 * permalink と App の検証もこの配列を単一の真実として参照する
 */
export const NICO_GENRES = [
  'music_sound', 'game', 'entertainment', 'other', 'dance', 'anime',
  'technology_craft', 'commentary_lecture', 'sports', 'radio', 'vehicle', 'traveling_outdoor',
] as const

export type NicoGenre = '' | (typeof NICO_GENRES)[number]

/**
 * niconico動画の動画種別(kind=)。niconico専用。空=指定なし、user=ユーザー投稿動画、
 * channel=公式チャンネル動画。2026-07-09に検索フィルタモーダルをGUI操作で採取
 */
export type NicoKind = '' | 'user' | 'channel'

/**
 * Fantiaの投稿カテゴリ(category=)。Fantia専用。空=指定なし。
 * 詳細検索パネルの「カテゴリー」チップ群(イラスト・漫画・その他/実写の2グループ、
 * 計24種)から値を採取(2026-07-09にログイン済みGUI操作で実測)。サイト自体は
 * category=illust,cosplay のようにカンマ区切りで複数選択できるが、Dialectは他の
 * 種類系の概念(ジャンル・作品の種類等)と同じ単一選択で対応する
 */
export const FANTIA_CATEGORIES = [
  'illust', 'comic', 'vtuber', 'voice', 'voiceactor', '3d', '2d_anime', 'game',
  'music', 'novel', 'doll', 'art', 'program', 'handmade', 'history', 'railroad',
  'shop', 'other', 'fortune', 'cosplay', 'idol', 'youtuber', 'photo_movie', 'other_real',
] as const

export type FantiaCategory = '' | (typeof FANTIA_CATEGORIES)[number]

/**
 * Fantiaの対象読者区分(brand_type=)。Fantia専用。空=指定なし(常に3=全年齢を明示送信)、
 * male=男性向け(R18、brand_type=0)、female=女性向け(R18、brand_type=2)。
 * 2026-07-09にGUI操作で実測: このパラメータを省略すると、その時点のアカウント/セッションの
 * 直近の閲覧設定が使われ全年齢に固定されないため、Dialectは常に明示的に送る
 */
export type FantiaAudience = '' | 'male' | 'female'

/**
 * 探すものの種類。video=動画、short=ショート動画、channel=投稿者・配信者、
 * playlist=再生リスト(YouTube専用の値。Twitchは動画・チャンネルのみ)。
 * posts=投稿、communities=コミュニティ、comments=コメント、media=メディア、
 * people=プロフィール(Reddit専用の値。2026-07-07にGUI操作で実測した検索結果タブ
 * すべて/投稿/コミュニティ/コメント/メディア/プロフィールの type= に対応)。
 * board=ボード(Pinterest専用。フィルターパネルの「すべてのピン/動画/ボード/
 * プロフィール」の4択のうち「ボード」に対応。2026-07-08にGUI操作で実測、peopleはpinterestの
 * 「プロフィール」とも共用)。bangumi=アニメ番組、pgc=映画・ドラマなどの制作コンテンツ、
 * live=生放送中のルーム、article=コラム記事(いずれもbilibili専用。トップの「综合/视频/
 * 番剧/影视/直播/专栏/用户」タブに対応。2026-07-08にGUI操作で実測、用户はchannelを共用)。
 * series=シリーズ(niconico専用。検索結果タブ「動画/ショート/シリーズ/マイリスト/
 * ユーザー」の「シリーズ」に対応。short/playlist/peopleはniconicoの「ショート/マイリスト/
 * ユーザー」とも共用。2026-07-09にGUI操作で実測)。circle=メンバーシップ(note専用。検索結果タブ
 * 「記事/マガジン/クリエイター/メンバーシップ」の「メンバーシップ」に対応。2026-07-09にGUI操作で実測)
 * permalink と App の検証もこの配列を単一の真実として参照する(追加時はここだけ増やす)
 */
export const RESULT_TYPE_VALUES = [
  '', 'video', 'short', 'channel', 'playlist',
  'posts', 'communities', 'comments', 'media', 'people',
  'board', 'bangumi', 'pgc', 'live', 'article',
  'series', 'circle',
] as const

export type ResultType = (typeof RESULT_TYPE_VALUES)[number]

/**
 * 並び順。new=新しい順、top=人気順、hot=急上昇/注目、comments=コメント数順、
 * auto=指定なし(サイトの標準の並びのまま=既定)。hot に対応するのは note(急上昇)と
 * Reddit(注目順=sort=hot)。comments は Reddit専用(sort=comments、2026-07-07にGUI操作で実測)。
 * danmaku=弾幕数順、favorites=収蔵(お気に入り登録)数順、likes=いいね数順は
 * いずれもbilibili専用(2026-07-08にGUI操作で実測。動画検索はorder=dm/stow、
 * コラム検索はorder=attention)。commentDate=最新コメント順はniconico専用
 * (sort=lastCommentTime、2026-07-09にGUI操作で実測。コメント数順(comments概念とは別)とは
 * 異なり「直近にコメントが付いた順」)。videoCount=収録動画数順・videoAdded=動画追加日時順は
 * niconicoのシリーズ・マイリスト検索専用(2026-07-09にGUI操作で実測。newを収録動画数系の
 * 「作成日」に流用し、videoCountで登録動画数、videoAddedで最後に動画が追加された日時を表す)。
 * followerCount=フォロワー数順・liveCount=生放送番組数順はniconicoのユーザー検索専用
 * (2026-07-09にGUI操作で実測。videoCountはユーザー検索では投稿動画数の意味で共用)。
 * 対応しないサイトでは dynamicSupport(limitSort)でnon-対応に落とす。
 * permalink と App の検証もこの配列を単一の真実として参照する(追加時はここだけ増やす)
 */
export const SORT_ORDER_VALUES = [
  'new', 'top', 'hot', 'comments', 'auto',
  'danmaku', 'favorites', 'likes', 'commentDate',
  'videoCount', 'videoAdded', 'followerCount', 'liveCount',
] as const

export type SortOrder = (typeof SORT_ORDER_VALUES)[number]

/** ユーザーが組み立てる検索条件 */
export interface QueryState {
  /**
   * キーワードの語の並び。1要素=1語で、語の中身は分割しない(スペースを含む語はフレーズ)。
   * 語どうしは常にAND。常に1要素以上
   */
  terms: string[]
  /**
   * 完全一致の語句の並び。1要素=1つの語句で、語句の中身は分割しない(語順のまま探す)。
   * 語句どうしは常にAND。常に1要素以上(terms と同じ扱い)
   */
  exactPhrase: string[]
  exclude: string
  titleOnly: boolean
  /** pixiv専用。検索語をタグとして完全一致で探す(s_mode=s_tag_full。既定の部分一致を無効化) */
  exactTag: boolean
  /**
   * pixiv専用。タグ・タイトル・キャプションをまとめて探す(s_mode=tag_tc)。
   * 既定のタグ部分一致より広い範囲を対象にする。2026-07-07にGUI操作で実測
   */
  tagTitleCaption: boolean
  fromUser: string
  excludeUser: string
  /** スペース区切りで複数可(どれか宛て=OR) */
  toUser: string
  mentionsUser: string
  /** スペース区切りで複数可(どれか=OR) */
  subreddit: string
  domain: string
  /** X専用。リスト内検索(list:<id>)。リストのURLまたはIDを生で持ち、buildUrlで数値IDを抽出する */
  xList: string
  /** スペース区切りで複数のタグ(すべて含む=AND) */
  hashtag: string
  since: string // YYYY-MM-DD
  until: string // YYYY-MM-DD
  mediaOnly: boolean
  videoLength: VideoLength
  linksOnly: boolean
  verifiedOnly: boolean
  excludeReplies: boolean
  /** YouTube専用。ライブ配信だけに絞る(sp のfilterサブメッセージ field8=1) */
  liveOnly: boolean
  /**
   * YouTube専用。フィルタパネル「特徴」の絞り込み(sp のfilterサブメッセージの各field=1)。
   * 2026-07-07にGUI操作で実機解析: 4K=field14、HD=field4、字幕=field5、
   * クリエイティブ・コモンズ=field6(liveOnlyのfield8とは別枠、combine可能)
   */
  fourK: boolean
  hdOnly: boolean
  captionsOnly: boolean
  creativeCommons: boolean
  /**
   * YouTube専用。「特徴」の残り6項目(2026-07-08にGUI操作で実機解析、いずれも
   * 他の特徴・タイプ・並び順と自由に組み合わせ可能): 360°=field15、VR180=field26、
   * 3D=field7、HDR=field25、場所(撮影地の位置情報つき動画に絞る)=field23、
   * 購入済み(自分が購入した映画・番組)=field9
   */
  threeSixty: boolean
  vr180: boolean
  threeD: boolean
  hdr: boolean
  locationOnly: boolean
  purchased: boolean
  minLikes: string // 数値文字列
  minReposts: string // 数値文字列
  /** X専用。最低返信数(min_replies:、非公式演算子。2026-07-06実測)。数値文字列 */
  minReplies: string
  language: PostLanguage
  workType: WorkType
  /** niconico専用。ジャンル(genre=)。空=指定なし */
  genre: NicoGenre
  /** niconico専用。動画種別(kind=user/channel)。空=指定なし */
  nicoKind: NicoKind
  /** note専用。有料記事だけに絞る(context=note_for_sale)。false=指定なし(すべての記事) */
  paidOnly: boolean
  /** Fantia専用。投稿カテゴリ(category=)。空=指定なし */
  fantiaCategory: FantiaCategory
  /** Fantia専用。対象読者区分(brand_type=)。空=指定なし(常に全年齢を明示送信) */
  fantiaAudience: FantiaAudience
  /**
   * はてなブックマーク専用。セーフサーチを解除する(safe=off)。false=指定なし(既定=on、
   * 未ログインでも同じ既定と2026-07-09にWebFetchで確認)
   */
  safeSearchOff: boolean
  resultType: ResultType
  sort: SortOrder
  /** pixiv専用。「{N}users入り」タグの部分パターンで擬似人気順にする(空=指定なし) */
  pixivPopular: PixivPopular
  /** pixiv専用。年齢制限(mode=safe/r18)。空=指定なし */
  ageRating: AgeRating
  /** pixiv専用。AI生成作品を除く(ai_type=1)。false=指定なし(アカウント既定に従う) */
  excludeAi: boolean
}

/**
 * full    = そのまま翻訳できる(緑)
 * partial = 近似・非公式など注意つきで翻訳できる(黄)
 * none    = 翻訳できず、起動時に外される(灰)
 */
export type SupportLevel = 'full' | 'partial' | 'none'

export interface ConceptSupport {
  level: SupportLevel
  noteKey?: MessageKey
}

export type PlatformGroup = 'sns' | 'video' | 'image' | 'text'

export type PlatformId =
  | 'x'
  | 'bluesky'
  | 'youtube'
  | 'note'
  | 'niconico'
  | 'seiga'
  | 'instagram'
  | 'reddit'
  | 'pixiv'
  | 'misskey'
  | 'hatebu'
  | 'twitch'
  | 'fivech'
  | 'animanch'
  | 'tumblr'
  | 'mastodon'
  | 'pinterest'
  | 'fanbox'
  | 'bilibili'
  | 'fantia'

/**
 * 検索URLから読み取れた条件(逆翻訳)。patch は defaultState への上書き差分。
 * ignored は認識できず無視した部分(パラメータや演算子)で、黙って捨てずに
 * ユーザーへ正直に見せるために残す
 */
export interface ParsedSearch {
  patch: Partial<QueryState>
  ignored: string[]
}

export interface PlatformDef {
  id: PlatformId
  name: string
  group: PlatformGroup
  /** ボタン等に使うブランドカラー */
  brandColor: string
  /**
   * ブランド色の上に置く文字・アイコン色の明示指定(任意)。通常は輝度から自動判定するが、
   * Misskeyの黄緑のように自動だと望む色にならないサイトで白/黒を固定するために使う
   */
  ink?: string
  requiresLogin: boolean
  /** Googleフォールバック(site:検索)で使うドメイン */
  googleSite: string
  /** 対応する概念のみ記載。未記載の概念は非対応(none)として扱う */
  support: Partial<Record<ConceptId, ConceptSupport>>
  /** 対応している概念だけを検索URLへ翻訳する。検索として成立しない場合は null */
  buildUrl(state: QueryState): string | null
  /**
   * このサイトの検索URLをDialectの条件へ逆翻訳する(buildUrlの逆方向)。
   * このサイトの検索URLでなければ null。buildUrl が出すURLは必ず読めること
   * (check:reverse が往復一致を機械検査する)。サイトが実際に生成する形の
   * バリエーション(旧ドメイン・別パラメータ等)もできる範囲で受ける
   */
  parseUrl(url: URL): ParsedSearch | null
  /**
   * state に応じて support を上書きする(任意)。同じ概念でも入力の組み合わせ次第で
   * 実際にはURLへ送れないことがある(例: YouTubeはユーザー指定を入れると
   * チャンネル内検索に切り替わり、並び順・動画の長さ・探すものが送れない)。
   * その概念だけ level を下げて注記を差し替えるために使う。静的 support にマージされる
   */
  dynamicSupport?(state: QueryState): Partial<Record<ConceptId, ConceptSupport>>
}

export const NO_SUPPORT: ConceptSupport = { level: 'none' }

export function supportOf(
  platform: PlatformDef,
  concept: ConceptId,
): ConceptSupport {
  return platform.support[concept] ?? NO_SUPPORT
}

/**
 * dynamicSupport 用ヘルパー。選ばれた並び順が allowed に含まれないとき、sortOrder を
 * 非対応(none)に落とす。'auto'(サイト任せ)は並び順を課さないので常に許容。
 * note 専用の hot などを、その並び順を持たないサイトで「適用」に見せないために使う
 */
export function limitSort(
  sort: SortOrder,
  allowed: SortOrder[],
  noteKey: MessageKey,
): Partial<Record<ConceptId, ConceptSupport>> {
  if (sort !== 'auto' && !allowed.includes(sort)) {
    return { sortOrder: { level: 'none', noteKey } }
  }
  return {}
}

/** ある条件セットをあるSNSへ翻訳した結果 */
export interface Resolution {
  url: string | null
  applied: ConceptId[]
  approximated: Array<{ concept: ConceptId; noteKey?: MessageKey }>
  dropped: Array<{ concept: ConceptId; noteKey?: MessageKey }>
}
