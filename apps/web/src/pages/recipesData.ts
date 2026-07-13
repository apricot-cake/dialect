import { type QueryState, daysAgoIso } from '@apricot-cake/dialect-core'

export interface Recipe {
  id: string
  title: { ja: string; en: string }
  description: { ja: string; en: string }
  patch: Partial<QueryState>
}

/**
 * レシピ本文(title/description)はUI文言ではなくコンテンツなので、i18nのMessageKey
 * 辞書には入れずここにja/enを両建てで持つ(#35)。1本につき見せ場の概念を1つ以上含み、
 * 全体で概念ファミリー(期間・投稿者・除外・OR・人気・種類・言語・並び順)を横断する。
 */
export const RECIPES: Recipe[] = [
  {
    id: 'new-illust-by-artist',
    title: { ja: 'この作者の新作イラストだけ見る', en: "See just an artist's new illustrations" },
    description: {
      ja: '特定の投稿者のイラスト投稿を、新しい順で並べます。作者名を書き換えて使ってください。',
      en: "Lists a specific artist's illustration posts, newest first. Swap in the handle you want to follow.",
    },
    patch: { fromUser: 'example_artist', workType: 'illust', sort: 'new' },
  },
  {
    id: 'trending-this-week',
    title: { ja: '今週バズった投稿を探す', en: "Find this week's trending posts" },
    description: {
      ja: '直近7日間に絞って、人気順で並べます。検索語を書き換えて使ってください。',
      en: 'Narrows to the last 7 days and sorts by popularity. Swap in your own search term.',
    },
    patch: { terms: ['ボカロ'], since: daysAgoIso(7), sort: 'top' },
  },
  {
    id: 'avoid-spoilers',
    title: { ja: 'ネタバレを避けて感想を探す', en: 'Read reactions without spoilers' },
    description: {
      ja: '「ネタバレ」「結末」を含む投稿を除いて、感想だけを探します。検索語を書き換えて使ってください。',
      en: 'Excludes posts mentioning spoilers or endings, leaving just the reactions. Swap in your own search term.',
    },
    patch: { terms: ['ボカロ'], exclude: 'ネタバレ 結末' },
  },
  {
    id: 'announcements-only',
    title: { ja: '告知だけを拾う', en: 'Catch just the announcements' },
    description: {
      ja: '「発売」「予約」「告知」のどれかを含む投稿だけに絞ります(このどれかを含む=スコープ限定OR)。',
      en: 'Keeps only posts containing any of "release," "pre-order," or "announcement" (a scoped OR).',
    },
    patch: { keywordsOr: '発売 予約 告知' },
  },
  {
    id: 'popular-reactions',
    title: { ja: '反応の多い投稿だけ見る', en: 'See only the most-liked posts' },
    description: {
      ja: 'いいねが100件以上の投稿だけに絞ります。検索語を書き換えて使ってください。',
      en: 'Narrows to posts with at least 100 likes. Swap in your own search term.',
    },
    patch: { terms: ['ボカロ'], minLikes: '100' },
  },
  {
    id: 'exact-tag-match',
    title: { ja: 'タグの完全一致で探す', en: 'Match a tag exactly' },
    description: {
      ja: '部分一致で紛れ込む別タグを除き、タグそのものが完全一致する投稿だけに絞ります。',
      en: 'Excludes near-matches so only posts tagged with this exact tag show up.',
    },
    patch: { terms: ['初音ミク'], exactTag: true },
  },
  {
    id: 'english-reactions',
    title: { ja: '英語圏の反応を見る', en: 'See reactions from English speakers' },
    description: {
      ja: '投稿言語を英語に絞って、海外の反応だけを探します。検索語を書き換えて使ってください。',
      en: 'Narrows the post language to English to surface overseas reactions. Swap in your own search term.',
    },
    patch: { terms: ['ボカロ'], language: 'en' },
  },
  {
    id: 'live-streams-only',
    title: { ja: '配信中のライブだけ見る', en: 'Find only live streams' },
    description: {
      ja: '録画済みの動画を除いて、いま配信中のライブだけに絞ります。検索語を書き換えて使ってください。',
      en: 'Excludes uploaded videos, leaving only streams that are live right now. Swap in your own search term.',
    },
    patch: { terms: ['ボカロ'], liveOnly: true },
  },
  {
    id: 'skip-this-account',
    title: { ja: '特定のアカウントを除いて探す', en: 'Search while excluding one account' },
    description: {
      ja: '公式アカウント等、特定の投稿者を除いて、他の人の投稿だけを見ます。検索語・除外するアカウント名を書き換えて使ってください。',
      en: "Excludes one account (e.g. the official one) so only other people's posts show up. Swap in your own search term and the handle to exclude.",
    },
    patch: { terms: ['ボカロ'], excludeUser: 'example_official' },
  },
]
