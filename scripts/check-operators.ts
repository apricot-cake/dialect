/**
 * 「コードが実際に送る演算子」と「docs/operator-checklist.md が定期確認する演算子」の
 * ズレ(ドリフト)を、ブラウザもネットワークも使わず静的に検知する CLI チェック。
 *
 * なぜ要るか(柱A=対応表⇄チェックリストの自動同期):
 *   演算子をコードに足したのにチェックリストへ行を足し忘れると、その演算子だけ
 *   定期動作確認(operator-check)をすり抜ける。実際 2026-07-05 に pixiv「人気の目安」と
 *   X `filter:links`/`-from:` が漏れ、2026-07-06 の第2次採用でも niconico ジャンル等が
 *   漏れた。この照合はこれまで operator-check スキルの「フェーズ0」で毎回手作業だったが、
 *   人手だと見落とす。それを機械化してマージゲート(CI)に載せる。
 *
 * 何をするか:
 *   1. 各サイトが送る演算子を宣言表(PROBES)として持ち、実物の buildUrl 出力に
 *      本当に現れるか自己検証する(表がコードとズレていないことの担保)。
 *   2. 追跡対象(tracked)の演算子が operator-checklist.md の該当サイト節に載っているか照合し、
 *      載っていなければドリフトとして落とす(= フェーズ0 の自動化)。
 *   3. support 表が「対応(full/partial)」と宣言する各概念について、その概念を入れると
 *      実際に buildUrl の出力が変わる入力が最低1つ在ることを確かめる(=support が「効く」と
 *      言うのにコードが送らない「静かな嘘」の再発をCIで止める。適用と出るのに実際は落ちる、
 *      という食い違いは2026-07-04監査で手作業で見つけて直した=それの機械化)。
 *   4. 生成した網羅サンプルを全サイトの buildUrl に通し、宣言表にも許可リストにも無い
 *      未登録の演算子キーが出ていないかを安全網として警告する(将来の追加漏れ検知)。
 *
 * 実行: npm run check:operators   (tsx で直接実行)
 */
import { readFileSync } from 'node:fs'
import { resolve as pathResolve } from 'node:path'
import { PLATFORMS } from '@/core/platforms'
import { defaultState } from '@/core/concepts'
import { CONCEPT_DEFS, CONCEPT_MAP, SELECT_OPTIONS, SORT_OPTIONS } from '@/core/conceptDefs'
import { supportOf } from '@/core/types'
import { buildUrl } from '@/core/urlParts'
import type { ConceptId, PlatformId, QueryState } from '@/core/types'
import { CHECKLIST_HEADING, sectionFor } from './lib/checklistParser'

// ---- チェックリストの読み込み ---------------------------------------------------
// セクション分割ロジック(CHECKLIST_HEADING・sectionFor)は scripts/gen-health.ts と共用
// するため scripts/lib/checklistParser.ts へ抽出済み。

const CHECKLIST_PATH = pathResolve(process.cwd(), 'docs/operator-checklist.md')
const checklist = readFileSync(CHECKLIST_PATH, 'utf8')

// ---- 宣言表(PROBES): 各サイトが送る演算子 -------------------------------------

interface Probe {
  platform: PlatformId
  concept: ConceptId
  /** 表示用の短いラベル */
  label: string
  /** defaultState + terms:['猫'] に重ねる入力の断片 */
  state: Partial<QueryState>
  /** operator-checklist.md の該当サイト節に載っているべき文字列(照合キー) */
  token: string
  /**
   * buildUrl 出力(URLデコード後)に必ず現れる文字列(自己検証用)。
   * 省略時は token を使う。YouTube sp のように「チェックリスト表記」と「URL上の見え方」が
   * ずれる、pixiv 擬似人気タグのように値がパターンな場合だけ明示する
   */
  emit?: string
  /**
   * false = 公式・安定でチェックリストには意図的に載せない(照合の対象外)。
   * 自己検証と文書化のためにコードが送っている事実だけ残す。既定 true
   */
  tracked?: boolean
  /** tracked:false のときの理由(出力に表示) */
  note?: string
}

const BASE: QueryState = { ...defaultState(), terms: ['猫'] }
/** タグ単独ページの分岐を踏むための素地(キーワードを空にしてハッシュタグ1つ) */
const TAG_ONLY = (tag: string): Partial<QueryState> => ({ terms: [''], hashtag: tag })

