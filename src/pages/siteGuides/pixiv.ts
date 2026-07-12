import { exampleLink } from './permalink'
import type { SiteGuide } from './types'

export const pixiv: SiteGuide = {
  sections: [
    {
      title: {
        ja: '並び順「人気順」はプレミアム会員限定',
        en: 'Sorting by popularity requires Premium',
      },
      body: {
        ja: '人気順(order=popular_d)は、非会員アカウントでは選んでも新着順のまま表示されます。UI自体からも選べません。',
        en: 'Sorting by popularity (order=popular_d) silently falls back to newest-first for non-Premium accounts, and the option is hidden from the UI entirely for them.',
      },
      checkedAt: '2026-07-07',
      source: 'doc',
    },
    {
      title: {
        ja: '期間指定と新着順の併用はエラーになる',
        en: "Combining a date range with 'newest' errors out",
      },
      body: {
        ja: '期間の開始/終了日(scd/ecd)は単体では有効ですが、新着順(order=date_d、既定)と同時に指定するとエラーページになります。Dialectでは新着が選ばれている間、orderパラメータ自体を送りません。',
        en: 'The date-range params (scd/ecd) work fine on their own, but combining them with the default newest-first sort (order=date_d) produces an error page. Dialect avoids this by omitting the order parameter whenever newest is selected.',
      },
      checkedAt: '2026-07-04',
      source: 'url',
    },
    {
      title: {
        ja: 'タグ完全一致・タイトルキャプション検索はs_modeで切り替え',
        en: 'Exact-tag and title/caption search are separate modes',
      },
      body: {
        ja: '既定はタグの部分一致(s_tag)です。s_tag_fullを送るとタグの完全一致に、s_tcを送るとタイトル・キャプションも対象に含める検索に切り替わります。',
        en: 'The default is partial tag matching (s_tag). Sending s_tag_full switches to an exact tag match, and s_tc widens the search to titles and captions as well.',
      },
      checkedAt: '2026-07-07',
      source: 'gui',
    },
  ],
  examples: [
    {
      label: { ja: 'タグの完全一致で探す', en: 'Match a tag exactly' },
      permalink: exampleLink({ terms: ['ボカロ'], exactTag: true }),
    },
    {
      label: { ja: '作者の新作イラストだけ見る', en: "See an artist's new illustrations" },
      permalink: exampleLink({ fromUser: 'example_artist', workType: 'illust', sort: 'new' }),
    },
  ],
}
