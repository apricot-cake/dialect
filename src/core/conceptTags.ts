import type { MessageKey } from '@/i18n'
import type { ConceptId } from './types'

/**
 * 概念(フィールド)に付ける「意図タグ」。フィールド機構の再設計でいう家族メタデータの
 * 土台で、多対多。1つのフィールドが複数タグを持つ(例: sortOrder は「並び順」でも
 * あり「人気」でも「時間」でもある)。用途はまずピッカー内検索の同義語展開で、将来は
 * 姉妹提案・まとめて追加・カテゴリ表示にも使う。
 *
 * タグは粒度が連続している(粗いタグ=ことば/人/時間/人気… で眺める・絞る、細かいタグ=
 * 反応しきい値/宛先… で家族提案)。ここでは代表的なものから始め、網羅はしない
 * (「先に完璧なスキーマを発明せず、必要な形だけ」)。
 */
export type TagId =
  | 'word' // ことば・キーワード
  | 'person' // 人・発信者
  | 'time' // 時間・期間
  | 'popular' // 人気・話題
  | 'reaction' // 反応数(いいね等のしきい値)
  | 'target' // 宛先・返信・メンション
  | 'format' // 形式・種類
  | 'media' // 画像・動画などメディア
  | 'size' // 長さ・寸法
  | 'genre' // ジャンル・分野
  | 'order' // 並び順
  | 'exclude' // 除外
  | 'tag' // タグ・ハッシュタグ
  | 'place' // コミュニティ・場・リスト
  | 'link' // リンク・ドメイン
  | 'lang' // 言語
  | 'verified' // 認証済み
  | 'age' // 年齢制限・センシティブ
  | 'production' // 制作(AI・作られ方)

export interface TagDef {
  id: TagId
  /**
   * 意図語の同義語。日英とも、正規化前の自然な表記で書いてよい
   * (インデックス構築時に normalizeForSearch を通すため、かな/カナ/全半角のゆれは吸収される)。
   * 基準は「意図満足テスト」= この語を打った人がこのフィールドを見て満足するか
   * (単なる語連想ではない)。人がレビューする層なので、同義語は緩めに気前よく足してよい。
   */
  synonyms: { ja: string[]; en: string[] }
}

export const TAG_DEFS: Record<TagId, TagDef> = {
  word: {
    id: 'word',
    synonyms: {
      ja: ['キーワード', 'ことば', '語', '語句', 'フレーズ', '単語', '本文'],
      en: ['keyword', 'word', 'phrase', 'text', 'term'],
    },
  },
  person: {
    id: 'person',
    synonyms: {
      ja: ['ユーザー', 'ユーザ', '人', 'アカウント', 'アカ', '誰', '投稿者', '発信者'],
      en: ['user', 'account', 'who', 'author', 'poster', 'person', 'handle'],
    },
  },
  time: {
    id: 'time',
    synonyms: {
      ja: ['期間', '日付', '日時', 'いつ', '最新', '新着', '新しい', '時期', '日にち'],
      en: ['date', 'time', 'when', 'recent', 'latest', 'period', 'since', 'until'],
    },
  },
  popular: {
    id: 'popular',
    synonyms: {
      ja: ['人気', 'バズ', '伸びてる', '伸びている', '話題', '注目', '盛り上がり', 'トレンド'],
      en: ['popular', 'buzz', 'trending', 'viral', 'hot', 'top'],
    },
  },
  reaction: {
    id: 'reaction',
    synonyms: {
      ja: ['いいね', 'リアクション', '反応', '反応数', 'しきい値', '最低', '以上'],
      en: ['likes', 'reactions', 'engagement', 'minimum', 'at least'],
    },
  },
  target: {
    id: 'target',
    synonyms: {
      ja: ['宛先', '宛て', 'あて', '返信先', 'リプ先', 'メンション', '返信'],
      en: ['reply', 'replies', 'to', 'mention', 'recipient'],
    },
  },
  format: {
    id: 'format',
    synonyms: {
      ja: ['形式', '種類', 'タイプ', '種別', '形態'],
      en: ['format', 'type', 'kind'],
    },
  },
  media: {
    id: 'media',
    synonyms: {
      ja: ['メディア', '画像', '動画', '写真', '映像', '画質', 'ビデオ', 'イラスト'],
      en: ['media', 'image', 'photo', 'video', 'picture', 'movie'],
    },
  },
  size: {
    id: 'size',
    synonyms: {
      ja: ['長さ', '尺', '再生時間', '寸法', '短い', '長い', 'サイズ'],
      en: ['length', 'duration', 'size', 'short', 'long'],
    },
  },
  genre: {
    id: 'genre',
    synonyms: {
      ja: ['ジャンル', '分野', 'カテゴリ'],
      en: ['genre', 'category', 'topic'],
    },
  },
  order: {
    id: 'order',
    synonyms: {
      ja: ['並び', '並び順', '順番', '順序', 'ソート', '並べ替え'],
      en: ['sort', 'order', 'ranking', 'arrange'],
    },
  },
  exclude: {
    id: 'exclude',
    synonyms: {
      ja: ['除外', '除く', 'のぞく', '抜く', 'なし', '含まない', '以外', 'ミュート'],
      en: ['exclude', 'without', 'not', 'minus', 'remove'],
    },
  },
  tag: {
    id: 'tag',
    synonyms: {
      ja: ['タグ', 'ハッシュタグ', 'ラベル'],
      en: ['tag', 'hashtag', 'label'],
    },
  },
  place: {
    id: 'place',
    synonyms: {
      ja: ['コミュニティ', '板', 'サブレディット', 'リスト', '場所', 'グループ'],
      en: ['community', 'subreddit', 'board', 'list', 'group'],
    },
  },
  link: {
    id: 'link',
    synonyms: {
      ja: ['リンク', 'ドメイン', 'サイト', '外部リンク'],
      en: ['link', 'url', 'domain', 'site'],
    },
  },
  lang: {
    id: 'lang',
    synonyms: {
      ja: ['言語', '何語', '日本語', '英語', '中国語'],
      en: ['language', 'lang', 'locale'],
    },
  },
  verified: {
    id: 'verified',
    synonyms: {
      ja: ['認証', '認証済み', '公式', 'バッジ', '青バッジ'],
      en: ['verified', 'official', 'badge', 'blue'],
    },
  },
  age: {
    id: 'age',
    synonyms: {
      ja: ['年齢', '年齢制限', '全年齢', 'センシティブ', '成人'],
      en: ['age', 'rating', 'r18', 'nsfw', 'sensitive', 'adult'],
    },
  },
  production: {
    id: 'production',
    synonyms: {
      ja: ['AI', '生成AI', '生成', '制作', '作られ方'],
      en: ['ai', 'generated', 'generation'],
    },
  },
}

