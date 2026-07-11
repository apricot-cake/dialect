/** 入力文字列の正規化ヘルパー。シリアライザ共通で使う */

/**
 * 埋め込み前に、共通パーサー(parse.ts の tokenize)が構文として特別扱いする
 * 生の文字( " と丸カッコ)を取り除く。引用符はフレーズの開始/終了、丸カッコは
 * OR結合グループの区切りを表す構文文字なので、語の中身に混入したまま埋め込むと
 * 対応が崩れ、以降のトークンを巻き込んで飲み込む(全体が1トークンになる、
 * または偶数個の混入どうしが誤って対応してしまい別の語を巻き込む)。
 * さらに悪いことに、巻き込まれた語を次のラウンドで再構築すると巻き込み文字が
 * 増殖し、往復が収束せず発散することもある(2026-07-11 check:props で発見)。
 * Dialectの語・語句としてはこれらの文字に特別な意味がないので、単純に除去してよい。
 * この語・語句の抽出段階(andTerms/exactPhrases/words)で一律に除去することで、
 * 引用符構文を使わないサイト(fantia等)のビルド側とパース側も対称になり安定する
 */
export function stripQuerySyntax(s: string): string {
  return s.replace(/["()]/g, '')
}

/** 空白区切りの入力を単語配列へ(全角スペース対応) */
export function words(input: string): string[] {
  return stripQuerySyntax(input)
    .trim()
    .split(/[\s　]+/)
    .filter(Boolean)
}

/** キーワードの枠から空でない語を取り出す。1枠=1語で、枠の中身は分割しない。枠どうしはAND */
export function andTerms(state: { terms: string[] }): string[] {
  return state.terms.map((t) => stripQuerySyntax(t).trim()).filter(Boolean)
}

/** 完全一致の枠から空でない語句を取り出す。1枠=1フレーズで、中身は分割しない。枠どうしはAND */
export function exactPhrases(state: { exactPhrase: string[] }): string[] {
  return state.exactPhrase.map((t) => stripQuerySyntax(t).trim()).filter(Boolean)
}

/**
 * スペースを含む語(フレーズ)を引用符で括る。
 * 引用符構文のあるサイトのシリアライザで語を埋め込むときに通す
 */
export function quoteIfPhrase(term: string): string {
  const clean = stripQuerySyntax(term)
  return /[\s　]/.test(clean) ? `"${clean}"` : clean
}

/**
 * 引用符構文のあるサイト向けに、AND語(フレーズは引用符つき)と完全一致語句("…")を
 * 連結して返す。x/bluesky/youtube/niconico/hatebu が共通で使う先頭2行の集約。
 * 引用符を使わない misskey/pixiv や、field接頭辞の付く reddit は対象外
 */
export function quotedTerms(state: { terms: string[]; exactPhrase: string[] }): string[] {
  return [
    ...andTerms(state).map(quoteIfPhrase),
    ...exactPhrases(state).map((p) => `"${stripQuerySyntax(p)}"`),
  ]
}

/** 除外語を -語 の配列にする(マイナス検索構文のサイト共通)。別文法の reddit は対象外 */
export function minusExcludes(state: { exclude: string }): string[] {
  return words(state.exclude).map((w) => `-${w}`)
}

/** 先頭の @ を除去したユーザー名。生の引用符・丸カッコは埋め込み前に除去する */
export function stripAt(input: string): string {
  return stripQuerySyntax(input).trim().replace(/^@+/, '')
}

/** 先頭の # (全角含む) を除去したタグ名。生の引用符・丸カッコは埋め込み前に除去する */
export function stripHash(input: string): string {
  return stripQuerySyntax(input)
    .trim()
    .replace(/^[#＃]+/, '')
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
