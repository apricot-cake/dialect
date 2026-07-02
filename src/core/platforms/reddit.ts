import type { PlatformDef, QueryState } from '../types'
import { stripAt, words } from '../text'

// 出典: docs/operator-research.md(2026-07-02追加調査)
// デスクトップWebはログイン不要。Boolean演算子(AND/NOT、大文字)は公式ドキュメントあり。
// スペース区切りは関連度ベースの緩い一致なので、AND結合で厳密化する。
// 期間はq内構文がなく t= プリセット(day/week/month/year)への丸め。
function tParam(since: string): string {
  const days = Math.ceil(
    (Date.now() - new Date(since).getTime()) / (24 * 60 * 60 * 1000),
  )
  if (days <= 1) return 'day'
  if (days <= 7) return 'week'
  if (days <= 31) return 'month'
  if (days <= 366) return 'year'
  return 'all'
}

function buildUrl(state: QueryState): string | null {
  if (!(state.keywords.trim() || state.exactPhrase.trim() || state.fromUser.trim())) {
    return null
  }

  const clauses: string[] = []
  if (state.titleOnly) {
    clauses.push(...words(state.keywords).map((w) => `title:${w}`))
    if (state.exactPhrase.trim()) clauses.push(`title:"${state.exactPhrase.trim()}"`)
  } else {
    clauses.push(...words(state.keywords))
    if (state.exactPhrase.trim()) clauses.push(`"${state.exactPhrase.trim()}"`)
  }
  const orWords = words(state.orAny)
  if (orWords.length > 0) clauses.push(`(${orWords.join(' OR ')})`)
  if (state.fromUser.trim()) clauses.push(`author:${stripAt(state.fromUser)}`)
  if (state.subreddit.trim()) {
    clauses.push(`subreddit:${state.subreddit.trim().replace(/^\/?r\//, '')}`)
  }
  let q = clauses.join(' AND ')
  const excludes = words(state.exclude)
  if (excludes.length > 0) q += ` NOT (${excludes.join(' OR ')})`

  const params = new URLSearchParams({ q })
  params.set('sort', state.newestFirst ? 'new' : 'relevance')
  if (state.since) params.set('t', tParam(state.since))

  return `https://www.reddit.com/search/?${params.toString()}`
}

export const reddit: PlatformDef = {
  id: 'reddit',
  name: 'Reddit',
  group: 'text',
  brandColor: '#ff4500',
  requiresLogin: false,
  support: {
    keywords: { level: 'full' },
    orAny: { level: 'full' },
    exactPhrase: { level: 'partial', noteKey: 'note.exact.unreliable' },
    exclude: { level: 'full' },
    titleOnly: { level: 'full' },
    fromUser: { level: 'full' },
    subreddit: { level: 'full' },
    hashtag: { level: 'none', noteKey: 'note.reddit.hashtag' },
    period: { level: 'partial', noteKey: 'note.reddit.period' },
    mediaOnly: { level: 'none' },
    japaneseOnly: { level: 'none' },
    newestFirst: { level: 'full' },
  },
  buildUrl,
}
