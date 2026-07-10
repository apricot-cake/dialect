import type { ConceptId, ConceptSupport, ParsedSearch, PlatformDef, QueryState } from '../types'
import { limitSort } from '../types'
import { andTerms, exactPhrases, quoteIfPhrase, stripAt, words } from '../text'
import { applyBins, daysAgoIso, emptyBins, hostMatches, leftoverParams, pathSegments, tokenize, unquote } from '../parse'

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
  // sort=new=新着、top=人気、hot=注目順(急上昇に相当)、comments=コメント数順(2026-07-07実測)。
  // 指定なしは何も送らない(既定は関連度順)
  if (state.sort === 'new') params.set('sort', 'new')
  if (state.sort === 'top') params.set('sort', 'top')
  if (state.sort === 'hot') params.set('sort', 'hot')
  if (state.sort === 'comments') params.set('sort', 'comments')
  if (state.since) params.set('t', tParam(state.since))
  // 結果タブ(type=)。すべて/投稿/コミュニティ/コメント/メディア/プロフィールの6タブが
  // それぞれ 無指定/posts/communities/comments/media/people に対応(2026-07-07実測)。
  // 指定なしは「すべて」タブ(投稿+コミュニティ+コメント+メディア+プロフィールが混在)
  if (
    state.resultType === 'posts' ||
    state.resultType === 'communities' ||
    state.resultType === 'comments' ||
    state.resultType === 'media' ||
    state.resultType === 'people'
  ) {
    params.set('type', state.resultType)
  }

  return `https://www.reddit.com/search/?${params.toString()}`
}

// 逆翻訳: reddit.com/search/?q=… と /r/{sub}/search(コミュニティ内検索)。
// qはBoolean構文(AND連結・NOT (a OR b)・title:/author:/subreddit:)を戻す。
// t=(期間プリセット)は「今からN日前」を開始日にした近似として読む
function parseUrl(url: URL): ParsedSearch | null {
  if (!hostMatches(url, 'reddit.com')) return null
  const segs = pathSegments(url)
  const patch: Partial<QueryState> = {}
  const ignored: string[] = []
  const subs: string[] = []

  if (segs[0] === 'r' && segs[1] && segs[2] === 'search') {
    // コミュニティ内検索。restrict_sr が立っているときだけ板の絞り込みとして読む
    const restrict = url.searchParams.get('restrict_sr')
    if (restrict === '1' || restrict === 'true' || restrict === 'on') subs.push(segs[1])
    else ignored.push(`r/${segs[1]}`)
  } else if (segs[0] !== 'search') return null

  const q = url.searchParams.get('q')
  if (!q) return null

  const bins = emptyBins()
  let titleOnly = false
  const tokens = tokenize(q)
  for (let i = 0; i < tokens.length; i++) {
    let token = tokens[i]
    if (/^AND$/i.test(token)) continue
    if (/^OR$/i.test(token)) {
      // 語どうしのORはDialectに無い(全AND)。ANDとして読み込んだと正直に残す
      ignored.push('OR')
      continue
    }
    if (/^NOT$/i.test(token)) {
      const next = tokens[i + 1]
      if (next) {
        i++
        if (next.startsWith('(') && next.endsWith(')')) {
          for (const w of next.slice(1, -1).split(/\s+/).filter(Boolean)) {
            if (!/^OR$/i.test(w)) bins.excludes.push(unquote(w))
          }
        } else bins.excludes.push(unquote(next))
      }
      continue
    }
    if (token.startsWith('(') && token.endsWith(')')) {
      const inner = token
        .slice(1, -1)
        .split(/\s+OR\s+/i)
        .map((s) => s.trim())
        .filter(Boolean)
      if (inner.length > 0 && inner.every((p) => p.startsWith('subreddit:'))) {
        subs.push(...inner.map((p) => p.slice('subreddit:'.length)))
      } else ignored.push(token)
      continue
    }
    if (token.startsWith('title:')) {
      titleOnly = true
      token = token.slice('title:'.length)
    }
    if (token.startsWith('author:')) {
      patch.fromUser = token.slice('author:'.length).replace(/^u\//, '')
      continue
    }
    if (token.startsWith('subreddit:')) {
      subs.push(token.slice('subreddit:'.length))
      continue
    }
    if (/^(self|flair|flair_name|url|site|nsfw):/.test(token)) {
      ignored.push(token)
      continue
    }
    if (token.startsWith('"')) bins.phrases.push(unquote(token))
    else if (token.startsWith('-') && token.length > 1) bins.excludes.push(token.slice(1))
    else if (token) bins.terms.push(token)
  }
  applyBins(patch, bins)
  if (titleOnly) patch.titleOnly = true
  if (subs.length > 0) patch.subreddit = subs.join(' ')

  const sort = url.searchParams.get('sort')
  if (sort === 'new' || sort === 'top' || sort === 'hot' || sort === 'comments') patch.sort = sort
  else if (sort !== null && sort !== 'relevance') ignored.push(`sort=${sort}`)
  const t = url.searchParams.get('t')
  // 開始日は tParam(丸め)がそのまま同じプリセットへ戻す日数にする(往復一致)
  const T_DAYS: Record<string, number> = { hour: 0, day: 0, week: 6, month: 30, year: 365 }
  if (t !== null && t in T_DAYS) patch.since = daysAgoIso(T_DAYS[t])
  else if (t !== null && t !== 'all') ignored.push(`t=${t}`)
  const type = url.searchParams.get('type')
  if (type !== null) {
    if (REDDIT_RESULT_TYPES.has(type)) patch.resultType = type as QueryState['resultType']
    else ignored.push(`type=${type}`)
  }
  leftoverParams(url, new Set(['q', 'sort', 't', 'type', 'restrict_sr']), ignored)
  return { patch, ignored }
}

// Reddit の t= は「今から過去Nへの丸め」しか表せず、開始日(since)を起点にする。
// 終了日(until)だけ指定しても送れる形が無く buildUrl は t= を付けないので、
// 「近似で適用」と見せず period を非対応に落として食い違いを防ぐ
// resultType は許可リスト方式(Redditが対応する5値のみ)にする。禁止リスト方式だと
// 他サイト専用の新しい値(例: Pinterestのボード)を追加するたびここも直す必要があり、
// 直し忘れると「適用と出るのに送られない」を再発する(実際にPinterestのboard追加時に発覚)
const REDDIT_RESULT_TYPES: ReadonlySet<string> = new Set([
  'posts', 'communities', 'comments', 'media', 'people',
])

function dynamicSupport(
  state: QueryState,
): Partial<Record<ConceptId, ConceptSupport>> {
  const overrides: Partial<Record<ConceptId, ConceptSupport>> =
    state.until && !state.since
      ? { period: { level: 'none', noteKey: 'note.reddit.untilOnly' } }
      : {}
  // Reddit非対応の値(他サイト専用)が選ばれたら落とす
  const resultTypeOverride: Partial<Record<ConceptId, ConceptSupport>> =
    state.resultType && !REDDIT_RESULT_TYPES.has(state.resultType)
      ? { resultType: { level: 'none', noteKey: 'note.resultType.otherSite' } }
      : {}
  return {
    ...overrides,
    ...resultTypeOverride,
    ...limitSort(state.sort, ['new', 'top', 'hot', 'comments'], 'note.sortOrder.otherSite'),
  }
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
    mediaOnly: { level: 'none', noteKey: 'note.reddit.mediaOnly' },
    resultType: { level: 'full' },
    sortOrder: { level: 'full' },
  },
  buildUrl,
  parseUrl,
  dynamicSupport,
}
