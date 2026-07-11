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

const ja: Record<PageCopyKey, string> = {
  'footer.health': '演算子の稼働状況',
  'footer.matrix': '対応表',
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
}

const en: Record<PageCopyKey, string> = {
  'footer.health': 'Operator health',
  'footer.matrix': 'Support matrix',
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
}

const DICTS: Record<Lang, Record<PageCopyKey, string>> = { ja, en }

export function pt(lang: Lang, key: PageCopyKey): string {
  return DICTS[lang][key] ?? ja[key]
}