const PROBES: Probe[] = [
  // ---- X ----
  { platform: 'x', concept: 'fromUser', label: '送信者', state: { fromUser: 'nhk' }, token: 'from:' },
  { platform: 'x', concept: 'excludeUser', label: '除外ユーザー', state: { excludeUser: 'foo' }, token: '-from:' },
  { platform: 'x', concept: 'toUser', label: '宛先', state: { toUser: 'nhk' }, token: 'to:' },
  { platform: 'x', concept: 'mentionsUser', label: 'メンション', state: { mentionsUser: 'nhk' }, token: '(@nhk)' },
  { platform: 'x', concept: 'domain', label: 'リンク先', state: { domain: 'nhk.or.jp' }, token: 'url:' },
  { platform: 'x', concept: 'xList', label: 'リスト内', state: { xList: '1215911364234924032' }, token: 'list:' },
  { platform: 'x', concept: 'period', label: '期間(以降)', state: { since: '2026-06-01' }, token: 'since:' },
  { platform: 'x', concept: 'period', label: '期間(以前)', state: { until: '2026-06-08' }, token: 'until:' },
  { platform: 'x', concept: 'mediaOnly', label: 'メディア', state: { mediaOnly: true }, token: 'filter:media' },
  { platform: 'x', concept: 'linksOnly', label: 'リンク', state: { linksOnly: true }, token: 'filter:links' },
  { platform: 'x', concept: 'verifiedOnly', label: '認証済み', state: { verifiedOnly: true }, token: 'filter:blue_verified' },
  { platform: 'x', concept: 'excludeReplies', label: '返信除外', state: { excludeReplies: true }, token: '-filter:replies' },
  { platform: 'x', concept: 'minLikes', label: '最低いいね', state: { minLikes: '500' }, token: 'min_faves:' },
  { platform: 'x', concept: 'minReposts', label: '最低リポスト', state: { minReposts: '500' }, token: 'min_retweets:' },
  { platform: 'x', concept: 'minReplies', label: '最低返信', state: { minReplies: '200' }, token: 'min_replies:' },
  { platform: 'x', concept: 'language', label: '言語', state: { language: 'ja' }, token: 'lang:' },
  { platform: 'x', concept: 'sortOrder', label: '新しい順', state: { sort: 'new' }, token: 'f=live' },
  { platform: 'x', concept: 'sortOrder', label: '人気順(タブ)', state: { sort: 'top' }, token: 'f=top', tracked: false, note: '既定タブ(人気/話題)。公式・安定なので確認リスト対象外' },
  { platform: 'x', concept: 'keywordsOr', label: 'このどれかを含む', state: { terms: ['手芸'], keywordsOr: '猫 犬' }, token: '(猫 OR 犬)' },

  // ---- Bluesky ----
  // 2026-07-11、issue #27の全項目監査でfromUser/mentionsUser/domainは高度な検索オプションの
  // 新パラメータ形式(author=/mentions=/domain=)へ移行(旧q内トークンはparseUrlが後方互換で読むのみ)
  { platform: 'bluesky', concept: 'fromUser', label: '送信者', state: { fromUser: 'nhk.bsky.social' }, token: 'author=' },
  { platform: 'bluesky', concept: 'excludeUser', label: '除外送信者', state: { excludeUser: 'nhk.bsky.social' }, token: 'excludeAuthor=' },
  { platform: 'bluesky', concept: 'mentionsUser', label: 'メンション先', state: { mentionsUser: 'nhk.bsky.social' }, token: 'mentions=' },
  { platform: 'bluesky', concept: 'excludeMentions', label: '除外メンション先', state: { excludeMentions: 'nhk.bsky.social' }, token: 'excludeMentions=' },
  { platform: 'bluesky', concept: 'domain', label: 'リンク先', state: { domain: 'nhk.or.jp' }, token: 'domain=' },
  { platform: 'bluesky', concept: 'excludeDomain', label: '除外リンク先', state: { excludeDomain: 'nhk.or.jp' }, token: 'excludeDomain=' },
  { platform: 'bluesky', concept: 'linkUrl', label: '埋め込みURL', state: { linkUrl: 'example.com/test' }, token: 'url=' },
  { platform: 'bluesky', concept: 'excludeLinkUrl', label: '除外埋め込みURL', state: { excludeLinkUrl: 'example.com/test' }, token: 'excludeUrl=' },
  { platform: 'bluesky', concept: 'hashtagOr', label: 'ハッシュタグ(OR)', state: { hashtagOr: 'cat dog' }, token: 'tag=' },
  { platform: 'bluesky', concept: 'excludeHashtag', label: 'ハッシュタグ除外', state: { excludeHashtag: 'cat' }, token: 'excludeTag=' },
  { platform: 'bluesky', concept: 'videoOnly', label: '動画付きのみ', state: { videoOnly: true }, token: 'video=true' },
  { platform: 'bluesky', concept: 'excludeReplies', label: '返信除外', state: { excludeReplies: true }, token: 'replies=none' },
  { platform: 'bluesky', concept: 'repliesOnly', label: '返信のみ', state: { repliesOnly: true }, token: 'replies=only' },
  { platform: 'bluesky', concept: 'followingOnly', label: 'フォロー中のみ', state: { followingOnly: true }, token: 'following=true' },
  { platform: 'bluesky', concept: 'period', label: '期間(以降)', state: { since: '2026-06-01' }, token: 'since:' },
  { platform: 'bluesky', concept: 'period', label: '期間(以前)', state: { until: '2026-06-08' }, token: 'until:' },
  { platform: 'bluesky', concept: 'language', label: '言語', state: { language: 'ja' }, token: 'lang=ja' },
  { platform: 'bluesky', concept: 'sortOrder', label: '新しい順', state: { sort: 'new' }, token: 'tab=latest' },
  { platform: 'bluesky', concept: 'mediaOnly', label: 'メディア', state: { mediaOnly: true }, token: 'media=true' },
  { platform: 'bluesky', concept: 'resultType', label: '探す=プロフィール', state: { resultType: 'people' }, token: 'tab=user' },

  // ---- YouTube (sp= は protobuf base64。チェックリストの sp 値の本体を照合キーにする) ----
  { platform: 'youtube', concept: 'titleOnly', label: 'タイトルだけ', state: { titleOnly: true }, token: 'intitle:' },
  { platform: 'youtube', concept: 'period', label: '期間(以降)', state: { since: '2026-06-25' }, token: 'after:' },
  { platform: 'youtube', concept: 'period', label: '期間(以前)', state: { until: '2026-06-30' }, token: 'before:' },
  // sp= は並び順・種別・長さを1つに合成する。チェックリストの各値は「その1種だけ」の
  // 合成なので、並び順の混入を避けるため sort:'auto'(並び順バイトを付けない)で単独値にする
  { platform: 'youtube', concept: 'sortOrder', label: '人気順(視聴回数)', state: { sort: 'top' }, token: 'CAM' },
  { platform: 'youtube', concept: 'videoLength', label: '動画の長さ(短)', state: { sort: 'auto', videoLength: 'short' }, token: 'EgIYAQ' },
  { platform: 'youtube', concept: 'liveOnly', label: 'ライブ', state: { sort: 'auto', liveOnly: true }, token: 'EgJAAQ' },
  { platform: 'youtube', concept: 'fourK', label: '4K', state: { sort: 'auto', fourK: true }, token: 'EgJwAQ' },
  { platform: 'youtube', concept: 'hdOnly', label: 'HD', state: { sort: 'auto', hdOnly: true }, token: 'EgIgAQ' },
  { platform: 'youtube', concept: 'captionsOnly', label: '字幕', state: { sort: 'auto', captionsOnly: true }, token: 'EgIoAQ' },
  { platform: 'youtube', concept: 'creativeCommons', label: 'クリエイティブ・コモンズ', state: { sort: 'auto', creativeCommons: true }, token: 'EgIwAQ' },
  { platform: 'youtube', concept: 'threeSixty', label: '360°', state: { sort: 'auto', threeSixty: true }, token: 'EgJ4AQ' },
  { platform: 'youtube', concept: 'vr180', label: 'VR180', state: { sort: 'auto', vr180: true }, token: 'EgPQAQE' },
  { platform: 'youtube', concept: 'threeD', label: '3D', state: { sort: 'auto', threeD: true }, token: 'EgI4AQ' },
  { platform: 'youtube', concept: 'hdr', label: 'HDR', state: { sort: 'auto', hdr: true }, token: 'EgPIAQE' },
  { platform: 'youtube', concept: 'locationOnly', label: '場所', state: { sort: 'auto', locationOnly: true }, token: 'EgO4AQE' },
  { platform: 'youtube', concept: 'purchased', label: '購入済み', state: { sort: 'auto', purchased: true }, token: 'EgJIAQ' },
  { platform: 'youtube', concept: 'resultType', label: '探す=チャンネル', state: { sort: 'auto', resultType: 'channel' }, token: 'EgIQAg' },
  { platform: 'youtube', concept: 'resultType', label: '探す=ショート', state: { sort: 'auto', resultType: 'short' }, token: 'EgIQCQ' },
  { platform: 'youtube', concept: 'resultType', label: '探す=再生リスト', state: { sort: 'auto', resultType: 'playlist' }, token: 'EgIQAw' },
  { platform: 'youtube', concept: 'keywordsOr', label: 'このどれかを含む', state: { terms: ['手芸'], keywordsOr: '猫 犬' }, token: '%7C', emit: '猫|犬' },

  // ---- note ----
  { platform: 'note', concept: 'fromUser', label: '送信者', state: { fromUser: 'info' }, token: 'from:@' },
  { platform: 'note', concept: 'sortOrder', label: '新しい順', state: { sort: 'new' }, token: 'sort=new' },
  { platform: 'note', concept: 'sortOrder', label: '急上昇', state: { sort: 'hot' }, token: 'sort=hot' },
  { platform: 'note', concept: 'paidOnly', label: '有料のみ', state: { paidOnly: true }, token: 'context=note_for_sale' },
  { platform: 'note', concept: 'hashtag', label: 'タグページ', state: TAG_ONLY('読書記録'), token: '/hashtag/' },
  { platform: 'note', concept: 'resultType', label: '探す=クリエイター', state: { resultType: 'people' }, token: 'context=user' },
  { platform: 'note', concept: 'resultType', label: '探す=マガジン', state: { resultType: 'series' }, token: 'context=magazine' },
  { platform: 'note', concept: 'resultType', label: '探す=メンバーシップ', state: { resultType: 'circle' }, token: 'context=circle' },
  { platform: 'note', concept: 'sortOrder', label: 'メンバーシップの新着順', state: { resultType: 'circle', sort: 'new' }, token: 'sort=new' },
  { platform: 'note', concept: 'sortOrder', label: 'メンバーシップの人気順', state: { resultType: 'circle', sort: 'top' }, token: 'sort=popular' },

  // ---- niconico ----
  { platform: 'niconico', concept: 'sortOrder', label: '新しい順', state: { sort: 'new' }, token: 'sort=registeredAt' },
  { platform: 'niconico', concept: 'sortOrder', label: '人気順(再生数)', state: { sort: 'top' }, token: 'sort=viewCount' },
  { platform: 'niconico', concept: 'sortOrder', label: 'コメント数順', state: { sort: 'comments' }, token: 'sort=commentCount' },
  { platform: 'niconico', concept: 'sortOrder', label: 'いいね数順', state: { sort: 'likes' }, token: 'sort=likeCount' },
  { platform: 'niconico', concept: 'sortOrder', label: 'マイリスト数順', state: { sort: 'favorites' }, token: 'sort=mylistCount' },
  { platform: 'niconico', concept: 'sortOrder', label: 'コメント日時順', state: { sort: 'commentDate' }, token: 'sort=lastCommentTime' },
  { platform: 'niconico', concept: 'period', label: '期間(開始)', state: { since: '2026-06-01' }, token: 'start=' },
  { platform: 'niconico', concept: 'period', label: '期間(終了)', state: { until: '2026-06-30' }, token: 'end=' },
  { platform: 'niconico', concept: 'videoLength', label: '長さ(短)', state: { videoLength: 'short' }, token: 'l_range=1' },
  { platform: 'niconico', concept: 'videoLength', label: '長さ(長)', state: { videoLength: 'long' }, token: 'l_range=2' },
  { platform: 'niconico', concept: 'genre', label: 'ジャンル', state: { genre: 'game' }, token: 'genre=' },
  { platform: 'niconico', concept: 'nicoKind', label: '動画種別(ユーザー)', state: { nicoKind: 'user' }, token: 'kind=user' },
  { platform: 'niconico', concept: 'keywordsOr', label: 'このどれかを含む', state: { terms: ['手芸'], keywordsOr: '猫 犬' }, token: '猫 OR 犬' },
  { platform: 'niconico', concept: 'hashtag', label: 'タグページ', state: TAG_ONLY('ゲーム'), token: '/tag/' },
  { platform: 'niconico', concept: 'resultType', label: '探す=ショート', state: { resultType: 'short' }, token: '/search_shorts/' },
  { platform: 'niconico', concept: 'resultType', label: '探す=シリーズ', state: { resultType: 'series' }, token: '/series_search/' },
  { platform: 'niconico', concept: 'resultType', label: '探す=マイリスト', state: { resultType: 'playlist' }, token: '/mylist_search/' },
  { platform: 'niconico', concept: 'resultType', label: '探す=ユーザー', state: { resultType: 'people' }, token: '/user_search/' },
  { platform: 'niconico', concept: 'sortOrder', label: '探す=シリーズの並び順(作成日)', state: { resultType: 'series', sort: 'new' }, token: 'sort=startTime' },
  { platform: 'niconico', concept: 'sortOrder', label: '探す=シリーズの並び順(登録動画数)', state: { resultType: 'series', sort: 'videoCount' }, token: 'sort=videoCount' },
  { platform: 'niconico', concept: 'sortOrder', label: '探す=シリーズの並び順(動画追加日時)', state: { resultType: 'series', sort: 'videoAdded' }, token: 'sort=lastAddedTime' },
  { platform: 'niconico', concept: 'sortOrder', label: '探す=マイリストの並び順(動画追加日時)', state: { resultType: 'playlist', sort: 'videoAdded' }, token: 'sort=lastAddedTime' },
  { platform: 'niconico', concept: 'sortOrder', label: '探す=ユーザーの並び順(投稿動画数)', state: { resultType: 'people', sort: 'videoCount' }, token: 'sort=videoCount' },
  { platform: 'niconico', concept: 'sortOrder', label: '探す=ユーザーの並び順(フォロワー数)', state: { resultType: 'people', sort: 'followerCount' }, token: 'sort=followerCount' },
  { platform: 'niconico', concept: 'sortOrder', label: '探す=ユーザーの並び順(生放送番組数)', state: { resultType: 'people', sort: 'liveCount' }, token: 'sort=liveCount' },

  // ---- ニコニコ静画 ----
  { platform: 'seiga', concept: 'sortOrder', label: '新着順', state: { sort: 'new' }, token: 'sort=image_created' },
  { platform: 'seiga', concept: 'sortOrder', label: '閲覧数順', state: { sort: 'top' }, token: 'sort=image_view' },
  { platform: 'seiga', concept: 'hashtag', label: 'タグページ', state: TAG_ONLY('猫'), token: '/tag/' },
  { platform: 'seiga', concept: 'workType', label: '作品=マンガ', state: { workType: 'manga' }, token: 'manga.nicovideo.jp' },
  { platform: 'seiga', concept: 'keywordsOr', label: 'このどれかを含む', state: { terms: ['手芸'], keywordsOr: '猫 犬' }, token: '猫 OR 犬' },

  // ---- Reddit ----
  { platform: 'reddit', concept: 'fromUser', label: '送信者', state: { fromUser: 'spez' }, token: 'author:' },
  { platform: 'reddit', concept: 'subreddit', label: 'コミュニティ', state: { subreddit: 'japan' }, token: 'subreddit:' },
  { platform: 'reddit', concept: 'period', label: '期間(丸め)', state: { since: '2026-06-25' }, token: 't=' },
  { platform: 'reddit', concept: 'sortOrder', label: '新しい順', state: { sort: 'new' }, token: 'sort=new' },
  { platform: 'reddit', concept: 'sortOrder', label: 'コメント数順', state: { sort: 'comments' }, token: 'sort=comments' },
  { platform: 'reddit', concept: 'titleOnly', label: 'タイトルだけ', state: { titleOnly: true }, token: 'title:', tracked: false, note: '公式・安定の検索フィールド(Boolean検索)。確認リスト対象外' },
  { platform: 'reddit', concept: 'resultType', label: '探す=投稿', state: { resultType: 'posts' }, token: 'type=posts' },
  { platform: 'reddit', concept: 'resultType', label: '探す=コミュニティ', state: { resultType: 'communities' }, token: 'type=communities' },
  { platform: 'reddit', concept: 'resultType', label: '探す=コメント', state: { resultType: 'comments' }, token: 'type=comments' },
  { platform: 'reddit', concept: 'resultType', label: '探す=メディア', state: { resultType: 'media' }, token: 'type=media' },
  { platform: 'reddit', concept: 'resultType', label: '探す=プロフィール', state: { resultType: 'people' }, token: 'type=people' },
  { platform: 'reddit', concept: 'keywordsOr', label: 'このどれかを含む', state: { terms: ['yarn'], keywordsOr: 'cats dogs' }, token: '(cats OR dogs)', emit: '(cats+OR+dogs)' },

  // ---- pixiv ----
  { platform: 'pixiv', concept: 'titleOnly', label: 'タイトルだけ', state: { titleOnly: true }, token: 's_mode=s_tc' },
  { platform: 'pixiv', concept: 'exactTag', label: 'タグ完全一致', state: { exactTag: true }, token: 's_mode=s_tag_full' },
  { platform: 'pixiv', concept: 'tagTitleCaption', label: 'タグ・タイトル・キャプション', state: { tagTitleCaption: true }, token: 's_mode=tag_tc' },
  { platform: 'pixiv', concept: 'pixivPopular', label: '人気の目安', state: { pixivPopular: '000users' }, token: 'users入り', emit: '000users' },
  { platform: 'pixiv', concept: 'period', label: '期間(開始)', state: { since: '2026-06-01' }, token: 'scd=' },
  { platform: 'pixiv', concept: 'period', label: '期間(終了)', state: { until: '2026-06-30' }, token: 'ecd=' },
  { platform: 'pixiv', concept: 'sortOrder', label: '人気順', state: { sort: 'top' }, token: 'order=popular_d' },
  { platform: 'pixiv', concept: 'ageRating', label: '年齢(全年齢)', state: { ageRating: 'safe' }, token: 'mode=safe' },
  { platform: 'pixiv', concept: 'ageRating', label: '年齢(R18)', state: { ageRating: 'r18' }, token: 'mode=r18' },
  { platform: 'pixiv', concept: 'excludeAi', label: 'AI除外', state: { excludeAi: true }, token: 'ai_type=1' },
  { platform: 'pixiv', concept: 'workType', label: '作品=マンガ', state: { workType: 'manga' }, token: '/manga' },
  { platform: 'pixiv', concept: 'workType', label: '作品=イラスト', state: { workType: 'illust' }, token: '/illustrations' },
  { platform: 'pixiv', concept: 'workType', label: '作品=うごく', state: { workType: 'ugoira' }, token: 'type=ugoira' },
  { platform: 'pixiv', concept: 'workType', label: '作品=小説', state: { workType: 'novel' }, token: '/novels' },
  { platform: 'pixiv', concept: 'keywordsOr', label: 'このどれかを含む', state: { terms: ['手芸'], keywordsOr: '猫 犬' }, token: '(猫 OR 犬)' },

  // ---- Misskey ----
  { platform: 'misskey', concept: 'fromUser', label: '送信者', state: { fromUser: 'syuilo' }, token: 'username=' },
  { platform: 'misskey', concept: 'hashtag', label: 'タグページ', state: TAG_ONLY('天気'), token: '/tags/' },
  { platform: 'misskey', concept: 'exclude', label: '除外', state: { exclude: 'dog' }, token: '-dog' },

  // ---- はてなブックマーク ----
  { platform: 'hatebu', concept: 'period', label: '期間(開始)', state: { since: '2024-01-01' }, token: 'date_begin=' },
  { platform: 'hatebu', concept: 'period', label: '期間(終了)', state: { until: '2024-06-30' }, token: 'date_end=' },
  { platform: 'hatebu', concept: 'minLikes', label: '最低ブクマ数', state: { minLikes: '100' }, token: 'users=' },
  { platform: 'hatebu', concept: 'sortOrder', label: '新着順', state: { sort: 'new' }, token: 'sort=recent' },
  { platform: 'hatebu', concept: 'titleOnly', label: 'タイトルだけ', state: { titleOnly: true }, token: '/search/title' },
  { platform: 'hatebu', concept: 'hashtag', label: 'タグ検索', state: TAG_ONLY('python'), token: '/search/tag' },
  { platform: 'hatebu', concept: 'safeSearchOff', label: 'セーフサーチ解除', state: { safeSearchOff: true }, token: 'safe=off' },

  // ---- Twitch ----
  { platform: 'twitch', concept: 'resultType', label: '探す=動画', state: { resultType: 'video' }, token: 'type=videos' },
  { platform: 'twitch', concept: 'resultType', label: '探す=チャンネル', state: { resultType: 'channel' }, token: 'type=channels' },

  // ---- あにまん掲示板 ----
  { platform: 'animanch', concept: 'keywords', label: 'レス本文', state: {}, token: '/searchRes/' },
  { platform: 'animanch', concept: 'titleOnly', label: 'タイトルだけ', state: { titleOnly: true }, token: '/search2/' },

  // ---- tumblr ----
  { platform: 'tumblr', concept: 'sortOrder', label: '最新順', state: { sort: 'new' }, token: '/recent' },
  { platform: 'tumblr', concept: 'hashtag', label: 'タグページ', state: TAG_ONLY('猫'), token: '/tagged/' },
  { platform: 'tumblr', concept: 'hashtag', label: 'タグ複数(AND)', state: { terms: [''], hashtag: 'photography sunset' }, token: '#sunset' },
  { platform: 'tumblr', concept: 'exclude', label: '除外', state: { exclude: 'dog' }, token: '-dog' },
  { platform: 'tumblr', concept: 'fromUser', label: '送信者', state: { fromUser: 'staff' }, token: 'from:staff' },
  { platform: 'tumblr', concept: 'exactPhrase', label: '完全一致', state: { exactPhrase: ['golden retriever puppy'] }, token: '"golden retriever puppy"' },
  { platform: 'tumblr', concept: 'period', label: '期間(以降)', state: { since: '2026-06-01' }, token: 'since:' },
  { platform: 'tumblr', concept: 'period', label: '期間(以前)', state: { until: '2026-06-08' }, token: 'before:' },
  { platform: 'tumblr', concept: 'mediaOnly', label: '画像・動画', state: { mediaOnly: true }, token: 'postTypes=photo' },
  { platform: 'tumblr', concept: 'linksOnly', label: 'リンク', state: { linksOnly: true }, token: 'postTypes=link' },

  // ---- Mastodon ----
  { platform: 'mastodon', concept: 'exclude', label: '除外', state: { exclude: 'România' }, token: '-România' },
  { platform: 'mastodon', concept: 'exactPhrase', label: '完全一致', state: { exactPhrase: ['conectivitate la internet'] }, token: '"conectivitate la internet"' },
  { platform: 'mastodon', concept: 'fromUser', label: '送信者', state: { fromUser: 'Gargron' }, token: 'from:Gargron' },
  { platform: 'mastodon', concept: 'hashtag', label: 'タグページ', state: TAG_ONLY('cats'), token: '/tags/' },
  { platform: 'mastodon', concept: 'period', label: '期間(以降)', state: { since: '2026-06-01' }, token: 'after:' },
  { platform: 'mastodon', concept: 'period', label: '期間(以前)', state: { until: '2026-06-08' }, token: 'before:' },
  { platform: 'mastodon', concept: 'mediaOnly', label: 'メディア', state: { mediaOnly: true }, token: 'has:media' },
  { platform: 'mastodon', concept: 'linksOnly', label: 'リンク', state: { linksOnly: true }, token: 'has:link' },
  { platform: 'mastodon', concept: 'excludeReplies', label: '返信除外', state: { excludeReplies: true }, token: '-is:reply' },
  { platform: 'mastodon', concept: 'language', label: '言語', state: { language: 'ja' }, token: 'language:' },

  // ---- Pinterest ----
  { platform: 'pinterest', concept: 'resultType', label: '探す=動画', state: { resultType: 'video' }, token: '/search/videos/' },
  { platform: 'pinterest', concept: 'resultType', label: '探す=ボード', state: { resultType: 'board' }, token: '/search/boards/' },
  { platform: 'pinterest', concept: 'resultType', label: '探す=プロフィール', state: { resultType: 'people' }, token: '/search/users/' },

  // ---- FANBOX ----
  { platform: 'fanbox', concept: 'hashtag', label: 'タグページ', state: TAG_ONLY('猫'), token: '/tags/' },

  // ---- bilibili ----
  { platform: 'bilibili', concept: 'sortOrder', label: '新しい順', state: { sort: 'new' }, token: 'order=pubdate' },
  { platform: 'bilibili', concept: 'sortOrder', label: '人気順(再生数)', state: { sort: 'top' }, token: 'order=click' },
  { platform: 'bilibili', concept: 'sortOrder', label: '弾幕数順', state: { sort: 'danmaku' }, token: 'order=dm' },
  { platform: 'bilibili', concept: 'sortOrder', label: '収蔵数順', state: { sort: 'favorites' }, token: 'order=stow' },
  { platform: 'bilibili', concept: 'sortOrder', label: 'いいね順(コラム)', state: { resultType: 'article', sort: 'likes' }, token: 'order=attention' },
  { platform: 'bilibili', concept: 'sortOrder', label: 'コメント数順(コラム)', state: { resultType: 'article', sort: 'comments' }, token: 'order=scores' },
  { platform: 'bilibili', concept: 'sortOrder', label: '新規開始順(直播)', state: { resultType: 'live', sort: 'new' }, token: 'order=live_time' },
  { platform: 'bilibili', concept: 'videoLength', label: '長さ(短)', state: { videoLength: 'short' }, token: 'duration=1' },
  { platform: 'bilibili', concept: 'videoLength', label: '長さ(中)', state: { videoLength: 'medium' }, token: 'duration=2' },
  { platform: 'bilibili', concept: 'videoLength', label: '長さ(長)', state: { videoLength: 'long' }, token: 'duration=4' },
  { platform: 'bilibili', concept: 'period', label: '期間(開始)', state: { since: '2026-06-01' }, token: 'pubtime_begin_s=' },
  { platform: 'bilibili', concept: 'period', label: '期間(終了)', state: { until: '2026-06-30' }, token: 'pubtime_end_s=' },
  { platform: 'bilibili', concept: 'resultType', label: '探す=動画', state: { resultType: 'video' }, token: '/video?' },
  { platform: 'bilibili', concept: 'resultType', label: '探す=アニメ番組', state: { resultType: 'bangumi' }, token: '/bangumi' },
  { platform: 'bilibili', concept: 'resultType', label: '探す=映画・ドラマ', state: { resultType: 'pgc' }, token: '/pgc' },
  { platform: 'bilibili', concept: 'resultType', label: '探す=生放送', state: { resultType: 'live' }, token: '/live' },
  { platform: 'bilibili', concept: 'resultType', label: '探す=コラム記事', state: { resultType: 'article' }, token: '/article' },
  { platform: 'bilibili', concept: 'resultType', label: '探す=チャンネル', state: { resultType: 'channel' }, token: '/upuser' },

  // ---- Fantia ----
  { platform: 'fantia', concept: 'titleOnly', label: 'タイトルと本文', state: { titleOnly: false }, token: 'keyword_type=all' },
  { platform: 'fantia', concept: 'titleOnly', label: 'タイトルのみ', state: { titleOnly: true }, token: 'keyword_type=title_only' },
  { platform: 'fantia', concept: 'fantiaCategory', label: 'カテゴリー', state: { fantiaCategory: 'illust' }, token: 'category=illust' },
  { platform: 'fantia', concept: 'fantiaAudience', label: '対象読者(男性向け)', state: { fantiaAudience: 'male' }, token: 'brand_type=0' },
  { platform: 'fantia', concept: 'fantiaAudience', label: '対象読者(女性向け)', state: { fantiaAudience: 'female' }, token: 'brand_type=2' },
  { platform: 'fantia', concept: 'sortOrder', label: '新しい順', state: { sort: 'new' }, token: 'order=newer' },
  { platform: 'fantia', concept: 'sortOrder', label: 'お気に入り数順', state: { sort: 'top' }, token: 'order=popular' },
]

