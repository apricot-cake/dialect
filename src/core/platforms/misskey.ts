import type { PlatformDef, QueryState } from '../types'
import { andTerms, stripAt, stripHash, words } from '../text'

// 出典: docs/operator-research.md(2026-07-03調査)
// 検索は /search?q=&type=note(要ログイン)。本文検索はMeilisearchで、語ごとのAND・
// フレーズ("...")・除外(-語)が効く。ユーザー指定は &username=(フロントエンドの
// ルーター定義で確認した非公式パラメータ)、リモートは host= を分ける。
// タグ単独なら /tags/(タグページ)、併用時は本文に「#タグ」を含む検索として畳み込む。
// 注意(2026-07-04確認): /search はSPAのためURL遷移だけでは検索が自動実行されず、遷移先で
// 「検索」ボタンの手動クリックが要る(q欄は埋まる)。その旨は note.misskey.keywords で告知する。
function buildUrl(state: QueryState): string | null {
  // フレーズは "..." で括ると隣接一致になる(Meilisearch)
  const textParts = [...andTerms(state)]
  if (state.exactPhrase.trim()) textParts.push(`"${state.exactPhrase.trim()}"`)
  const tagNames = words(state.hashtag).map(stripHash)
  const handle = stripAt(state.fromUser)

  // タグ単独ならタグページ(ログアウトでも見られる唯一の経路)
  if (tagNames.length === 1 && textParts.length === 0 && !handle) {
    return `https://misskey.io/tags/${encodeURIComponent(tagNames[0])}`
  }

  // ノート本文にはタグが「#タグ」の文字列で含まれるため、部分一致検索に畳み込める
  const parts = [...textParts, ...tagNames.map((t) => `#${t}`)]
  // ユーザー指定だけでは検索が実行されないため、検索語を必須にする
  if (parts.length === 0) return null
  // 除外は先頭に - をつける(Meilisearchのマイナス検索。非公式)
  parts.push(...words(state.exclude).map((w) => `-${w}`))

  // URLSearchParamsはスペースを「+」にするが、Misskey側が「+」を
  // スペースへ戻す保証がないため、%20になるencodeURIComponentで組む
  const query = [`q=${encodeURIComponent(parts.join(' '))}`, 'type=note']
  if (handle) {
    // リモートユーザー(@user@host)は username と host に分ける
    const [user, host] = handle.split('@')
    query.push(`username=${encodeURIComponent(user)}`)
    if (host) query.push(`host=${encodeURIComponent(host)}`)
  }
  return `https://misskey.io/search?${query.join('&')}`
}

export const misskey: PlatformDef = {
  id: 'misskey',
  name: 'Misskey.io',
  group: 'sns',
  brandColor: '#A1CA03',
  requiresLogin: true,
  googleSite: 'misskey.io',
  support: {
    keywords: { level: 'partial', noteKey: 'note.misskey.keywords' },
    exactPhrase: { level: 'partial', noteKey: 'note.exact.unreliable' },
    exclude: { level: 'partial', noteKey: 'note.misskey.exclude' },
    fromUser: { level: 'partial', noteKey: 'note.misskey.fromUser' },
    hashtag: { level: 'full', noteKey: 'note.tagPage.combined' },
    japaneseOnly: { level: 'none', noteKey: 'note.jaOnly.service' },
    sortOrder: { level: 'none', noteKey: 'note.nosort' },
  },
  buildUrl,
}
