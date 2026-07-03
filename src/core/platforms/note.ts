import type { PlatformDef, QueryState } from '../types'
import { andTermWords, modedWords, stripAt, stripHash } from '../text'

// 出典: docs/operator-research.md
// 演算子は from:@noteID のみ(公式機能)。除外・完全一致・期間は非対応。
// ハッシュタグ単独ならタグページ(厳密一致)、他条件と併用時はキーワードとして検索。
function buildUrl(state: QueryState): string | null {
  const handle = stripAt(state.fromUser)
  // 完全一致は効かないため、語句をそのままキーワードとして扱う(近似)。
  // OR構文がないため「どれかを含む」指定のフィールドは丸ごと外す
  const phrases = modedWords(state.exactPhrase, state.exactPhraseMode)
  const textParts = [
    ...andTermWords(state),
    ...(phrases.or ? [] : phrases.words),
  ]
  const tags = modedWords(state.hashtag, state.hashtagMode)
  const tagNames = tags.or ? [] : tags.words.map(stripHash)

  if (tagNames.length === 1 && !handle && textParts.length === 0) {
    return `https://note.com/hashtag/${encodeURIComponent(tagNames[0])}`
  }

  const parts = [...textParts, ...tagNames]
  if (handle) parts.push(`from:@${handle}`)
  if (parts.length === 0) return null

  // sort=new=新着、popular=人気(既定)。おまかせは指定しない
  const sort =
    state.sort === 'new' ? '&sort=new' : state.sort === 'top' ? '&sort=popular' : ''
  return `https://note.com/search?context=note&q=${encodeURIComponent(parts.join(' '))}${sort}`
}

export const note: PlatformDef = {
  id: 'note',
  name: 'note',
  group: 'text',
  brandColor: '#13b5b1',
  requiresLogin: false,
  googleSite: 'note.com',
  support: {
    keywords: { level: 'partial', noteKey: 'note.note.keywords' },
    exactPhrase: { level: 'partial', noteKey: 'note.note.exactPhrase' },
    exclude: { level: 'none', noteKey: 'note.note.exclude' },
    fromUser: { level: 'full', noteKey: 'note.note.fromUser' },
    hashtag: { level: 'full', noteKey: 'note.note.hashtag' },
    period: { level: 'none', noteKey: 'note.note.period' },
    mediaOnly: { level: 'none', noteKey: 'note.note.mediaOnly' },
    japaneseOnly: { level: 'none', noteKey: 'note.note.japaneseOnly' },
    sortOrder: { level: 'full' },
  },
  buildUrl,
}
