import type { PlatformDef, QueryState } from '../types'
import { andTermWords, hasPositiveTerm, modedWords, stripAt, stripHash, words } from '../text'

// 出典: docs/operator-research.md
// 演算子は公式ドキュメントあり(除外 - のみ未文書化・実測動作)。ログイン不要。
// tab=latest は未文書化だが social-app のコードに実装されている。
// メディア絞り込み(media=true)はフィーチャーゲート中のため使わない。
function buildUrl(state: QueryState): string | null {
  if (!hasPositiveTerm(state)) return null

  const parts: string[] = []
  parts.push(...andTermWords(state))
  // OR構文がないため、「どれかを含む」指定のフィールドは丸ごと外す(注記はorAny側で出る)
  const phrases = modedWords(state.exactPhrase, state.exactPhraseMode)
  if (!phrases.or) parts.push(...phrases.words.map((p) => `"${p}"`))
  parts.push(...words(state.exclude).map((w) => `-${w}`))
  if (state.fromUser.trim()) parts.push(`from:${stripAt(state.fromUser)}`)
  if (state.mentionsUser.trim()) parts.push(`mentions:${stripAt(state.mentionsUser)}`)
  if (state.domain.trim()) parts.push(`domain:${state.domain.trim()}`)
  const tags = modedWords(state.hashtag, state.hashtagMode)
  if (!tags.or) parts.push(...tags.words.map((t) => `#${stripHash(t)}`))
  if (state.since) parts.push(`since:${state.since}`)
  if (state.until) parts.push(`until:${state.until}`)
  if (state.japaneseOnly) parts.push('lang:ja')
  // 「どれか」指定を外した結果、正の条件が残らなければ検索として成立しない
  if (parts.every((p) => p.startsWith('-'))) return null

  // tab=latest=新しい順。人気順・おまかせは既定のTopタブのまま開く
  const tab = state.sort === 'new' ? '&tab=latest' : ''
  return `https://bsky.app/search?q=${encodeURIComponent(parts.join(' '))}${tab}`
}

export const bluesky: PlatformDef = {
  id: 'bluesky',
  name: 'Bluesky',
  group: 'sns',
  brandColor: '#0085ff',
  requiresLogin: false,
  support: {
    keywords: { level: 'full' },
    exactPhrase: { level: 'full' },
    exclude: { level: 'partial', noteKey: 'note.bluesky.exclude' },
    fromUser: { level: 'full', noteKey: 'note.bluesky.fromUser' },
    mentionsUser: { level: 'full', noteKey: 'note.bluesky.fromUser' },
    domain: { level: 'full' },
    hashtag: { level: 'full' },
    period: { level: 'full' },
    mediaOnly: { level: 'none', noteKey: 'note.bluesky.mediaOnly' },
    japaneseOnly: { level: 'full' },
    sortOrder: { level: 'partial', noteKey: 'note.bluesky.sort' },
  },
  buildUrl,
}
