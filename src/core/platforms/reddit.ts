import type { ConceptId, ConceptSupport, PlatformDef, QueryState } from '../types'
import { limitSort } from '../types'
import { andTerms, exactPhrases, quoteIfPhrase, stripAt, words } from '../text'

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
  if (
    !(
      andTerms(state).length > 0 ||
      exactPhrases(state).length > 0 ||
      state.fromUser.trim() ||
      // コミュニティ単独(subreddit:のみ)の検索もRedditでは成立する
      state.subreddit.trim()
    )
  ) {
    return null
  }

  const clauses: string[] = []
  const field = state.titleOnly ? 'title:' : ''
  clauses.push(...andTerms(state).map((w) => `${field}${quoteIfPhrase(w)}`))
  clauses.push(...exactPhrases(state).map((p) => `${field}"${p}"`))
  if (state.fromUser.trim()) clauses.push(`author:${stripAt(state.fromUser)}`)
  // コミュニティは複数指定で「どれか」(OR)
  const subs = words(state.subreddit).map(
    (s) => `subreddit:${s.replace(/^\/?r\//, '')}`,
  )
  if (subs.length >= 2) clauses.push(`(${subs.join(' OR ')})`)
  else clauses.push(...subs)
  let q = clauses.join(' AND ')
  const excludes = words(state.exclude)
  if (excludes.length > 0) q += ` NOT (${excludes.join(' OR ')})`

  const params = new URLSearchParams({ q })
  // sort=new=新着、top=人気。おまかせは指定しない(既定は関連度順)
  if (state.sort === 'new') params.set('sort', 'new')
  if (state.sort === 'top') params.set('sort', 'top')
  if (state.since) params.set('t', tParam(state.since))

  return `https://www.reddit.com/search/?${params.toString()}`
}

// Reddit の t= は「今から過去Nへの丸め」しか表せず、開始日(since)を起点にする。
// 終了日(until)だけ指定しても送れる形が無く buildUrl は t= を付けないので、
// 「近似で適用」と見せず period を非対応に落として食い違いを防ぐ
function dynamicSupport(
  state: QueryState,
): Partial<Record<ConceptId, ConceptSupport>> {
  const overrides: Partial<Record<ConceptId, ConceptSupport>> =
    state.until && !state.since
      ? { period: { level: 'none', noteKey: 'note.reddit.untilOnly' } }
      : {}
  return { ...overrides, ...limitSort(state.sort, ['new', 'top'], 'note.sortOrder.otherSite') }
}

export const reddit: PlatformDef = {
  id: 'reddit',
  name: 'Reddit',
  group: 'text',
  brandColor: '#ff4500',
  requiresLogin: false,
  googleSite: 'reddit.com',
  support: {
    keywords: { level: 'full' },
    exactPhrase: { level: 'partial', noteKey: 'note.exact.unreliable' },
    exclude: { level: 'full' },
    titleOnly: { level: 'full' },
    fromUser: { level: 'full' },
    subreddit: { level: 'full' },
    hashtag: { level: 'none', noteKey: 'note.reddit.hashtag' },
    period: { level: 'partial', noteKey: 'note.reddit.period' },
    mediaOnly: { level: 'none' },
    sortOrder: { level: 'full' },
  },
  buildUrl,
  dynamicSupport,
}
