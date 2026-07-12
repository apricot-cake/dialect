/**
 * 逆翻訳(parseUrl)の往復検査。ブラウザもネットワークも使わない決定論的チェック。
 *
 * なぜ要るか:
 *   逆翻訳は各サイトの buildUrl と対になる手書きの逆写像なので、演算子を足したとき
 *   parseUrl 側を直し忘れると「Dialectが自分で作ったURLを自分で読めない」ズレが
 *   静かに生まれる。それを check:operators と同じ流儀でマージゲート(CI)に載せる。
 *
 * 何をするか:
 *   1. 往復検査: 各サイトの代表的な条件(全対応概念・全enum値をカバー)で
 *      buildUrl → parseSearchUrl → buildUrl を往復させ、(a)同じサイトに一致
 *      (b)読み残し(ignored)ゼロ (c)再生成URLが元と完全一致、を確認する。
 *   2. ワイルドURL検査: サイト自身が生成する形(旧ドメイン・トラッキング付き・
 *      レガシーパラメータ等)のフィクスチャを読み、期待する条件へ戻ることを確認する。
 *   3. 非検索URLの拒否: 対応サイト外・検索ページ以外のURLが null になることを確認する。
 *
 * 実行: npm run check:reverse   (tsx で直接実行)
 */
import { PLATFORMS } from '@/core/platforms'
import { parseSearchUrl } from '@/core/reverse'
import { defaultState } from '@/core/concepts'
import { daysAgoIso } from '@/core/parse'
import { buildUrl } from '@/core/urlParts'
import type { PlatformId, QueryState } from '@/core/types'

let failures = 0
function fail(msg: string): void {
  failures++
  console.error(`✗ ${msg}`)
}

