import type { PlatformDef, QueryState } from '../types'
import { andTerms } from '../text'

// 出典: docs/operator-research.md(2026-07-03調査、実測)
// 検索はパスにキーワードを埋め込む形式。スペース区切りのANDが効く(実測)。
// /searchRes/=レス本文検索(β。インデックスに取りこぼしの可能性あり)、
// /search2/=全期間の過去ログのスレタイトル検索、/search/=現行スレのみ(直近約2か月)。
// 既定はレス本文(searchRes)、「タイトルだけ」ONで過去ログタイトル(search2)へ切り替える。
// 演算子(除外・引用符)や並び順・期間のパラメータは存在しない。
function buildUrl(state: QueryState): string | null {
  const parts = [...andTerms(state)]
  // 引用符構文がないため語句もそのままキーワードとして埋め込む
  if (state.exactPhrase.trim()) parts.push(state.exactPhrase.trim())
  if (parts.length === 0) return null

  const path = state.titleOnly ? 'search2' : 'searchRes'
  return `https://bbs.animanch.com/${path}/${encodeURIComponent(parts.join(' '))}`
}

export const animanch: PlatformDef = {
  id: 'animanch',
  name: 'あにまん掲示板',
  group: 'text',
  brandColor: '#104CD0',
  requiresLogin: false,
  googleSite: 'bbs.animanch.com',
  support: {
    keywords: { level: 'partial', noteKey: 'note.animanch.keywords' },
    exactPhrase: { level: 'partial', noteKey: 'note.loose.exact' },
    titleOnly: { level: 'partial', noteKey: 'note.animanch.titleOnly' },
    japaneseOnly: { level: 'none', noteKey: 'note.jaOnly.service' },
    sortOrder: { level: 'none', noteKey: 'note.nosort' },
  },
  buildUrl,
}
