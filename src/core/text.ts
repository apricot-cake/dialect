import type { TermMode } from './types'

/** 入力文字列の正規化ヘルパー。シリアライザ共通で使う */

/** 空白区切りの入力を単語配列へ(全角スペース対応) */
export function words(input: string): string[] {
  return input.trim().split(/[\s　]+/).filter(Boolean)
}

/** キーワードの枠から空でない語を取り出す。1枠=1語で、枠の中身は分割しない。枠どうしはAND */
export function andTerms(state: { terms: string[] }): string[] {
  return state.terms.map((t) => t.trim()).filter(Boolean)
}

/**
 * スペースを含む語(フレーズ)を引用符で括る。
 * 引用符構文のあるサイトのシリアライザで語を埋め込むときに通す
 */
export function quoteIfPhrase(term: string): string {
  return /[\s　]/.test(term) ? `"${term}"` : term
}

/**
 * mode付き複数値フィールド(ハッシュタグ等)の語配列。
 * or=true なら「どれかを含む」(OR結合が必要)。1語だけなら mode によらず実質ANDなので or=false
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
  terms: string[]
  exactPhrase: string
  fromUser: string
  hashtag: string
}): boolean {
  return Boolean(
    andTerms(state).length > 0 ||
      state.exactPhrase.trim() ||
      state.fromUser.trim() ||
      state.hashtag.trim(),
  )
}
