import type { TermMode, TermRow } from './types'

/** 入力文字列の正規化ヘルパー。シリアライザ共通で使う */

/** 空白区切りの入力を単語配列へ(全角スペース対応) */
export function words(input: string): string[] {
  return input.trim().split(/[\s　]+/).filter(Boolean)
}

/**
 * 「すべて含む」扱いになる語。all 行の語に加え、
 * 1語だけの any 行も実質ANDなのでこちらに含める
 */
export function andTermWords(state: { terms: TermRow[] }): string[] {
  const out: string[] = []
  for (const row of state.terms) {
    const ws = words(row.text)
    if (row.mode === 'all' || ws.length === 1) out.push(...ws)
  }
  return out
}

/** 「どれかを含む」行(2語以上)を語配列の配列へ。行内はOR、行どうし・他の語とはAND */
export function orTermGroups(state: { terms: TermRow[] }): string[][] {
  return state.terms
    .filter((row) => row.mode === 'any')
    .map((row) => words(row.text))
    .filter((ws) => ws.length >= 2)
}

/** OR結合が必要な「どれかを含む」行があるか */
export function hasOrTerms(state: { terms: TermRow[] }): boolean {
  return orTermGroups(state).length > 0
}

/**
 * mode付き複数値フィールドの語配列。or=true なら「どれかを含む」(OR結合が必要)。
 * 1語だけなら mode によらず実質ANDなので or=false
 */
export function modedWords(
  text: string,
  mode: TermMode,
): { words: string[]; or: boolean } {
  const ws = words(text)
  return { words: ws, or: mode === 'any' && ws.length >= 2 }
}

/** 先頭の @ を除去したユーザー名 */
export function stripAt(input: string): string {
  return input.trim().replace(/^@+/, '')
}

/** 先頭の # (全角含む) を除去したタグ名 */
export function stripHash(input: string): string {
  return input.trim().replace(/^[#＃]+/, '')
}

/** 検索として成立する「正の条件」があるか(除外や期間だけでは検索できない) */
export function hasPositiveTerm(state: {
  terms: TermRow[]
  exactPhrase: string
  fromUser: string
  hashtag: string
}): boolean {
  return Boolean(
    andTermWords(state).length > 0 ||
      state.exactPhrase.trim() ||
      state.fromUser.trim() ||
      state.hashtag.trim(),
  )
}