// ---- support 整合(静かな嘘の検知): support が「効く」と言う概念が実際に効くか ----------
//
// resolve は support 表(＋dynamicSupport)だけを見て「適用/近似/非対応」を決め、buildUrl が
// 本当にその概念を送ったかは照合していない。つまり support[c]=full/partial のまま buildUrl が
// その概念を握りつぶすと、画面は「適用」と緑で出すのに実際は何も送られない(=静かな嘘)。
// これは2026-07-04監査で見つけて手で直した食い違いそのもので、再発を止める機械チェックが無かった。
//
// 方式=差分。ある概念 c を「指定あり」にした state と、そこから c だけを既定へ戻した state で
// buildUrl の出力を比べ、変われば「c は実際に効いている」と実証できる。support が full/partial と
// 言う (サイト×概念) すべてに、実証できる入力が最低1つ在ることを要求する(なければ静かな嘘の疑い)。

const DEFAULTS = defaultState()

/**
 * 差分チェックの例外: 「URLは変わらないが、そのサイトの固定挙動で意図が満たされる」概念。
 * `${platform}::${concept}` をキーに列挙する。ここに載る = 静かな嘘の検知を免除する代わりに、
 * 「なぜ URL 差分が無くても support=partial/full が正当か」を人が説明する責任を負う。
 * 濫用すると静かな嘘の隠れ場所になるので、①support は必ず partial 以下＋注記つき ②理由を明記、
 * を満たすものだけに絞る。免除分も出力に必ず表示して後から監査できるようにする。
 *
 * - fivech::titleOnly: ff5ch(スレタイ検索)は常にタイトルだけが対象。トグルは送る演算子を持たず
 *   URLを変えないが、ユーザーの意図(タイトルのみ検索)は既定挙動で満たされる。support=partial＋
 *   note.fivech.titleOnly「切り替えに関わらず常にタイトルを検索」で正直に伝えている(嘘ではない)。
 */