// ---- 1. 往復検査 ---------------------------------------------------------------
// 各サイトの検査ケース。Record<PlatformId, …> なので、サイトを追加すると
// ここにケースを書くまで型エラーになる(逆翻訳の書き忘れ防止)
type Patch = Partial<QueryState>
const CASES: Record<PlatformId, Patch[]> = {
  x: [
    {
      terms: ['猫', 'react aria'],
      exactPhrase: ['お知らせ です'],
      exclude: '犬 鳥',
      fromUser: 'nasa',
      excludeUser: 'spam1 spam2',
      toUser: 'alice bob',
      mentionsUser: 'carol dave',
      domain: 'example.com',
      xList: '123456',
      hashtag: 'cat art',
      since: '2026-01-01',
      until: '2026-06-30',
      mediaOnly: true,
      linksOnly: true,
      verifiedOnly: true,
      excludeReplies: true,
      minLikes: '100',
      minReposts: '50',
      minReplies: '5',
      language: 'ja',
      sort: 'new',
    },
    { terms: ['猫'], sort: 'top' },
    { toUser: 'alice' },
    { mentionsUser: 'bob' },
    { domain: 'example.com' },
    { terms: ['猫'], xList: 'https://x.com/i/lists/9876' },
    { terms: ['手芸'], keywordsOr: 'cat dog' },
    { keywordsOr: 'cat' },
  ],
  bluesky: [
    {
      terms: ['猫'],
      exactPhrase: ['青い 空'],
      exclude: 'dog',
      fromUser: 'alice.bsky.social bob.bsky.social',
      excludeUser: 'spam1.bsky.social spam2.bsky.social',
      mentionsUser: 'bob.bsky.social carol.bsky.social',
      excludeMentions: 'dave.bsky.social',
      domain: 'example.com foo.org',
      excludeDomain: 'spam.example',
      linkUrl: 'example.com/article',
      excludeLinkUrl: 'example.com/spam',
      hashtag: 'art cat',
      hashtagOr: 'cat dog',
      excludeHashtag: 'ad',
      since: '2026-01-01',
      until: '2026-06-30',
      mediaOnly: true,
      videoOnly: true,
      followingOnly: true,
      language: 'en',
      sort: 'new',
    },
    { terms: ['ai', 'art'], resultType: 'people' },
    { terms: ['cat'], sort: 'top' },
    { terms: ['cat'], repliesOnly: true },
  ],
  youtube: [
    {
      terms: ['猫', 'lo fi'],
      exactPhrase: ['たき火'],
      exclude: 'dog',
      hashtag: 'shorts',
      titleOnly: true,
      since: '2026-01-01',
      until: '2026-06-30',
      sort: 'top',
      resultType: 'video',
      videoLength: 'long',
      liveOnly: true,
      fourK: true,
      hdOnly: true,
      captionsOnly: true,
      creativeCommons: true,
      threeSixty: true,
      vr180: true,
      threeD: true,
      hdr: true,
      locationOnly: true,
      purchased: true,
    },
    { fromUser: 'NASA', terms: ['moon'], titleOnly: true },
    { terms: ['cat'], resultType: 'short' },
    { terms: ['cat'], resultType: 'playlist', sort: 'new' },
    { terms: ['cat'], resultType: 'channel' },
    { terms: ['cat'], videoLength: 'medium' },
    { terms: ['手芸'], keywordsOr: '猫 犬' },
    { keywordsOr: 'cat' },
  ],
  note: [
    { terms: ['猫'], fromUser: '@kensuu', sort: 'hot' },
    { hashtag: '日記' },
    { terms: ['猫'], paidOnly: true, sort: 'top' },
    { terms: ['猫'], resultType: 'people' },
    { terms: ['猫'], resultType: 'series' },
    { terms: ['猫'], resultType: 'circle', sort: 'new' },
    { terms: ['猫'], hashtag: 'art', sort: 'new' },
  ],
  niconico: [
    {
      terms: ['猫', 'ne ko'],
      exactPhrase: ['子猫 日記'],
      exclude: 'dog',
      since: '2026-01-01',
      until: '2026-06-30',
      videoLength: 'short',
      genre: 'game',
      nicoKind: 'user',
      sort: 'commentDate',
    },
    { hashtag: 'ゲーム 実況', exclude: 'dog', sort: 'top' },
    { terms: ['猫'], sort: 'new' },
    { terms: ['猫'], sort: 'comments' },
    { terms: ['猫'], sort: 'favorites' },
    { terms: ['猫'], videoLength: 'long' },
    { terms: ['猫'], resultType: 'short', sort: 'likes' },
    { terms: ['猫'], resultType: 'series', sort: 'videoCount' },
    { terms: ['猫'], resultType: 'series', sort: 'new' },
    { terms: ['猫'], resultType: 'playlist', sort: 'videoAdded' },
    { terms: ['猫'], resultType: 'people', sort: 'followerCount' },
    { terms: ['猫'], resultType: 'people', sort: 'liveCount' },
    { terms: ['手芸'], keywordsOr: '猫 犬' },
    { keywordsOr: '猫' },
  ],
  seiga: [
    { terms: ['猫'], exactPhrase: ['子 猫'], exclude: '犬', sort: 'new' },
    { hashtag: '東方', sort: 'top' },
    { terms: ['猫'], workType: 'manga' },
    { terms: ['手芸'], keywordsOr: '猫 犬' },
    { keywordsOr: '猫', workType: 'manga' },
  ],
  instagram: [{ hashtag: 'ねこ' }, { terms: ['cafe', 'tokyo'], hashtag: 'cat art' }],
  reddit: [
    {
      terms: ['rust', 'hello world'],
      exactPhrase: ['exact phrase'],
      exclude: 'spam junk',
      titleOnly: true,
      fromUser: 'alice',
      subreddit: 'programming rust',
      since: daysAgoIso(6),
      sort: 'top',
      resultType: 'posts',
    },
    { terms: ['cat'], sort: 'hot' },
    { terms: ['cat'], resultType: 'comments', sort: 'comments' },
    { terms: ['cat'], resultType: 'communities' },
    { terms: ['cat'], resultType: 'media' },
    { terms: ['cat'], resultType: 'people' },
    { subreddit: 'AskReddit' },
    { terms: ['cat'], since: daysAgoIso(0) },
    { terms: ['cat'], since: daysAgoIso(30) },
    { terms: ['cat'], since: daysAgoIso(365) },
    { terms: ['yarn'], keywordsOr: 'cats dogs' },
    { keywordsOr: 'cats' },
  ],
  pixiv: [
    {
      terms: ['猫'],
      exclude: '犬',
      hashtag: 'オリジナル',
      since: '2026-01-01',
      until: '2026-06-30',
      ageRating: 'safe',
      excludeAi: true,
      sort: 'top',
    },
    { terms: ['猫'], workType: 'illust' },
    { terms: ['猫'], workType: 'manga' },
    { terms: ['猫'], workType: 'novel' },
    { terms: ['猫'], workType: 'ugoira' },
    { terms: ['猫'], exactTag: true },
    { terms: ['猫'], titleOnly: true },
    { terms: ['猫'], tagTitleCaption: true },
    { terms: ['猫'], tagTitleCaption: true, workType: 'novel' },
    { terms: ['猫'], pixivPopular: '000users' },
    { terms: ['猫'], ageRating: 'r18' },
    { terms: ['手芸'], keywordsOr: '猫 犬' },
    { keywordsOr: '猫' },
  ],
  misskey: [
    { terms: ['猫'], exclude: '犬', fromUser: 'alice' },
    { terms: ['猫'], fromUser: 'alice@example.com' },
    { hashtag: 'art' },
    { terms: ['猫'], hashtag: 'cat art' },
    { terms: ['猫'], exactPhrase: ['青い 空'] },
  ],
  hatebu: [
    {
      terms: ['rust'],
      exactPhrase: ['所有 権'],
      exclude: '入門',
      titleOnly: true,
      since: '2026-01-01',
      until: '2026-06-30',
      minLikes: '10',
      safeSearchOff: true,
      sort: 'new',
    },
    { hashtag: 'プログラミング rust', exclude: 'ai' },
    { terms: ['rust'], sort: 'top' },
  ],
  twitch: [
    { terms: ['apex'], resultType: 'video' },
    { terms: ['apex', 'legends'], resultType: 'channel' },
    { terms: ['apex'] },
  ],
  fivech: [
    { terms: ['猫'], exclude: '犬', subreddit: 'news4vip livejupiter' },
    { terms: ['セール'] },
  ],
  animanch: [{ terms: ['ワンピース', '考察'] }, { terms: ['ネタバレ'], titleOnly: true }],
  tumblr: [
    { hashtag: 'cat' },
    {
      terms: ['cat', 'black cat'],
      exactPhrase: ['cute cat'],
      exclude: 'dog',
      fromUser: 'staff',
      hashtag: 'art photo',
      since: '2026-01-01',
      until: '2026-06-30',
      mediaOnly: true,
      linksOnly: true,
      sort: 'new',
    },
    { terms: ['cat'], sort: 'top' },
  ],
  mastodon: [
    { hashtag: 'art' },
    {
      terms: ['猫'],
      exactPhrase: ['hello world'],
      exclude: 'dog',
      fromUser: 'alice@example.com',
      hashtag: 'cat art',
      since: '2026-01-01',
      until: '2026-06-30',
      mediaOnly: true,
      linksOnly: true,
      excludeReplies: true,
      language: 'en',
    },
  ],
  pinterest: [
    { terms: ['recipe'] },
    { terms: ['cat'], resultType: 'video' },
    { terms: ['cat'], resultType: 'board' },
    { terms: ['cat'], resultType: 'people' },
  ],
  fanbox: [{ hashtag: 'イラスト' }],
  bilibili: [
    {
      terms: ['猫'],
      resultType: 'video',
      sort: 'danmaku',
      videoLength: 'medium',
      since: '2026-06-01',
      until: '2026-06-30',
    },
    { terms: ['猫'], sort: 'top' },
    { terms: ['猫'], resultType: 'video', sort: 'favorites' },
    { terms: ['猫'], resultType: 'article', sort: 'likes' },
    { terms: ['猫'], resultType: 'article', sort: 'comments' },
    { terms: ['猫'], resultType: 'live', sort: 'new' },
    { terms: ['猫'], resultType: 'bangumi' },
    { terms: ['猫'], resultType: 'pgc' },
    { terms: ['猫'], resultType: 'channel' },
  ],
  fantia: [
    { terms: ['猫'] },
    {
      terms: ['猫'],
      titleOnly: true,
      fantiaCategory: 'illust',
      fantiaAudience: 'female',
      sort: 'top',
    },
    { terms: ['猫'], fantiaAudience: 'male', sort: 'new' },
  ],
  google: [
    {
      terms: ['dialect', 'test'],
      exactPhrase: ['exact phrase here'],
      exclude: 'excludedword',
      titleOnly: true,
      domain: 'example.com',
      fileType: 'pdf',
      since: '2024-01-01',
      until: '2024-12-31',
      language: 'ja',
      region: 'JP',
      license: 'f',
      exactMatchMode: true,
      safeSearchOff: true,
      resultType: 'images',
    },
    { terms: ['犬'], keywordsOr: '猫 兎', resultType: 'news' },
    { fileType: 'doc', domain: 'example.org' },
  ],
  github: [
    {
      terms: ['dialect', 'test'],
      exactPhrase: ['exact phrase here'],
      exclude: 'excludedword',
      fromUser: 'octocat',
      codeLanguage: 'TypeScript',
      minStars: '100',
      since: '2024-01-01',
      until: '2024-12-31',
      resultType: 'repositories',
    },
    { terms: ['猫'], fromUser: 'octocat', resultType: 'issues' },
    { terms: ['猫'], resultType: 'people' },
    { terms: ['犬'], minStars: '50' },
  ],
  qiita: [
    {
      terms: ['dialect', 'test'],
      exactPhrase: ['exact phrase here'],
      exclude: 'excludedword',
      fromUser: 'qiita',
      hashtag: 'Python Ruby',
      minStocks: '10',
      since: '2024-01-01',
      until: '2024-12-31',
      sort: 'new',
    },
    { terms: ['猫'], titleOnly: true, resultType: 'questions' },
  ],
  zenn: [
    { terms: ['dialect', 'test'], resultType: 'books', sort: 'new', semanticSearch: true },
    { terms: ['猫'], resultType: 'scraps' },
    { terms: ['犬'], resultType: 'people', sort: 'hot' },
  ],
}

