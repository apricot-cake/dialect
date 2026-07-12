import type { Lang } from '@/i18n'

/**
 * Copy for the standalone reference pages (health.html / matrix.html) and the
 * plain-text footer links to them from the main app.
 *
 * Kept out of src/i18n/{ja,en}.ts on purpose: those two files are being edited
 * concurrently by another change while this module was written, so new copy lives
 * here instead of colliding with that work. It follows the same
 * `Record<Lang, Record<Key, string>>` shape as src/i18n/index.ts and could be folded
 * into it later — for now, import `t`-like usage as `pt(lang, key)`.
 */
export type PageCopyKey =
  | 'footer.health'
  | 'footer.matrix'
  | 'footer.about'
  | 'footer.recipes'
  | 'page.backToApp'
  | 'health.title'
  | 'health.intro'
  | 'health.legendOk'
  | 'health.legendNg'
  | 'health.stale'
  | 'health.lastChecked'
  | 'health.verifyLink'
  | 'health.emptyPlatform'
  | 'matrix.title'
  | 'matrix.intro'
  | 'matrix.legendFull'
  | 'matrix.legendPartial'
  | 'matrix.legendNone'
  | 'matrix.conceptColumn'
  | 'matrix.closeNote'
  | 'about.title'
  | 'about.intro'
  | 'about.nothingSent.title'
  | 'about.nothingSent.body'
  | 'about.localOnly.title'
  | 'about.localOnly.body'
  | 'about.openSource.title'
  | 'about.openSource.body'
  | 'about.openSource.link'
  | 'about.qualityControl.title'
  | 'about.qualityControl.body'
  | 'about.qualityControl.link'
  | 'recipes.title'
  | 'recipes.intro'
  | 'recipes.openLink'
  | 'recipes.noSupport'

const ja: Record<PageCopyKey, string> = {
  'footer.health': '演算子の稼働状況',
  'footer.matrix': '対応表',
  'footer.about': '仕組みとプライバシー',
  'footer.recipes': '検索レシピ集',
  'page.backToApp': '← Dialectに戻る',
  'health.title': '演算子の稼働状況',
  'health.intro':
    '各サイトの検索演算子は、ほとんどが非公式（サイトが公式に保証していない）ものです。予告なく壊れることがあるため、Dialectでは3か月ごとに実際にブラウザで動作確認しています。ここには、その確認の実際の記録をそのまま載せています。',
  'health.legendOk': '確認時点で動作',
  'health.legendNg': '確認時点で不動作',
  'health.stale': '要再確認（90日以上前）',
  'health.lastChecked': '最終確認',
  'health.verifyLink': '検証URL',
  'health.emptyPlatform': 'このサイトは確認項目がありません。',
  'matrix.title': '条件×対応サイト表',
  'matrix.intro':
    '各条件（除外・完全一致など）が、どのサイトで使えるかの一覧です。緑=そのまま使える、黄=一部条件つきで使える（タップで注記を表示）、灰=対応していません。',
  'matrix.legendFull': '対応',
  'matrix.legendPartial': '一部対応',
  'matrix.legendNone': '非対応',
  'matrix.conceptColumn': '条件',
  'matrix.closeNote': '閉じる',
  'about.title': '仕組みとプライバシー',
  'about.intro':
    '検索したい内容は、その人の関心そのものです。Dialectがそれをどう扱っているか、誇張せずに説明します。',
  'about.nothingSent.title': '何も送信しません',
  'about.nothingSent.body':
    '入力した条件は、ブラウザの中だけで各サイトの検索URLに変換されます。Dialect側にはそれを受け取るサーバー自体が存在しません（サーバーを持たない静的サイトです）。私たちには、あなたが何を検索したか知りようがありません。もちろん、実際に開いた先の各サイトには、通常の検索と同じようにあなたの検索条件が渡ります。',
  'about.localOnly.title': '保存はぜんぶ手元に',
  'about.localOnly.body':
    '保存した検索・検索履歴・設定（ダークモードや言語など）は、すべてこの端末のブラウザ内（localStorage）にだけ保存されます。他の端末と同期したり、外部に送ったりすることはありません。ブラウザの設定からこのサイトのデータを削除すれば、いつでも消せます。',
  'about.openSource.title': 'オープンソースです',
  'about.openSource.body':
    'Dialectのソースコードはすべて公開されており、誰でも中身を確認できます。「本当に何も送信していないか」を、私たちの言葉を信じる以外の方法で確かめられます。',
  'about.openSource.link': 'GitHubでソースコードを見る',
  'about.qualityControl.title': '翻訳の品質管理',
  'about.qualityControl.body':
    '各サイトへの検索条件の翻訳は、実際にブラウザで動作確認したうえで実装しています。多くのサイトの検索演算子は非公式（サイトが公式に保証していないもの）で予告なく壊れることがあるため、3か月ごとに再確認し、記録を公開しています。',
  'about.qualityControl.link': '演算子の稼働状況を見る',
  'recipes.title': '検索レシピ集',
  'recipes.intro':
    '実際に開けるパーマリンク付きの検索例です。気に入ったものを開いて、そこから条件を書き換えて使ってください。',
  'recipes.openLink': 'この条件で開く',
  'recipes.noSupport': '現在この条件に対応しているサイトはありません',
}