const SATISFIED_BY_DEFAULT: ReadonlySet<string> = new Set(['fivech::titleOnly'])

/** 概念 c の入力フィールドを既定値へ戻した state(差分チェックで c だけを消す)。period は since/until の2値 */
function clearConcept(state: QueryState, concept: ConceptId): QueryState {
  if (concept === 'period') return { ...state, since: DEFAULTS.since, until: DEFAULTS.until }
  const field = CONCEPT_MAP[concept].field
  return { ...state, [field]: DEFAULTS[field] }
}

/**
 * 概念 c を「指定あり」にする代表 state 群(BASE=terms:['猫'] に重ねた完全な state)。
 * select/sort は各選択肢を、それ以外は widget 種別ごとの代表値を入れる。PROBE の state と併せて
 * coverage の証拠候補にする(どれか1つでも buildUrl 出力を変えれば実証)
 */
function coverageStatesFor(concept: ConceptId): QueryState[] {
  const def = CONCEPT_MAP[concept]
  const f = def.field
  const mk = (over: Partial<QueryState>): QueryState => ({ ...BASE, ...over })
  if (concept === 'keywords') return [BASE] // BASE が既に terms:['猫']=指定あり
  if (concept === 'exactPhrase') return [mk({ exactPhrase: ['冷蔵庫で富士山'] })]
  if (concept === 'period') return [mk({ since: '2026-06-01', until: '2026-06-30' })]
  if (def.widget === 'toggle') return [mk({ [f]: true })]
  if (def.widget === 'sort') return SORT_OPTIONS.filter((o) => o.value !== 'auto').map((o) => mk({ sort: o.value }))
  if (def.widget === 'select') return (SELECT_OPTIONS[concept] ?? []).filter((o) => o.value).map((o) => mk({ [f]: o.value }))
  // plain / chips: サイトごとに現実的なサンプル値を入れる(sampleStates と同じ選び方)
  const sentinel =
    f === 'domain'
      ? 'nhk.or.jp'
      : f === 'minLikes' || f === 'minReposts' || f === 'minReplies'
        ? '500'
        : f === 'subreddit'
          ? 'japan'
          : f === 'xList'
            ? '1215911364234924032'
            : f === 'hashtag'
              ? 'ゲーム'
              : 'nhk'
  return [mk({ [f]: sentinel })]
}

