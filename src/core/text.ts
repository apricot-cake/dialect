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

/** 引用符の開きと対応する閉じ。全角・曲線引用符も受け付ける */
const QUOTE_PAIRS: Record<string, string> = {
  '"': '"',
  '＂': '＂',
  '“': '”',
}

/**
 * キーワード入力欄の文字列を語の配列へ。スペース区切りはAND、
 * 引用符で囲んだ部分はスペースを含んでもひとまとまりの語(フレーズ)として保つ。
 * 閉じ引用符がまだ無い入力途中は、引用符を無視して普通の語として読む
 */
export function parseTerms(input: string): string[] {
  const terms: string[] = []
  let i = 0
  while (i < input.length) {
    const ch = input[i]
    if (/[\s　]/.test(ch)) {
      i++
      continue
    }
    const close = QUOTE_PAIRS[ch]
    if (close) {
      const end = input.indexOf(close, i + 1)
      if (end !== -1) {
        const inner = input.slice(i + 1, end).trim()
        if (inner) terms.push(inner)
        i = end + 1
        continue
      }
      i++
      continue
    }
    let j = i
    while (j < input.length && !/[\s　"＂“”]/.test(input[j])) j++
    terms.push(input.slice(i, j))
    i = j
  }
  return terms
}

/** 語の配列をキーワード入力欄の文字列へ(parseTerms の逆)。フレーズは "" で括る */
export function formatTerms(terms: string[]): string {
  return terms
    .map((t) => t.trim())
    .filter(Boolean)
    .map(quoteIfPhrase)
    .join(' ')
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
