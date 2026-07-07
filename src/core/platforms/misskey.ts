import type { PlatformDef, QueryState } from '../types'
import { andTerms, exactPhrases, minusExcludes, stripAt, stripHash, words } from '../text'

// 出典: docs/operator-research.md(2026-07-03調査、2026-07-08にログイン済みGUI操作で除外・完全一致を再検証)
// 検索は /search?q=&type=note(要ログイン)。本文検索はMeilisearchで、語ごとのAND・除外(-語)が効く。
// ユーザー指定は &username=(フロントエンドのルーター定義で確認した非公式パラメータ)、リモートは
// host= を分ける。タグ単独なら /tags/(タグページ)、併用時は本文に「#タグ」を含む検索として畳み込む。
// 注意(2026-07-04確認): /search はSPAのためURL遷移だけでは検索が自動実行されず、遷移先で
// 「検索」ボタンの手動クリックが要る(q欄は埋まる)。その旨は note.misskey.keywords で告知する。
// 完全一致(2026-07-08 ログイン済みGUI操作で再検証): "..." で括っても隣接一致にならず、実在の投稿本文を
// そのまま引用符で括ってすら0件になる(引用符が文字として扱われ、クエリ全体を壊す)。さらに他のAND語と
// 組み合わせると検索全体が0件になる実害を確認したため、引用符は送らず語ごとのAND(keywordsと同じ扱い)へ畳み込む。
function buildUrl(state: QueryState): string | null {
  // 完全一致は機能しないため、語を分解してAND語として畳み込む(note.misskey.exactPhrase)
  const textParts = [...andTerms(state), ...exactPhrases(state).flatMap(words)]
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
  parts.push(...minusExcludes(state))

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
  // 黄緑は輝度判定だと黒字になるが、Misskey本家の配色に合わせて白字で固定する
  ink: '#ffffff',
  requiresLogin: true,
  googleSite: 'misskey.io',
  support: {
    keywords: { level: 'partial', noteKey: 'note.misskey.keywords' },
    exactPhrase: { level: 'partial', noteKey: 'note.misskey.exactPhrase' },
    exclude: { level: 'full' },
    fromUser: { level: 'partial', noteKey: 'note.misskey.fromUser' },
    hashtag: { level: 'full', noteKey: 'note.tagPage.combined' },
    sortOrder: { level: 'none', noteKey: 'note.nosort' },
  },
  buildUrl,
}