// ---- 演算子面の抽出(安全網用): URLから param キーと word: 演算子を拾う -------------

/** 生成した網羅サンプル(安全網で全サイトに通す) */
function sampleStates(): QueryState[] {
  const out: QueryState[] = [BASE, { ...defaultState(), hashtag: 'ゲーム' }]
  for (const def of CONCEPT_DEFS) {
    const f = def.field
    if (def.id === 'keywords') continue // 素地に含む
    if (def.id === 'exactPhrase') {
      out.push({ ...BASE, exactPhrase: ['冷蔵庫で富士山'] })
      continue
    }
    if (def.widget === 'toggle') out.push({ ...BASE, [f]: true })
    else if (def.widget === 'sort') for (const o of SORT_OPTIONS) out.push({ ...BASE, sort: o.value })
    else if (def.widget === 'select') {
      // 波括弧が要る: 内側の if(o.value) に後続の else が結合する「ぶら下がり else」を防ぐ
      for (const o of SELECT_OPTIONS[def.id] ?? []) if (o.value) out.push({ ...BASE, [f]: o.value })
    } else if (def.widget === 'period') out.push({ ...BASE, since: '2026-06-01', until: '2026-06-30' })
    else {
      const sentinel =
        f === 'domain'
          ? 'nhk.or.jp'
          : f === 'minLikes' || f === 'minReposts' || f === 'minReplies'
            ? '500'
            : f === 'subreddit'
              ? 'japan'
              : f === 'xList'
                ? '1215911364234924032'
                : 'nhk'
      out.push({ ...BASE, [f]: sentinel })
    }
  }
  return out
}

