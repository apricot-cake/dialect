/** 入力文字列の正規化ヘルパー。シリアライザ共通で使う */

/** 空白区切りの入力を単語配列へ(全角スペース対応) */
export function words(input: string): string[] {
  return input.trim().split(/[\s　]+/).filter(Boolean)
}

/** OR グループ入力(行ごとの文字列)を、空行を除いた単語配列の配列へ */
export function orGroupWords(groups: string[]): string[][] {
  return groups.map(words).filter((g) => g.length > 0)
}

/** 「いずれかを含む」行に1つでも語があるか */
export function hasOrGroup(state: { orGroups: string[] }): boolean {
  return state.orGroups.some((g) => g.trim() !== '')
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
  keywords: string
  exactPhrase: string
  fromUser: string
  hashtag: string
}): boolean {
  return Boolean(
    state.keywords.trim() ||
      state.exactPhrase.trim() ||
      state.fromUser.trim() ||
      state.hashtag.trim(),
  )
}
