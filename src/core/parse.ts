import type { QueryState } from './types'

/** 検索URLの逆翻訳(parseUrl)で共通に使う分解ヘルパー。シリアライザ側の text.ts と対をなす */

/** URLのホストが指定ドメイン(そのもの、またはサブドメイン)か */
export function hostMatches(url: URL, ...domains: string[]): boolean {
  const host = url.hostname.toLowerCase()
  return domains.some((d) => host === d || host.endsWith(`.${d}`))
}

/** URLのホストが指定ホスト名と完全一致するか(www. は付いても同一視する) */
export function hostIs(url: URL, ...hosts: string[]): boolean {
  const host = url.hostname.toLowerCase().replace(/^www\./, '')
  return hosts.some((h) => host === h.replace(/^www\./, ''))
}

/** パスをデコード済みセグメント配列へ(空要素は除く) */
export function pathSegments(url: URL): string[] {
  return url.pathname
    .split('/')
    .filter(Boolean)
    .map((s) => {
      try {
        return decodeURIComponent(s)
      } catch {
        return s
      }
    })
}

/** YYYY-MM-DD 形式か */
export function isIsoDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s)
}

/** 今日からn日前の YYYY-MM-DD。期間プリセット(t=week 等)を開始日へ逆変換するときに使う */
export function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10)
}

/** 先頭末尾の引用符を外す */
export function unquote(s: string): string {
  return s.replace(/^"/, '').replace(/"$/, '')
}

/**
 * 検索クエリ文字列を語に分割する。"…" は空白を含んでも1語として保ち、
 * (…) のグループ(to:/メンションのOR結合など)も1語として保つ。全角スペース対応。
 *
 * 引用符の対応が奇数(閉じ忘れ)のときは引用符を、丸カッコの対応が崩れている
 * (開きと閉じの数が異なる)ときは丸カッコを、それぞれ特別扱いしない。素の値に
 * 混入した単独の " や ( を区切り記号の開始とみなすと、閉じが来ないまま文字列の
 * 残り全体(以降のスペースも無視)を1トークンへ飲み込み、後続のハッシュタグ・
 * メンション等が丸ごと消える(2026-07-11 check:props のプロパティテストで発見)。
 */
export function tokenize(q: string): string[] {
  const honorQuotes = (q.match(/"/g)?.length ?? 0) % 2 === 0
  const honorParens = (q.match(/\(/g)?.length ?? 0) === (q.match(/\)/g)?.length ?? 0)
  const tokens: string[] = []
  let cur = ''
  let inQuote = false
  let depth = 0
  for (const ch of q) {
    if (inQuote) {
      cur += ch
      if (ch === '"') inQuote = false
      continue
    }
    if (honorQuotes && ch === '"') {
      inQuote = true
      cur += ch
      continue
    }
    if (honorParens && ch === '(') depth++
    if (honorParens && ch === ')' && depth > 0) depth--
    if (/[\s　]/.test(ch) && depth === 0) {
      if (cur) tokens.push(cur)
      cur = ''
      continue
    }
    cur += ch
  }
  if (cur) tokens.push(cur)
  return tokens
}

/**
 * 多くのサイトで共通する4種類の語の入れ物。各サイトの parseUrl がトークンを
 * 仕分けして詰め、最後に applyBins で patch へ反映する
 */
export interface TokenBins {
  terms: string[]
  phrases: string[]
  excludes: string[]
  hashtags: string[]
}

export function emptyBins(): TokenBins {
  return { terms: [], phrases: [], excludes: [], hashtags: [] }
}

/** 共通ビンの中身を patch へ反映する(空の入れ物は書かない=defaultState のまま) */
export function applyBins(patch: Partial<QueryState>, bins: TokenBins): void {
  if (bins.terms.length > 0) patch.terms = bins.terms
  if (bins.phrases.length > 0) patch.exactPhrase = bins.phrases
  if (bins.excludes.length > 0) patch.exclude = bins.excludes.join(' ')
  if (bins.hashtags.length > 0) patch.hashtag = bins.hashtags.join(' ')
}

/**
 * 括弧禁止・並置文法(niconico/セイガ)のOR連鎖を読む。`token (OR token)+` という
 * 最初の1連なりを keywordsOr の候補として抜き出し、残りのトークンをそのまま返す。
 * 2つ目以降のOR連鎖(サイト自身が出せる複数グループ表現)はDialectに対応する枠が
 * 1つしか無いため対象外とし、rest 側にリテラルの語として残す(Reddit の裸のORと同じ簡略化)
 */
export function extractBareOrChain(tokens: string[]): { orTerms: string[]; rest: string[] } {
  const rest: string[] = []
  const orTerms: string[] = []
  let i = 0
  while (i < tokens.length) {
    const token = tokens[i]
    if (orTerms.length === 0 && tokens[i + 1] === 'OR' && i + 2 < tokens.length) {
      const chain = [token]
      let j = i + 1
      while (tokens[j] === 'OR' && j + 1 < tokens.length) {
        chain.push(tokens[j + 1])
        j += 2
      }
      orTerms.push(...chain)
      i = j
      continue
    }
    rest.push(token)
    i++
  }
  return { orTerms, rest }
}

/**
 * consumed に無いクエリパラメータを ignored へ集める。トラッキング用の付属品
 * (utm_* 等)も含め、読めなかった指定は黙って捨てずに全部残す
 */
export function leftoverParams(
  url: URL,
  consumed: ReadonlySet<string>,
  ignored: string[],
): void {
  for (const [k, v] of url.searchParams) {
    if (!consumed.has(k)) ignored.push(v ? `${k}=${v}` : k)
  }
}