for (const platform of PLATFORMS) {
  for (const patch of CASES[platform.id]) {
    const state: QueryState = { ...defaultState(), ...patch }
    const url = buildUrl(platform, state)
    if (!url) {
      fail(`${platform.id}: buildUrl が null(検査ケース自体が不成立): ${JSON.stringify(patch)}`)
      continue
    }
    const result = parseSearchUrl(url)
    if (!result) {
      fail(`${platform.id}: 逆翻訳できない: ${url}`)
      continue
    }
    if (result.platform?.id !== platform.id) {
      fail(`${platform.id}: 別サイト(${result.platform?.id ?? 'permalink'})として誤認: ${url}`)
      continue
    }
    if (result.ignored.length > 0) {
      fail(`${platform.id}: 自分のURLに読み残し ${JSON.stringify(result.ignored)}: ${url}`)
    }
    const rebuilt = buildUrl(platform, result.state)
    if (rebuilt !== url) {
      fail(`${platform.id}: 往復不一致\n    元: ${url}\n    再: ${rebuilt}`)
    }
  }
}

// ---- 1b. インスタンスホスト設定時の往復検査(issue #32) --------------------------------
// mastodon/misskeyはctx.instanceHostで利用インスタンスを切り替えられる。ctx未指定の
// 通常往復(上のCASES)に加え、カスタムホスト指定時の往復と、instanceHosts未指定では
// カスタムホストのURLを誤って読まないことを確認する
const INSTANCE_CASES: Array<{
  platform: 'mastodon' | 'misskey'
  host: string
  patch: Patch
}> = [
  { platform: 'mastodon', host: 'fosstodon.org', patch: { terms: ['猫'], exclude: 'dog' } },
  { platform: 'mastodon', host: 'fosstodon.org', patch: { hashtag: 'art' } },
  { platform: 'misskey', host: 'misskey.design', patch: { terms: ['猫'], fromUser: 'alice' } },
  { platform: 'misskey', host: 'misskey.design', patch: { hashtag: 'art' } },
]
for (const { platform: id, host, patch } of INSTANCE_CASES) {
  const platform = PLATFORMS.find((p) => p.id === id)
  if (!platform) {
    fail(`${id}: PLATFORMSに見つからない`)
    continue
  }
  const state: QueryState = { ...defaultState(), ...patch }
  const url = buildUrl(platform, state, { instanceHost: host })
  if (!url) {
    fail(`${id}: instanceHost指定時にbuildUrlがnull: ${JSON.stringify(patch)}`)
    continue
  }
  if (!url.includes(host)) {
    fail(`${id}: instanceHostがURLに反映されていない: ${url}`)
    continue
  }
  // instanceHosts未指定では、カスタムホストのURLをどのサイトとしても読めないはず
  if (parseSearchUrl(url)) {
    fail(`${id}: instanceHosts未指定なのにカスタムホストのURLを読めてしまった: ${url}`)
  }
  const instanceHosts = id === 'mastodon' ? { mastodon: host } : { misskey: host }
  const result = parseSearchUrl(url, instanceHosts)
  if (!result || result.platform?.id !== id) {
    fail(`${id}: instanceHosts指定時に逆翻訳できない: ${url}`)
    continue
  }
  if (result.ignored.length > 0) {
    fail(`${id}: instanceHost往復で読み残し ${JSON.stringify(result.ignored)}: ${url}`)
  }
  const rebuilt = buildUrl(platform, result.state, { instanceHost: host })
  if (rebuilt !== url) {
    fail(`${id}: instanceHost往復不一致\n    元: ${url}\n    再: ${rebuilt}`)
  }
  // 既定ホストのURLも、instanceHosts指定時に引き続き読めること
  const defaultUrl = buildUrl(platform, state)
  if (defaultUrl) {
    const defaultResult = parseSearchUrl(defaultUrl, instanceHosts)
    if (!defaultResult || defaultResult.platform?.id !== id) {
      fail(`${id}: instanceHosts指定時でも既定ホストのURLを読めるべき: ${defaultUrl}`)
    }
  }
}

