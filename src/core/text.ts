/** 入力文字列の正規化ヘルパー。シリアライザ共通で使う */

/** 空白区切りの入力を単語配列へ(全角スペース対応) */
export function words(input: string): string[] {
  return input.trim().split(/[\s　]+/).filter(Boolean)
}

/** キーワードの枠から空でない語を取り出す。1枠=1語で、枠の中身は分割しない。枠どうしはAND */
export function andTerms(state: { terms: string[] }): string[] {
  return state.terms.map((t) => t.trim()).filter(Boolean)
}

/** 完全一致の枠から空でない語句を取り出す。1枠=1フレーズで、中身は分割しない。枠どうしはAND */
export function exactPhrases(state: { exactPhrase: string[] }): string[] {
  return state.exactPhrase.map((t) => t.trim()).filter(Boolean)
}

/**
 * スペースを含む語(フレーズ)を引用符で括る。
 * 引用符構文のあるサイトのシリアライザで語を埋め込むときに通す
 */
export function quoteIfPhrase(term: string): string {
  return /[\s　]/.test(term) ? `"${term}"` : term
}

/**
 * 引用符構文のあるサイト向けに、AND語(フレーズは引用符つき)と完全一致語句("…")を
 * 連結して返す。x/bluesky/youtube/niconico/hatebu が共通で使う先頭2行の集約。
 * 引用符を使わない misskey/pixiv や、field接頭辞の付く reddit は対象外
 */
export function quotedTerms(state: { terms: string[]; exactPhrase: string[] }): string[] {
  return [
    ...andTerms(state).map(quoteIfPhrase),
    ...exactPhrases(state).map((p) => `"${p}"`),
  ]
}

/** 除外語を -語 の配列にする(マイナス検索構文のサイト共通)。別文法の reddit は対象外 */
export function minusExcludes(state: { exclude: string }): string[] {
  return words(state.exclude).map((w) => `-${w}`)
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
  exactPhrase: string[]
  fromUser: string
  hashtag: string
}): boolean {
  return Boolean(
    andTerms(state).length > 0 ||
      exactPhrases(state).length > 0 ||
      state.fromUser.trim() ||
      state.hashtag.trim(),
  )
}
