import type { PlatformDef, QueryState } from '../types'
import { andTerms, exactPhrases, words } from '../text'

// 出典: docs/operator-research.md(2026-07-03調査、実測)
// 5chは2026-03に5ch.net→5ch.ioへドメイン移行。公式スレタイ検索(find.5ch.io)は
// スペース区切りが絞り込みにならない(関連度ベース)ため「足す=絞る」を満たさず、
// AND・除外(-)・板指定(@板ID)が全て実測で効く ff5ch.syoboi.jp を検索先にする。
// 部分文字列マッチ型なので引用符は不要(存在しない)。検索対象はスレタイトルのみ。
// 板は複数指定でいずれか(OR)。@板ID を並べると和集合になる(2026-07-04実測)。
function buildUrl(state: QueryState): string | null {
  const parts = [...andTerms(state)]
  // 引用符構文はないが部分文字列マッチのため、語句はそのまま埋め込めば効く
  parts.push(...exactPhrases(state))
  const boards = words(state.subreddit).map((b) => `@${b.replace(/^@+/, '')}`)
  // 正の条件はキーワード/フレーズ、または板指定。除外だけでは検索にならない
  if (parts.length === 0 && boards.length === 0) return null
  parts.push(...words(state.exclude).map((w) => `-${w}`))
  parts.push(...boards)

  return `https://ff5ch.syoboi.jp/?q=${encodeURIComponent(parts.join(' '))}`
}

export const fivech: PlatformDef = {
  id: 'fivech',
  name: '5ちゃんねる',
  group: 'text',
  brandColor: '#8A6D3B',
  requiresLogin: false,
  googleSite: '5ch.io',
  support: {
    keywords: { level: 'partial', noteKey: 'note.fivech.keywords' },
    exactPhrase: { level: 'partial', noteKey: 'note.loose.exact' },
    exclude: { level: 'full' },
    titleOnly: { level: 'full' },
    subreddit: { level: 'partial', noteKey: 'note.fivech.subreddit' },
    japaneseOnly: { level: 'none', noteKey: 'note.jaOnly.service' },
    sortOrder: { level: 'none', noteKey: 'note.nosort' },
  },
  buildUrl,
}