/**
 * 概念→タグ(多対多)。ConceptDef 本体は触らない別テーブルにして、検索が要らない
 * 場所(buildUrl 等)にタグを混ぜない。未記載の概念はタグ無しとして扱い、ラベルと
 * ヘルプ文だけで検索にヒットする。
 */
export const CONCEPT_TAGS: Partial<Record<ConceptId, TagId[]>> = {
  keywords: ['word'],
  exactPhrase: ['word'],
  exclude: ['exclude', 'word'],
  titleOnly: ['word'],
  exactTag: ['tag', 'word'],
  tagTitleCaption: ['tag', 'word'],
  fromUser: ['person'],
  excludeUser: ['person', 'exclude'],
  toUser: ['person', 'target'],
  mentionsUser: ['person', 'target'],
  subreddit: ['place'],
  domain: ['link', 'place'],
  xList: ['place', 'person'],
  hashtag: ['tag', 'word'],
  period: ['time'],
  mediaOnly: ['media', 'format'],
  videoLength: ['size', 'media'],
  linksOnly: ['link', 'format'],
  verifiedOnly: ['verified', 'person'],
  excludeReplies: ['exclude', 'target'],
  liveOnly: ['media', 'format'],
  fourK: ['media', 'format'],
  hdOnly: ['media', 'format'],
  captionsOnly: ['media', 'format'],
  creativeCommons: ['media', 'format'],
  threeSixty: ['media', 'format'],
  vr180: ['media', 'format'],
  threeD: ['media', 'format'],
  hdr: ['media', 'format'],
  locationOnly: ['place', 'media'],
  purchased: ['media', 'format'],
  minLikes: ['reaction', 'popular'],
  minReposts: ['reaction', 'popular'],
  minReplies: ['reaction', 'target'],
  language: ['lang'],
  workType: ['format', 'media'],
  genre: ['genre', 'format'],
  nicoKind: ['format', 'person'],
  paidOnly: ['format'],
  fantiaCategory: ['genre', 'format'],
  fantiaAudience: ['age'],
  safeSearchOff: ['age'],
  resultType: ['format', 'media'],
  sortOrder: ['order', 'time', 'popular'],
  pixivPopular: ['popular', 'reaction'],
  ageRating: ['age'],
  excludeAi: ['production', 'exclude'],
}

/**
 * 値レベルのタグ。同じ概念でも値ごとに別の意図に属する(sortOrder=新しい順→時間、
 * =人気順→人気)。キーは `${ConceptId}:${optionValue}` で SELECT_OPTIONS / SORT_OPTIONS の
 * value と対応する。インデックス構築時に、その概念が持つ各値のタグの同義語も
 * 概念のコーパスへ足す(「人気順」で sortOrder が浮くなど)。
 *
 * 現状の概念では概念レベルのタグと重なるものが多い(冗長でも無害)が、値ごとに家族が
 * 分かれる仕組みを先に用意しておく。フィールドが増えるとここが効いてくる。
 */
