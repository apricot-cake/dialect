import type { MessageKey } from './i18n.js'

/** ビルダーで扱う検索概念。各SNSの演算子はこの概念への翻訳として定義する */
export type ConceptId =
  | 'keywords'
  | 'exactPhrase'
  | 'keywordsOr'
  | 'exclude'
  | 'titleOnly'
  | 'exactTag'
  | 'tagTitleCaption'
  | 'fromUser'
  | 'excludeUser'
  | 'toUser'
  | 'mentionsUser'
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
  | 'fantiaCategory'
  | 'fantiaAudience'
  | 'safeSearchOff'
  | 'videoOnly'
  | 'repliesOnly'
  | 'followingOnly'
  | 'hashtagOr'
  | 'excludeHashtag'
  | 'excludeMentions'
  | 'excludeDomain'
  | 'linkUrl'
  | 'excludeLinkUrl'
  | 'fileType'
  | 'region'
  | 'license'
  | 'exactMatchMode'

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
  'ja',
  'en',
  'zh',
  'ko',
  'es',
  'fr',
  'de',
  'pt',
  'ru',
  'it',
  'ar',
  'hi',
  'th',
  'id',
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
  'music_sound',
  'game',
  'entertainment',
  'other',
  'dance',
  'anime',
  'technology_craft',
  'commentary_lecture',
  'sports',
  'radio',
  'vehicle',
  'traveling_outdoor',
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
  'illust',
  'comic',
  'vtuber',
  'voice',
  'voiceactor',
  '3d',
  '2d_anime',
  'game',
  'music',
  'novel',
  'doll',
  'art',
  'program',
  'handmade',
  'history',
  'railroad',
  'shop',
  'other',
  'fortune',
  'cosplay',
  'idol',
  'youtuber',
  'photo_movie',
  'other_real',
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
 * Googleのファイル形式(filetype:)。空=指定なし。詳細検索フォーム(advanced_search)の
 * 「ファイル形式」ドロップダウンから全10種を採取(2026-07-11にGUI操作で実測、issue #33)
 */
export const GOOGLE_FILE_TYPES = [
  'pdf',
  'ps',
  'dwf',
  'kml',
  'kmz',
  'xls',
  'ppt',
  'doc',
  'rtf',
  'swf',
] as const

export type GoogleFileType = '' | (typeof GOOGLE_FILE_TYPES)[number]

/**
 * Googleのライセンス(利用権、tbs=sur:)。空=フィルタリングしない。詳細検索フォームの
 * 「ライセンス」ドロップダウンから全4種を採取(2026-07-11にGUI操作で実測、issue #33)。
 * f=自由に使用・共有できる/fc=+営利目的も可/fm=+変更も可/fmc=+営利目的の変更も可
 */
export type GoogleLicense = '' | 'f' | 'fc' | 'fm' | 'fmc'

/**
 * 探すものの種類。video=動画、short=ショート動画、channel=投稿者・配信者、
 * playlist=再生リスト(YouTube専用の値)。
 * people=プロフィール(Bluesky・niconico専用の値。ユーザー検索タブに対応)。
 * bangumi=アニメ番組、pgc=映画・ドラマなどの制作コンテンツ、
 * live=生放送中のルーム、article=コラム記事(いずれもbilibili専用。トップの「综合/视频/
 * 番剧/影视/直播/专栏/用户」タブに対応。2026-07-08にGUI操作で実測、用户はchannelを共用)。
 * series=シリーズ(niconico専用。検索結果タブ「動画/ショート/シリーズ/マイリスト/
 * ユーザー」の「シリーズ」に対応。short/playlist/peopleはniconicoの「ショート/マイリスト/
 * ユーザー」とも共用。2026-07-09にGUI操作で実測)。
 * images=画像(Google専用。udm=2)、shopping=ショッピング(Google専用。udm=28)、
 * news=ニュース(Google専用。tbm=nws。他サイトのresultTypeとは別パラメータ形式)、
 * web=ウェブ(Google専用。udm=web。リッチな要素を除いた素の検索結果一覧)、
 * books=書籍(Google専用。udm=36)。
 * shortはGoogleの「ショート動画」タブ(udm=39)とも共用。いずれも2026-07-11にGUI操作で実測(issue #33)。
 * AIモード(udm=50)は検索結果一覧ではなく別の対話型体験のため対象外(マップ・フライトと同様の理由で除外)
 */
export type ResultType =
  | ''
  | 'video'
  | 'short'
  | 'channel'
  | 'playlist'
  | 'people'
  | 'bangumi'
  | 'pgc'
  | 'live'
  | 'article'
  | 'series'
  | 'images'
  | 'shopping'
  | 'news'
  | 'web'
  | 'books'

/**
 * 並び順。new=新しい順、top=人気順、comments=コメント数順、
 * auto=指定なし(サイトの標準の並びのまま=既定)。comments はniconico・bilibili専用
 * (niconicoはsort=commentCount、bilibiliはコラム検索でorder=scores。2026-07-09にGUI操作で実測)。
 * danmaku=弾幕数順、favorites=収蔵(お気に入り登録)数順、likes=いいね数順は
 * いずれもbilibili専用(2026-07-08にGUI操作で実測。動画検索はorder=dm/stow、
 * コラム検索はorder=attention)。commentDate=最新コメント順はniconico専用
 * (sort=lastCommentTime、2026-07-09にGUI操作で実測。コメント数順(comments概念とは別)とは
 * 異なり「直近にコメントが付いた順」)。videoCount=収録動画数順・videoAdded=動画追加日時順は
 * niconicoのシリーズ・マイリスト検索専用(2026-07-09にGUI操作で実測。newを収録動画数系の
 * 「作成日」に流用し、videoCountで登録動画数、videoAddedで最後に動画が追加された日時を表す)。
 * followerCount=フォロワー数順・liveCount=生放送番組数順はniconicoのユーザー検索専用
 * (2026-07-09にGUI操作で実測。videoCountはユーザー検索では投稿動画数の意味で共用)。
 * oldest=投稿の古い順・updated=更新の新しい順・updatedOld=更新の古い順はFantia専用
 * (order=create_old/updater/update_old。2026-07-13にGUI操作で実測、issue #70)。
 * 対応しないサイトでは dynamicSupport(limitSort)でnon-対応に落とす
 */
export type SortOrder =
  | 'new'
  | 'top'
  | 'comments'
  | 'auto'
  | 'danmaku'
  | 'favorites'
  | 'likes'
  | 'commentDate'
  | 'videoCount'
  | 'videoAdded'
  | 'followerCount'
  | 'liveCount'
  | 'oldest'
  | 'updated'
  | 'updatedOld'

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
  /**
   * スコープ限定OR(「このどれかを含む」)。スペース区切りで複数可、どれか1つを含めばよい
   * (toUser と同じ「複数指定=OR」の枠)。対応5サイト(X/pixiv/YouTube/
   * niconico動画・静画)のみ有効。「足す=絞る」原則の例外として2026-07-11導入(issue #26)。
   * 1語だけの指定はOR構文を送らず通常のキーワードと同じ扱いになる
   */
  keywordsOr: string
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
  /**
   * Bluesky専用。メンション先を除外(excludeMentions=)。スペース区切りで複数可
   * (除外対象を空白区切りで複数=excludeUserと同じ意味論)。2026-07-11にGUI操作で実測(issue #27)
   */
  excludeMentions: string
  domain: string
  /**
   * Bluesky専用。リンク先ドメインを除外(excludeDomain=)。スペース区切りで複数可
   * (除外対象を空白区切りで複数=excludeUserと同じ意味論)。2026-07-11にGUI操作で実測(issue #27)
   */
  excludeDomain: string
  /**
   * Bluesky専用。埋め込みリンク・カード先のURLで絞り込む(url=)。既存の対応する概念が無い
   * 完全新規。単一値のみ確認済み(複数値のOR/AND挙動は未検証)。2026-07-11にGUI操作で実測(issue #27)
   */
  linkUrl: string
  /** Bluesky専用。linkUrlの除外版(excludeUrl=)。単一値のみ確認済み。2026-07-11にGUI操作で実測(issue #27) */
  excludeLinkUrl: string
  /** Google専用。ファイル形式で絞り込む(filetype:)。空=指定なし */
  fileType: GoogleFileType
  /**
   * Google専用。地域(cr=country{code})。ISO 3166-1の2文字コード(例: JP・US)を生で持つ。
   * 詳細検索フォームの「地域」ドロップダウンは240件と膨大なため、他サイトの選択式
   * (workType等)と違い自由入力にした(domain等と同じplain)。2026-07-11にGUI操作で実測(issue #33)
   */
  region: string
  /** Google専用。ライセンス(利用権、tbs=sur:)。空=フィルタリングしない */
  license: GoogleLicense
  /**
   * Google専用。完全一致モード(tbs=li:1、ツールメニューの「完全一致」)。表記ゆれ・類義語への
   * 自動展開を抑え、入力した語のとおりに検索する。既存のexactPhrase(語順つき句の一致)とは別物
   * (クエリ全体の解釈モードの切り替え)。2026-07-11にGUI操作で実測(issue #33)
   */
  exactMatchMode: boolean
  /** X専用。リスト内検索(list:<id>)。リストのURLまたはIDを生で持ち、buildUrlで数値IDを抽出する */
  xList: string
  /** スペース区切りで複数のタグ(すべて含む=AND) */
  hashtag: string
  /**
   * スコープ限定OR(「このハッシュタグのどれかを含む」)。keywordsOrのハッシュタグ版。
   * スペース区切りで複数可、どれか1つを含めばよい(既存hashtag概念のAND意味論とは別物)。
   * 2026-07-11時点でBluesky(tag=)のみ対応。GUI操作で実測(issue #27)
   */
  hashtagOr: string
  /** Bluesky専用。ハッシュタグを除外(excludeTag=)。スペース区切りで複数可(除外対象=exclude-each)。2026-07-11にGUI操作で実測(issue #27) */
  excludeHashtag: string
  since: string // YYYY-MM-DD
  until: string // YYYY-MM-DD
  mediaOnly: boolean
  /** Bluesky専用。動画つきの投稿だけに絞る(video=true)。既存のmediaOnly(画像+動画)とは別の3値目。2026-07-11にGUI操作で実測(issue #27) */
  videoOnly: boolean
  videoLength: VideoLength
  linksOnly: boolean
  verifiedOnly: boolean
  excludeReplies: boolean
  /** Bluesky専用。返信(リプライ)だけに絞る(replies=only)。excludeReplies(replies=none)の逆方向。2026-07-11にGUI操作で実測(issue #27) */
  repliesOnly: boolean
  /**
   * Bluesky専用。フォロー中のアカウントの投稿だけに絞る(following=true)。実在するURLパラメータだが
   * 結果はリンクを開くアカウントのフォロー関係に依存する。2026-07-11にGUI操作で実測(issue #27)
   */
  followingOnly: boolean
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

export type PlatformGroup = 'sns' | 'video' | 'image' | 'web'

export type PlatformId =
  | 'x'
  | 'bluesky'
  | 'youtube'
  | 'niconico'
  | 'seiga'
  | 'instagram'
  | 'pixiv'
  | 'misskey'
  | 'tumblr'
  | 'mastodon'
  | 'fanbox'
  | 'bilibili'
  | 'fantia'
  | 'google'

/**
 * 検索URLの1断片。全パーツの text をそのまま連結したものが最終URLになる。
 * concepts はこの断片を生んだ条件(概念)で、空=無帰属(URLの土台・区切り)。
 * 複数概念の複合断片(YouTubeのsp=は並び順・種類・特徴が1つのbase64に合成される等)は
 * 概念を複数持つ。翻訳プレビューの「条件⇄URL部分の同色対応」と check:parts が使う
 */
export interface UrlPart {
  text: string
  concepts: ConceptId[]
}

/**
 * 検索URLから読み取れた条件(逆翻訳)。patch は defaultState への上書き差分。
 * ignored は認識できず無視した部分(パラメータや演算子)で、黙って捨てずに
 * ユーザーへ正直に見せるために残す
 */
export interface ParsedSearch {
  patch: Partial<QueryState>
  ignored: string[]
}

/**
 * サイトごとの利用者設定(現状はfediverseのインスタンスホストのみ)。QueryStateとは別枠
 * (検索条件ではなく「どのサーバーへ翻訳するか」という利用者環境の設定のため)。
 * mastodon/misskeyだけが参照し、他サイトは無視する(issue #32)
 */
export interface PlatformCtx {
  instanceHost?: string
}

/** サイトIDごとの設定済みインスタンスホスト。未設定のサイトは既定ホストを使う */
export type InstanceHosts = Partial<Record<PlatformId, string>>

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
  /** 対応する概念のみ記載。未記載の概念は非対応(none)として扱う */
  support: Partial<Record<ConceptId, ConceptSupport>>
  /**
   * 対応している概念だけを検索URLへ翻訳する。検索として成立しない場合は null。
   * URLは不透明な文字列ではなく UrlPart 列(どの断片がどの概念由来か)として組み立て、
   * 連結(joinParts)が最終URLになる。帰属の物差し=概念が「指定あり」でその断片を
   * 変えたときだけ帰属させる(指定なしでも常に送る固定既定値は無帰属。
   * check:parts が applied∪approximated との整合を機械検査する)
   */
  buildParts(state: QueryState, ctx?: PlatformCtx): UrlPart[] | null
  /**
   * このサイトの検索URLをDialectの条件へ逆翻訳する(buildPartsの逆方向)。
   * このサイトの検索URLでなければ null。buildParts が出すURLは必ず読めること
   * (check:reverse が往復一致を機械検査する)。サイトが実際に生成する形の
   * バリエーション(旧ドメイン・別パラメータ等)もできる範囲で受ける
   */
  parseUrl(url: URL, ctx?: PlatformCtx): ParsedSearch | null
  /**
   * state に応じて support を上書きする(任意)。同じ概念でも入力の組み合わせ次第で
   * 実際にはURLへ送れないことがある(例: YouTubeはユーザー指定を入れると
   * チャンネル内検索に切り替わり、並び順・動画の長さ・探すものが送れない)。
   * その概念だけ level を下げて注記を差し替えるために使う。静的 support にマージされる
   */
  dynamicSupport?(state: QueryState): Partial<Record<ConceptId, ConceptSupport>>
}

export const NO_SUPPORT: ConceptSupport = { level: 'none' }

export function supportOf(platform: PlatformDef, concept: ConceptId): ConceptSupport {
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
  /** url の断片列(概念への帰属つき)。url === joinParts(parts)。成立しないとき null */
  parts: UrlPart[] | null
  applied: ConceptId[]
  approximated: Array<{ concept: ConceptId; noteKey?: MessageKey }>
  dropped: Array<{ concept: ConceptId; noteKey?: MessageKey }>
}
