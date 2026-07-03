import type { PlatformDef, QueryState } from '../types'
import { andTerms, words } from '../text'

// 出典: docs/operator-research.md(2026-07-03調査、実測)
// 5chは2026-03に5ch.net→5ch.ioへドメイン移行。公式スレタイ検索(find.5ch.io)は
// スペース区切りが絞り込みにならない(関連度ベース)ため「足す=絞る」を満たさず、
// AND・除外(-)・板指定(@板ID)が全て実測で効く ff5ch.syoboi.jp を検索先にする。
// 部分文字列マッチ型なので引用符は不要(存在しない)。検索対象はスレタイトルのみ。
function buildUrl(state: QueryState): string | null {
  const parts = [...andTerms(state)]
  // 引用符構文はないが部分文字列マッチのため、語句はそのまま埋め込めば効く
  if (state.exactPhrase.trim()) parts.push(state.exactPhrase.trim())
  if (parts.length === 0) return null
  parts.push(...words(state.exclude).map((w) => `-${w}`))
  // 板は1つだけ(複数指定の動作は未確認のため先頭のみ)
  const board = words(state.subreddit)[0]
  if (board) parts.push(`@${board.replace(/^@+/, '')}`)

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