// ---- 2. ワイルドURL検査 ---------------------------------------------------------
// サイト自身が生成する形(旧ドメイン・トラッキング付き・レガシーパラメータ等)。
// expect は state の一部を突き合わせ、truthy はゼロ値でないことだけ確認する
const WILD: Array<{
  url: string
  platform: PlatformId | null
  expect?: Partial<QueryState>
  truthy?: Array<keyof QueryState>
  ignoredMin?: number
}> = [
  {
    // 旧ドメイン+トラッキングパラメータ
    url: 'https://twitter.com/search?q=%E7%8C%AB%20from%3Anasa&src=typed_query&f=live',
    platform: 'x',
    expect: { terms: ['猫'], fromUser: 'nasa', sort: 'new' },
    ignoredMin: 1,
  },
  {
    // フィルタUI「今週」のアップロード日バケット(sp)は期間の開始日として読む
    url: 'https://www.youtube.com/results?search_query=lofi&sp=EgIIAw%3D%3D',
    platform: 'youtube',
    expect: { terms: ['lofi'] },
    truthy: ['since'],
  },
  {
    // コミュニティ内検索(restrict_sr)は板の絞り込みとして読む
    url: 'https://www.reddit.com/r/reactjs/search/?q=hooks&restrict_sr=1&sort=new',
    platform: 'reddit',
    expect: { terms: ['hooks'], subreddit: 'reactjs', sort: 'new' },
  },
  {
    // ページ番号は読み残しとして正直に出す
    url: 'https://www.pixiv.net/tags/%E7%8C%AB/illustrations?mode=safe&p=2',
    platform: 'pixiv',
    expect: { terms: ['猫'], workType: 'illust', ageRating: 'safe' },
    ignoredMin: 1,
  },
  {
    // 旧形式の並び順エイリアス
    url: 'https://www.nicovideo.jp/search/%E7%8C%AB?sort=f&order=d',
    platform: 'niconico',
    expect: { terms: ['猫'], sort: 'new' },
  },
  {
    // 旧 sort=h(ニコニコで人気)は既定=指定なしとして読む
    url: 'https://www.nicovideo.jp/search/%E7%8C%AB?sort=h',
    platform: 'niconico',
    expect: { terms: ['猫'], sort: 'auto' },
  },
  {
    // スキーム無し+「+」区切りの貼り付け
    url: 'bsky.app/search?q=cat+-dog&tab=latest',
    platform: 'bluesky',
    expect: { terms: ['cat'], exclude: 'dog', sort: 'new' },
  },
  {
    // 旧q内トークン形式(from:/mentions:/domain:/#tag)の後方互換読み込み(issue #27で
    // author=/mentions=/domain=/tag= の新パラメータへ移行後も、過去に生成されたリンクや
    // 手打ちのクエリを読めることを確認する)
    url: 'https://bsky.app/search?q=%E7%8C%AB%20from%3Aalice.bsky.social%20mentions%3Abob.bsky.social%20domain%3Aexample.com%20%23cat',
    platform: 'bluesky',
    expect: {
      terms: ['猫'],
      fromUser: 'alice.bsky.social',
      mentionsUser: 'bob.bsky.social',
      domain: 'example.com',
      hashtag: 'cat',
    },
  },
  {
    url: 'https://b.hatena.ne.jp/search/text?q=rust&users=3&safe=off',
    platform: 'hatebu',
    expect: { terms: ['rust'], minLikes: '3', safeSearchOff: true },
  },
  {
    url: 'https://www.tumblr.com/tagged/cat%20photos',
    platform: 'tumblr',
    expect: { hashtag: 'cat photos' },
  },
  {
    url: 'https://mastodon.social/search?q=cat%20-dog%20from%3Agargron&type=statuses',
    platform: 'mastodon',
    expect: { terms: ['cat'], exclude: 'dog', fromUser: 'gargron' },
  },
  {
    url: 'https://search.bilibili.com/video?keyword=%E7%8C%AB&order=dm&duration=2&from_source=webtop_search',
    platform: 'bilibili',
    expect: { terms: ['猫'], resultType: 'video', sort: 'danmaku', videoLength: 'medium' },
    ignoredMin: 1,
  },
  {
    url: 'https://www.instagram.com/explore/tags/%E3%81%AD%E3%81%93/',
    platform: 'instagram',
    expect: { hashtag: 'ねこ' },
  },
  {
    url: 'https://note.com/search?context=note_for_sale&q=%E7%8C%AB&sort=hot',
    platform: 'note',
    expect: { terms: ['猫'], paidOnly: true, sort: 'hot' },
  },
  {
    url: 'https://www.youtube.com/@NASA/search?query=moon',
    platform: 'youtube',
    expect: { fromUser: 'NASA', terms: ['moon'] },
  },
  {
    // Dialect自身の共有URL(platform=null)
    url: 'https://apricot-cake.github.io/dialect/?v=4&kw=%E7%8C%AB&sort=new',
    platform: null,
    expect: { terms: ['猫'], sort: 'new' },
  },
]

