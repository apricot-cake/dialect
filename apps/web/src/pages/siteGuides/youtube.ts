import { exampleLink } from './permalink'
import type { SiteGuide } from './types'

export const youtube: SiteGuide = {
  sections: [
    {
      title: {
        ja: '並び順「アップロード日」は反映されない',
        en: "Sorting by 'upload date' doesn't actually apply",
      },
      body: {
        ja: '並び順「アップロード日」に対応するsp値は、2026-07時点で実際には反映されないことをGUI操作で確認済みです(視聴回数順は正しく反映されます)。Dialectでは注記つきで提供しています。',
        en: "As of 2026-07, the sp value for sorting by upload date doesn't actually take effect (sorting by view count does work correctly). Dialect ships it with a caveat note.",
      },
      checkedAt: '2026-07-03',
      source: 'gui',
    },
    {
      title: {
        ja: '任意の期間はクエリ内の演算子でのみ絞れる',
        en: 'An arbitrary date range needs a query operator',
      },
      body: {
        ja: 'フィルタパネルの期間は「今日/今週/今月/今年」の固定範囲だけです。任意の日付範囲に絞る唯一の方法は、検索語に before:YYYY-MM-DD / after:YYYY-MM-DD を埋め込む非公式演算子です。',
        en: 'The filter panel only offers fixed presets (today/this week/this month/this year). The only way to set an arbitrary date range is the unofficial before:YYYY-MM-DD / after:YYYY-MM-DD operators embedded in the search terms.',
      },
      checkedAt: '2026-07-02',
      source: 'doc',
    },
    {
      title: {
        ja: 'フィルタの組み合わせは1つのパラメータに合成される',
        en: 'Combined filters collapse into a single parameter',
      },
      body: {
        ja: '「並び順」「探すもの」「ライブ配信だけ」などの複数フィルタは、それぞれ独立したパラメータではなく、1つのbase64エンコードされたパラメータ(sp=)に合成されます。Dialectは組み合わせごとに正しい値を持っています。',
        en: "Multiple filters (sort order, result type, live-only, etc.) aren't independent parameters — they collapse into a single base64-encoded value (sp=). Dialect carries the correct value for each combination.",
      },
      checkedAt: '2026-07-08',
      source: 'gui',
    },
  ],
  examples: [
    {
      label: { ja: '配信中のライブだけ見る', en: 'Find only live streams' },
      permalink: exampleLink({ terms: ['ボカロ'], liveOnly: true }),
    },
    {
      label: {
        ja: '特定期間に絞って人気順で見る',
        en: 'Narrow to a date range, sorted by popularity',
      },
      permalink: exampleLink({
        terms: ['ボカロ'],
        since: '2026-01-01',
        until: '2026-06-30',
        sort: 'top',
      }),
    },
  ],
}