/** URLから「演算子キー面」を集める: query param の `key=` と、q内の `word:`/`filter:x` */
function surfacesOf(url: string): Set<string> {
  const set = new Set<string>()
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return set
  }
  // 検索テキストを載せる param 名(演算子ではない)。query は YouTube のチャンネル内検索
  // (/@handle/search?query=) が使う検索語欄で、q/search_query と等価
  const IGNORE_KEYS = new Set(['q', 'term', 'search_query', 'query', 'keyword', 'context', 'host', 'sp'])
  for (const key of u.searchParams.keys()) {
    if (!IGNORE_KEYS.has(key)) set.add(`${key}=`)
  }
  const q = u.searchParams.get('q') ?? u.searchParams.get('term') ?? u.searchParams.get('search_query') ?? ''
  const decoded = decodeURIComponent(q)
  for (const m of decoded.matchAll(/-?filter:[a-z_]+/g)) set.add(m[0])
  for (const m of decoded.matchAll(/-?[a-z_]+:/g)) {
    if (!m[0].includes('filter')) set.add(m[0])
  }
  return set
}

// ---- 実行 --------------------------------------------------------------------

function buildFor(platform: PlatformId, state: Partial<QueryState>): string | null {
  const p = PLATFORMS.find((x) => x.id === platform)!
  try {
    return buildUrl(p, { ...BASE, ...state })
  } catch {
    return null
  }
}