for (const wild of WILD) {
  const result = parseSearchUrl(wild.url)
  if (!result) {
    fail(`wild: 逆翻訳できない: ${wild.url}`)
    continue
  }
  const gotId = result.platform?.id ?? null
  if (gotId !== wild.platform) {
    fail(
      `wild: サイト誤認(期待=${wild.platform ?? 'permalink'} 実際=${gotId ?? 'permalink'}): ${wild.url}`,
    )
    continue
  }
  for (const [key, value] of Object.entries(wild.expect ?? {})) {
    const got = result.state[key as keyof QueryState]
    if (JSON.stringify(got) !== JSON.stringify(value)) {
      fail(
        `wild: ${wild.url}\n    ${key} 期待=${JSON.stringify(value)} 実際=${JSON.stringify(got)}`,
      )
    }
  }
  for (const key of wild.truthy ?? []) {
    const got = result.state[key]
    if (!got || (Array.isArray(got) && got.filter(Boolean).length === 0)) {
      fail(`wild: ${wild.url}\n    ${key} が空`)
    }
  }
  if (wild.ignoredMin !== undefined && result.ignored.length < wild.ignoredMin) {
    fail(
      `wild: ${wild.url}\n    読み残しが ${wild.ignoredMin} 件以上あるはず(実際 ${result.ignored.length} 件)`,
    )
  }
}