const en: Record<PageCopyKey, string> = {
  'footer.health': 'Operator health',
  'footer.matrix': 'Support matrix',
  'footer.about': 'How it works & privacy',
  'footer.recipes': 'Search recipes',
  'page.backToApp': '← Back to Dialect',
  'health.title': 'Operator health',
  'health.intro':
    'Most of the search operators each site uses are unofficial — the site never promises to keep them working, and they can break without notice. Dialect re-checks them by hand in a real browser every three months. This page shows that actual verification record as-is.',
  'health.legendOk': 'Working as of the check',
  'health.legendNg': 'Not working as of the check',
  'health.stale': 'Needs re-check (over 90 days old)',
  'health.lastChecked': 'Last checked',
  'health.verifyLink': 'Verify URL',
  'health.emptyPlatform': 'No checklist entries for this site.',
  'matrix.title': 'Concept × platform support',
  'matrix.intro':
    'Which conditions (exclude, exact match, etc.) work on which of the sites. Green = works as-is, yellow = works with caveats (tap for the note), gray = not supported.',
  'matrix.legendFull': 'Full',
  'matrix.legendPartial': 'Partial',
  'matrix.legendNone': 'None',
  'matrix.conceptColumn': 'Concept',
  'matrix.closeNote': 'Close',
  'about.title': 'How it works & privacy',
  'about.intro':
    "What you search for is inherently personal. Here's an honest account of how Dialect handles it.",
  'about.nothingSent.title': 'Nothing is sent',
  'about.nothingSent.body':
    "Your search conditions are converted into each site's search URL entirely inside your browser. Dialect has no server to receive that data in the first place — it's a static site with no backend. We have no way of knowing what you searched for. Of course, once you open a result, that site receives your search terms just like any normal search there.",
  'about.localOnly.title': 'Everything is saved locally',
  'about.localOnly.body':
    "Saved searches, history, and settings (dark mode, language, etc.) live only in this browser's local storage on this device. Nothing syncs across devices or leaves your machine. Clearing this site's data from your browser settings removes it at any time.",
  'about.openSource.title': 'Open source',
  'about.openSource.body':
    'The full source code is public, so anyone can verify these claims for themselves rather than taking our word for it.',
  'about.openSource.link': 'View source on GitHub',
  'about.qualityControl.title': 'Translation quality control',
  'about.qualityControl.body':
    "Every translation to a site's search is verified in a real browser before shipping. Many operators are unofficial and can break without notice, so we re-check them every three months and publish the results.",
  'about.qualityControl.link': 'See operator health',
  'recipes.title': 'Search recipes',
  'recipes.intro':
    "Ready-to-open example searches with permalinks. Open one you like, then tweak the conditions from there.",
  'recipes.openLink': 'Open with these conditions',
  'recipes.noSupport': 'No site currently supports this combination',
}

const DICTS: Record<Lang, Record<PageCopyKey, string>> = { ja, en }

export function pt(lang: Lang, key: PageCopyKey): string {
  return DICTS[lang][key] ?? ja[key]
}