interface Fail {
  kind: 'self' | 'drift' | 'silent' | 'orphan'
  platform: PlatformId
  detail: string
}
const fails: Fail[] = []
const lines: string[] = []
const silentLines: string[] = []
const exemptLines: string[] = []

// 1) 自己検証 + 2) チェックリスト照合
for (const platform of PLATFORMS) {
  const probes = PROBES.filter((pr) => pr.platform === platform.id)
  if (probes.length === 0) continue
  const section = sectionFor(checklist, CHECKLIST_HEADING[platform.id])
  if (!section) {
    fails.push({ kind: 'drift', platform: platform.id, detail: `チェックリストに「${CHECKLIST_HEADING[platform.id]}」の節が見つからない` })
    continue
  }
  lines.push(`\n## ${platform.name}`)
  for (const pr of probes) {
    const url = buildFor(platform.id, pr.state)
    const decoded = url ? decodeURIComponent(url) : ''
    const emit = pr.emit ?? pr.token
    const emitted = url != null && decoded.includes(emit)
    const tracked = pr.tracked !== false
    const inChecklist = section.includes(pr.token)

    let icon = '✅'
    let tail = ''
    if (!emitted) {
      icon = '🟥'
      tail = `  ← buildUrl が "${emit}" を出さない(表がコードとズレ)`
      fails.push({ kind: 'self', platform: platform.id, detail: `${pr.label}: buildUrl 出力に "${emit}" が無い` })
    } else if (!tracked) {
      icon = '⚪'
      tail = `  (確認リスト対象外: ${pr.note ?? ''})`
    } else if (!inChecklist) {
      icon = '🟥'
      tail = `  ← operator-checklist.md の ${platform.name} 節に "${pr.token}" が無い(行の追加漏れ)`
      fails.push({ kind: 'drift', platform: platform.id, detail: `${pr.label} (${pr.concept}): "${pr.token}" がチェックリスト未収録` })
    }
    lines.push(`  ${icon} ${pr.label.padEnd(14)} ${pr.token}${tail}`)
  }
}

