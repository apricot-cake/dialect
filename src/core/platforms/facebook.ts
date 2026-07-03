import type { PlatformDef, QueryState } from '../types'
import { andTerms, modedWords, quoteIfPhrase, stripHash } from '../text'

// 出典: docs/operator-research.md(2026-07-02追加調査)
// 検索はログイン必須。search/top が最も安全(search/posts はUI削除済みで将来リスク)。
// filters=(base64)による最新順・日付指定は非公開仕様で不安定なため使わない。
function buildUrl(state: QueryState): string | null {
  // OR構文がないため「どれかを含む」指定のフィールドは丸ごと外す
  const parts: string[] = [...andTerms(state).map(quoteIfPhrase)]
  if (state.exactPhrase.trim()) parts.push(`"${state.exactPhrase.trim()}"`)
  const tags = modedWords(state.hashtag, state.hashtagMode)
  if (!tags.or) parts.push(...tags.words.map((t) => `#${stripHash(t)}`))
  if (parts.length === 0) return null

  return `https://www.facebook.com/search/top/?q=${encodeURIComponent(parts.join(' '))}`
}

export const facebook: PlatformDef = {
  id: 'facebook',
  name: 'Facebook',
  group: 'sns',
  brandColor: '#1877f2',
  requiresLogin: true,
  googleSite: 'facebook.com',
  support: {
    keywords: { level: 'partial', noteKey: 'note.loose.and' },
    exactPhrase: { level: 'partial', noteKey: 'note.exact.unreliable' },
    exclude: { level: 'none' },
    fromUser: { level: 'none' },
    hashtag: { level: 'partial', noteKey: 'note.hashtag.askeyword' },
    period: { level: 'none' },
    mediaOnly: { level: 'none' },
    japaneseOnly: { level: 'none' },
    sortOrder: { level: 'none', noteKey: 'note.nosort' },
  },
  buildUrl,
}
