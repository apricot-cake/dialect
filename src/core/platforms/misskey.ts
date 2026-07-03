import type { PlatformDef, QueryState } from '../types'
import { andTerms, modedWords, stripAt, stripHash } from '../text'

// 出典: docs/operator-research.md(2026-07-03調査)
// 検索は /search?q=&type=note(要ログイン)。q内の演算子はなく、本文の部分一致検索。
// ユーザー指定は &username=(フロントエンドのルーター定義で確認した非公式パラメータ)。
// タグ単独なら /tags/(タグページ)、併用時は本文に「#タグ」を含む検索として畳み込む。
function buildUrl(state: QueryState): string | null {
  // 完全一致・OR構文がないため、語句はキーワード扱い、「どれかを含む」指定のフィールドは丸ごと外す。
  // 本文の部分一致検索なので、スペースを含む語はそのままフレーズとして効く
  const textParts = [...andTerms(state)]
  if (state.exactPhrase.trim()) textParts.push(state.exactPhrase.trim())
  const tags = modedWords(state.hashtag, state.hashtagMode)
  const tagNames = tags.or ? [] : tags.words.map(stripHash)
  const handle = stripAt(state.fromUser)

  // タグ単独ならタグページ(ログアウトでも見られる唯一の経路)
  if (tagNames.length === 1 && textParts.length === 0 && !handle) {
    return `https://misskey.io/tags/${encodeURIComponent(tagNames[0])}`
  }

  // ノート本文にはタグが「#タグ」の文字列で含まれるため、部分一致検索に畳み込める
  const parts = [...textParts, ...tagNames.map((t) => `#${t}`)]
  // ユーザー指定だけでは検索が実行されないため、検索語を必須にする
  if (parts.length === 0) return null

  // URLSearchParamsはスペースを「+」にするが、Misskey側が「+」を
  // スペースへ戻す保証がないため、%20になるencodeURIComponentで組む
  const query = [`q=${encodeURIComponent(parts.join(' '))}`, 'type=note']
  if (handle) query.push(`username=${encodeURIComponent(handle)}`)
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
    exactPhrase: { level: 'partial', noteKey: 'note.loose.exact' },
    exclude: { level: 'none', noteKey: 'note.misskey.exclude' },
    fromUser: { level: 'partial', noteKey: 'note.misskey.fromUser' },
    hashtag: { level: 'full', noteKey: 'note.tagPage.combined' },
    japaneseOnly: { level: 'none', noteKey: 'note.jaOnly.service' },
    sortOrder: { level: 'none', noteKey: 'note.nosort' },
  },
  buildUrl,
}