export const VALUE_TAGS: Record<string, TagId[]> = {
  'sortOrder:new': ['time'],
  'sortOrder:top': ['popular'],
  'sortOrder:hot': ['popular'],
  'sortOrder:comments': ['popular', 'reaction'],
  'sortOrder:danmaku': ['popular', 'reaction'],
  'sortOrder:favorites': ['popular', 'reaction'],
  'sortOrder:likes': ['popular', 'reaction'],
  'sortOrder:commentDate': ['time', 'reaction'],
  'resultType:short': ['size', 'media'],
  'resultType:video': ['media'],
  'workType:manga': ['media'],
  'workType:ugoira': ['media'],
  'workType:novel': ['word'],
  'videoLength:short': ['size'],
  'videoLength:long': ['size'],
}

// ---- カテゴリ(粗いタグの閲覧軸) ----
// ピッカーの「種類でしぼる」チップ。タグは多重所属だが、フィルタ表示は代表カテゴリ1つに
// 寄せてノイズを避ける(family-map が静的表示に許した「代表タグ1個」の派生ルール)。

export type CategoryId = 'word' | 'person' | 'popular' | 'media' | 'time' | 'age' | 'lang'

export interface CategoryDef {
  id: CategoryId
  labelKey: MessageKey
}

/** チップの表示順。おおむね使用頻度・件数の多い順 */
export const CATEGORIES: CategoryDef[] = [
  { id: 'word', labelKey: 'cat.word' },
  { id: 'person', labelKey: 'cat.person' },
  { id: 'popular', labelKey: 'cat.popular' },
  { id: 'media', labelKey: 'cat.media' },
  { id: 'time', labelKey: 'cat.time' },
  { id: 'age', labelKey: 'cat.age' },
  { id: 'lang', labelKey: 'cat.lang' },
]

/** 各概念の代表カテゴリ(1対1)。全 ConceptId を網羅する */
export const CONCEPT_CATEGORY: Record<ConceptId, CategoryId> = {
  keywords: 'word',
  exactPhrase: 'word',
  exclude: 'word',
  titleOnly: 'word',
  exactTag: 'word',
  tagTitleCaption: 'word',
  hashtag: 'word',
  fromUser: 'person',
  excludeUser: 'person',
  toUser: 'person',
  mentionsUser: 'person',
  xList: 'person',
  verifiedOnly: 'person',
  subreddit: 'person',
  excludeReplies: 'person',
  minLikes: 'popular',
  minReposts: 'popular',
  minReplies: 'popular',
  pixivPopular: 'popular',
  mediaOnly: 'media',
  videoLength: 'media',
  liveOnly: 'media',
  fourK: 'media',
  hdOnly: 'media',
  captionsOnly: 'media',
  creativeCommons: 'media',
  threeSixty: 'media',
  vr180: 'media',
  threeD: 'media',
  hdr: 'media',
  locationOnly: 'media',
  purchased: 'media',
  linksOnly: 'media',
  domain: 'media',
  workType: 'media',
  resultType: 'media',
  genre: 'media',
  nicoKind: 'media',
  paidOnly: 'media',
  fantiaCategory: 'media',
  period: 'time',
  sortOrder: 'time',
  ageRating: 'age',
  excludeAi: 'age',
  fantiaAudience: 'age',
  safeSearchOff: 'age',
  language: 'lang',
}

// ---- 家族(姉妹提案・まとめて追加) ----
// 同じ意図の「別サイト版」を束ねる。型(F/S/B)が同じメンバーに限る=まとめて追加は全員追加で
// よい。型が違う姉妹(例: 期間B と 並び順S)の提案は将来の拡張。現30概念では実のある家族が
// 少ない(サイト違いは1概念に畳んでいるため)——反応数と宛先・メンションが主。

export type FamilyKind = 'filter' | 'sort' | 'bucket'

export interface FamilyDef {
  id: string
  labelKey: MessageKey
  kind: FamilyKind
  members: ConceptId[]
}

export const FAMILIES: FamilyDef[] = [
  {
    id: 'reaction',
    labelKey: 'family.reaction',
    kind: 'bucket',
    members: ['minLikes', 'minReposts', 'minReplies', 'pixivPopular'],
  },
  {
    id: 'mention',
    labelKey: 'family.mention',
    kind: 'filter',
    members: ['toUser', 'mentionsUser'],
  },
]

/** その概念が属する家族(なければ undefined)。1概念は高々1家族に属する前提 */
export function familyOf(concept: ConceptId): FamilyDef | undefined {
  return FAMILIES.find((f) => f.members.includes(concept))
}

/** 同じ家族の他メンバー(自分を除く)。家族なしなら空配列 */
export function siblingsOf(concept: ConceptId): ConceptId[] {
  return familyOf(concept)?.members.filter((m) => m !== concept) ?? []
}
