import { exampleLink } from './permalink'
import type { SiteGuide } from './types'

export const x: SiteGuide = {
  sections: [
    {
      title: { ja: '検索にはログインが必要', en: 'Search requires being logged in' },
      body: {
        ja: 'Xの検索ページは2023年のログインウォール導入後も残っており、未ログインで開くとログイン画面へリダイレクトされます。個別の投稿ページとは扱いが異なります。',
        en: "X's search page still sits behind the 2023 login wall — opening it while logged out redirects to the login screen. This differs from viewing an individual post.",
      },
      checkedAt: '2026-07-02',
      source: 'url',
    },
    {
      title: {
        ja: '既定タブは「話題」、時系列で見るには明示指定が必要',
        en: 'Default tab is algorithmic, not chronological',
      },
      body: {
        ja: '検索の既定タブはアルゴリズムが選ぶ「話題」(f=top)です。投稿順に新しいものを追うには f=live を明示する必要があるため、Dialectは既定でf=liveを送ります。',
        en: 'The default search tab is the algorithm-curated "Top" (f=top). Seeing posts in chronological order requires explicitly requesting f=live, which is what Dialect sends by default.',
      },
      checkedAt: '2026-07-02',
      source: 'doc',
    },
    {
      title: {
        ja: '最低いいね・リポスト・返信数は非公式だが実在する',
        en: 'Minimum likes/reposts/replies are unofficial but real',
      },
      body: {
        ja: 'min_faves: / min_retweets: / min_replies: は公式ドキュメントには載っていませんが、詳細検索フォーム(x.com/search-advanced)のエンゲージメント欄に実在する演算子です。',
        en: "min_faves:, min_retweets:, and min_replies: aren't documented, but they're real operators present in the advanced search form's engagement fields (x.com/search-advanced).",
      },
      checkedAt: '2026-07-08',
      source: 'gui',
    },
  ],
  examples: [
    {
      label: { ja: '反応の多い投稿だけ見る', en: 'See only the most-engaged posts' },
      permalink: exampleLink({ terms: ['ボカロ'], minLikes: '100' }),
    },
    {
      label: { ja: '認証済みアカウントだけに絞る', en: 'Narrow to verified accounts' },
      permalink: exampleLink({ terms: ['ボカロ'], verifiedOnly: true }),
    },
  ],
}