// 3) support 整合(静かな嘘の検知): support=full/partial の各概念が buildUrl の出力を実際に変えるか
function tryBuild(platform: (typeof PLATFORMS)[number], state: QueryState): string | null {
  try {
    return buildUrl(platform, state)
  } catch {
    return null
  }
}
for (const platform of PLATFORMS) {
  for (const def of CONCEPT_DEFS) {
    const concept = def.id
    const level = supportOf(platform, concept).level
    if (level === 'none') continue // 非対応の概念は「効くと言っていない」ので対象外

    // 証拠候補 = この (サイト×概念) の PROBE state ＋ 概念定義から導いた代表 state
    const probeStates = PROBES.filter(
      (pr) => pr.platform === platform.id && pr.concept === concept,
    ).map((pr): QueryState => ({ ...BASE, ...pr.state }))
    const candidates = [...probeStates, ...coverageStatesFor(concept)]

    let demonstrated = false
    for (const setState of candidates) {
      // この入力で dynamicSupport が c を none に落とすなら、静的 support の主張の実証にはならない
      if (platform.dynamicSupport?.(setState)[concept]?.level === 'none') continue
      const urlSet = tryBuild(platform, setState)
      if (urlSet == null) continue // 概念単独では検索が成立しない入力(実証に使えない)
      const urlClear = tryBuild(platform, clearConcept(setState, concept))
      if (urlSet !== urlClear) {
        demonstrated = true
        break
      }
    }

    if (!demonstrated) {
      if (SATISFIED_BY_DEFAULT.has(`${platform.id}::${concept}`)) {
        // 免除(サイトの固定挙動で意図が満たされる)。監査できるよう必ず表示するが失敗にはしない
        exemptLines.push(`  ⚪ ${platform.name.padEnd(14)} ${concept} (support=${level}) — 既定挙動で充足(URL差分なしを承知)`)
        continue
      }
      silentLines.push(
        `  🟥 ${platform.name.padEnd(14)} ${concept} (support=${level}) — 指定しても buildUrl 出力が変わらない`,
      )
      fails.push({
        kind: 'silent',
        platform: platform.id,
        detail: `${concept} は support=${level}(効く)と宣言されているが buildUrl が送っていない`,
      })
    }
  }
}

// 4) 安全網: 宣言表にも無い未登録の演算子キーが出ていないか
const known = new Set<string>()
for (const pr of PROBES) {
  const url = buildFor(pr.platform, pr.state)
  if (url) for (const s of surfacesOf(url)) known.add(`${pr.platform}::${s}`)
}
const samples = sampleStates()
const orphanLines: string[] = []
for (const platform of PLATFORMS) {
  const seen = new Set<string>()
  for (const state of samples) {
    const url = buildFor(platform.id, state)
    if (!url) continue
    for (const s of surfacesOf(url)) {
      const key = `${platform.id}::${s}`
      if (!known.has(key) && !seen.has(key)) {
        seen.add(key)
        orphanLines.push(`  🟨 ${platform.name.padEnd(14)} 未登録の演算子面 "${s}" — PROBES に追加を`)
        fails.push({ kind: 'orphan', platform: platform.id, detail: `未登録の演算子面 "${s}"` })
      }
    }
  }
}

// ---- 出力 --------------------------------------------------------------------
console.log('演算子ドリフト検査 (コードが送る演算子 ⇄ operator-checklist.md)')
console.log(lines.join('\n'))
if (silentLines.length || exemptLines.length) {
  console.log('\n## support 整合(静かな嘘の検知)')
  if (silentLines.length) console.log(silentLines.join('\n'))
  if (exemptLines.length) console.log(exemptLines.join('\n'))
}
if (orphanLines.length) {
  console.log('\n## 安全網(未登録の演算子)')
  console.log(orphanLines.join('\n'))
}

const self = fails.filter((f) => f.kind === 'self')
const drift = fails.filter((f) => f.kind === 'drift')
const silent = fails.filter((f) => f.kind === 'silent')
const orphan = fails.filter((f) => f.kind === 'orphan')
console.log(
  `\nSummary: 🟥 自己検証NG ${self.length} / 🟥 チェックリスト未収録 ${drift.length} / 🟥 静かな嘘 ${silent.length} / 🟨 未登録演算子 ${orphan.length}`,
)
if (drift.length) {
  console.log('\n🟥 チェックリスト未収録(operator-checklist.md に行を足すか、PROBES で tracked:false にする):')
  for (const f of drift) console.log(`  ${f.platform}: ${f.detail}`)
}
if (self.length) {
  console.log('\n🟥 自己検証NG(PROBES の token/state が buildUrl とズレている。表を実態に合わせる):')
  for (const f of self) console.log(`  ${f.platform}: ${f.detail}`)
}
if (silent.length) {
  console.log(
    '\n🟥 静かな嘘(support は「効く」と言うのに buildUrl が送っていない。buildUrl を直すか、support を落とす):',
  )
  for (const f of silent) console.log(`  ${f.platform}: ${f.detail}`)
}
console.log(
  '\n凡例: ✅=送信かつ確認リスト収録 / ⚪=送信するが確認リスト対象外(公式・安定) / 🟥=要修正 / 🟨=表に未登録。',
)

if (fails.length) process.exitCode = 1
