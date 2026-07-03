import type { PlatformDef, QueryState } from '../types'
import { andTermWords, modedWords, orTermGroups, stripHash, words } from '../text'

// 出典: docs/operator-research.md(2026-07-03調査)
// 検索は /tags/{クエリ}/artworks(イラスト・マンガ)。デフォルトはタグの部分一致(s_mode=s_tag)。
// OR・除外(-)・括弧グループは公式ヘルプに記載あり。引用符の完全一致はなくキーワード扱い。
// ハッシュタグ=pixivのタグそのものなので、#を外してタグ語として畳み込む。
// 期間(scd=/ecd=)は非公式なURLパラメータ。人気順(order=popular_d)はプレミアム会員のみ有効。
function buildUrl(state: QueryState): string | null {
  const parts: string[] = [...andTermWords(state)]
  for (const group of orTermGroups(state)) {
    parts.push(`(${group.join(' OR ')})`)
  }
  // 完全一致は効かないため、語句をそのままキーワード(タグ語)として扱う(近似)
  const phrases = modedWords(state.exactPhrase, state.exactPhraseMode)
  if (phrases.or) parts.push(`(${phrases.words.join(' OR ')})`)
  else parts.push(...phrases.words)
  const tags = modedWords(state.hashtag, state.hashtagMode)
  const tagNames = tags.words.map(stripHash)
  if (tags.or) parts.push(`(${tagNames.join(' OR ')})`)
  else parts.push(...tagNames)
  // 正の条件がなければ検索として成立しない(除外だけでは開けない)
  if (parts.length === 0) return null
  parts.push(...words(state.exclude).map((w) => `-${w}`))

  const params = new URLSearchParams()
  // order=date_d=新着(既定と同じだが明示)、popular_d=人気(プレミアム限定)。おまかせは指定しない
  if (state.sort === 'new') params.set('order', 'date_d')
  else if (state.sort === 'top') params.set('order', 'popular_d')
  if (state.since) params.set('scd', state.since)
  if (state.until) params.set('ecd', state.until)
  const qs = params.toString()

  return `https://www.pixiv.net/tags/${encodeURIComponent(parts.join(' '))}/artworks${qs ? `?${qs}` : ''}`
}

export const pixiv: PlatformDef = {
  id: 'pixiv',
  name: 'pixiv',
  group: 'image',
  brandColor: '#0096FA',
  requiresLogin: false,
  googleSite: 'pixiv.net',
  support: {
    keywords: { level: 'partial', noteKey: 'note.pixiv.keywords' },
    orAny: { level: 'full' },
    exactPhrase: { level: 'partial', noteKey: 'note.loose.exact' },
    exclude: { level: 'full' },
    fromUser: { level: 'none', noteKey: 'note.pixiv.fromUser' },
    hashtag: { level: 'full' },
    period: { level: 'partial', noteKey: 'note.unofficial' },
    mediaOnly: { level: 'none', noteKey: 'note.imageOnly' },
    japaneseOnly: { level: 'none', noteKey: 'note.jaOnly.service' },
    sortOrder: { level: 'partial', noteKey: 'note.pixiv.sort' },
  },
  buildUrl,
}