// ---- 3. 非検索URLの拒否 ---------------------------------------------------------
const NEGATIVE: string[] = [
  'https://example.com/?q=cat', // 対応外サイト
  'https://x.com/home', // 検索ページではない
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // 動画ページ
  'https://www.nicovideo.jp/watch/sm9', // 動画ページ
  'ただの文章です', // URLではない
  'https://x.com/search?q=', // 中身のない検索
  'https://github.com/octocat/Hello-World', // リポジトリページ
  'https://qiita.com/qiita/items/abc123', // 記事ページ
  'https://zenn.dev/qiita/articles/abc123', // 記事ページ
]
for (const input of NEGATIVE) {
  const result = parseSearchUrl(input)
  if (result) {
    fail(
      `negative: 検索URLでないのに読めてしまう: ${input} → ${result.platform?.id ?? 'permalink'}`,
    )
  }
}

// ---- 結果 -----------------------------------------------------------------------
const total = Object.values(CASES).reduce((n, list) => n + list.length, 0)
if (failures > 0) {
  console.error(`\ncheck:reverse — 失敗 ${failures} 件`)
  process.exit(1)
}
console.log(
  `check:reverse — OK(往復 ${total} ケース / instanceHost往復 ${INSTANCE_CASES.length} 件 / ワイルド ${WILD.length} 件 / 拒否 ${NEGATIVE.length} 件、全${PLATFORMS.length}サイト)`,
)
