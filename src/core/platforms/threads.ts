import type { PlatformDef, QueryState } from '../types'
import { andTerms, hasPositiveTerm, stripAt, stripHash, words } from '../text'

// 出典: docs/operator-research.md(2026-07-02追加調査)
// 検索閲覧はログイン必須(Instagramアカウント共通)。演算子は存在せず、
// URLパラメータ filter=recent(新着順)と from_author=(ユーザー指定)が使える。
// 完全一致・除外は非対応のため、語句はふつうのキーワードに畳み込む。
function buildUrl(state: QueryState): string | null {
  if (!hasPositiveTerm(state)) return null

  const handle = stripAt(state.fromUser)
  // 完全一致は近似のキーワード扱い
  const textParts = [...andTerms(state)]
  if (state.exactPhrase.trim()) textParts.push(state.exactPhrase.trim())
  const tagNames = words(state.hashtag).map(stripHash)

  // タグ単独ならタグページ(ログアウトでも一部表示される唯一の経路)
  if (tagNames.length === 1 && !handle && textParts.length === 0) {
    return `https://www.threads.com/tag/${encodeURIComponent(tagNames[0])}`
  }

  const parts = [...textParts, ...tagNames.map((t) => `#${t}`)]
  if (parts.length === 0 && !handle) return null

  const params = new URLSearchParams()
  if (parts.length > 0) params.set('q', parts.join(' '))
  if (handle) params.set('from_author', handle)
  // filter=recent=新着のみURLで指定できる。人気順・おまかせは既定の表示のまま
  if (state.sort === 'new') params.set('filter', 'recent')

  return `https://www.threads.com/search?${params.toString()}`
}

export const threads: PlatformDef = {
  id: 'threads',
  name: 'Threads',
  group: 'sns',
  brandColor: '#101010',
  requiresLogin: true,
  googleSite: 'threads.com',
  support: {
    keywords: { level: 'partial', noteKey: 'note.loose.and' },
    exactPhrase: { level: 'partial', noteKey: 'note.loose.exact' },
    exclude: { level: 'none' },
    fromUser: { level: 'full', noteKey: 'note.threads.fromUser' },
    hashtag: { level: 'full', noteKey: 'note.tagPage.combined' },
    period: { level: 'none' },
    mediaOnly: { level: 'none' },
    japaneseOnly: { level: 'none' },
    sortOrder: { level: 'full' },
  },
  buildUrl,
}
