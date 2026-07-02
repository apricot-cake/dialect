import type { PlatformDef, QueryState } from '../types'
import { orGroupWords, stripHash, words } from '../text'

// 出典: docs/operator-research.md(2026-07-02追加調査、27パターン実測済み)
// ログイン不要。AND/完全一致/除外(-)/任意期間(start=/end=)/新着順が全てURLで効く。
// デフォルトソートはABテストで変わり得るため sort は常に明示する。
// タグ単独なら /tag/(タグ一致検索)、ことばと併用時はキーワード検索に畳み込む。
function buildUrl(state: QueryState): string | null {
  const tag = stripHash(state.hashtag)
  const textParts: string[] = [...words(state.keywords)]
  // 括弧はリテラル扱いで検索が壊れるため使わない(2026-07-02実測)。
  // OR は隣接語だけを結び、スペースのANDが外側に効くため、
  // 「a OR b c OR d」の並置で (a OR b) AND (c OR d) になる(件数比較で確認)
  for (const group of orGroupWords(state.orGroups)) {
    textParts.push(group.join(' OR '))
  }
  if (state.exactPhrase.trim()) textParts.push(`"${state.exactPhrase.trim()}"`)
  const excludes = words(state.exclude).map((w) => `-${w}`)

  const params = new URLSearchParams()
  if (state.newestFirst) {
    params.set('sort', 'f')
    params.set('order', 'd')
  } else {
    params.set('sort', 'h')
  }
  if (state.since) params.set('start', state.since)
  if (state.until) params.set('end', state.until)
  // 「ふつう(4〜20分)」に相当する値はniconicoに存在しないため指定しない
  if (state.videoLength === 'short') params.set('l_range', '1')
  if (state.videoLength === 'long') params.set('l_range', '2')
  const query = params.toString()

  // タグ単独(+除外)ならタグ検索。除外はタグページでも有効(実測)
  if (tag && textParts.length === 0) {
    const path = [tag, ...excludes].join(' ')
    return `https://www.nicovideo.jp/tag/${encodeURIComponent(path)}?${query}`
  }

  const parts = [...textParts]
  if (tag) parts.push(tag)
  parts.push(...excludes)
  if (parts.length === 0) return null

  return `https://www.nicovideo.jp/search/${encodeURIComponent(parts.join(' '))}?${query}`
}

export const niconico: PlatformDef = {
  id: 'niconico',
  name: 'niconico',
  group: 'video',
  brandColor: '#252525',
  requiresLogin: false,
  support: {
    keywords: { level: 'full' },
    orAny: { level: 'full' },
    exactPhrase: { level: 'full' },
    exclude: { level: 'full' },
    fromUser: { level: 'none' },
    hashtag: { level: 'full', noteKey: 'note.tagPage.combined' },
    period: { level: 'full' },
    mediaOnly: { level: 'none', noteKey: 'note.videoOnly' },
    videoLength: { level: 'partial', noteKey: 'note.niconico.videoLength' },
    japaneseOnly: { level: 'none', noteKey: 'note.jaOnly.service' },
    newestFirst: { level: 'full' },
  },
  buildUrl,
}
