import type { ConceptId, PlatformCtx, PlatformDef, QueryState, UrlPart } from './types'
import { andTerms, exactPhrases, quoteIfPhrase, stripQuerySyntax, words } from './text'

/**
 * UrlPart 組み立てのヘルパー。buildParts(各サイトの翻訳)はURLを不透明な文字列で
 * 組み立てず、「どの断片がどの概念由来か」を持つ UrlPart 列として組み立てる。
 * 全パーツの text をそのまま連結したものが最終URLになる(joinParts)。
 * この構造が、翻訳プレビューの「条件⇄URL部分の同色対応」と check:parts の機械検査を支える。
 */

/** 無帰属のパーツ(URLの土台・区切り文字など、どの条件にも由来しない断片) */
export function lit(text: string): UrlPart {
  return { text, concepts: [] }
}

/** 概念に帰属するパーツ。複数概念の複合断片(YouTubeのsp=等)は概念を並べて渡す */
export function part(text: string, ...concepts: ConceptId[]): UrlPart {
  return { text, concepts }
}

/** 全パーツの連結=最終URL */
export function joinParts(parts: UrlPart[]): string {
  return parts.map((p) => p.text).join('')
}

/** 条件をそのサイトの検索URLへ翻訳する(buildPartsを結合した最終URL)。成立しなければ null */
export function buildUrl(
  platform: PlatformDef,
  state: QueryState,
  ctx?: PlatformCtx,
): string | null {
  const parts = platform.buildParts(state, ctx)
  return parts ? joinParts(parts) : null
}

/** 検索語のトークン(エンコード前の1語)と、それを生んだ概念 */
export interface Token {
  text: string
  concepts: ConceptId[]
}

export function tok(text: string, ...concepts: ConceptId[]): Token {
  return { text, concepts }
}

/**
 * トークン列をエンコード済みの UrlPart 列へ(区切りは %20)。
 * encodeURIComponent は1文字ずつ独立にエンコードするので、
 * encodeURIComponent(tokens.join(' ')) と全パーツの連結は同一の文字列になる
 */
export function encodeTokens(tokens: Token[]): UrlPart[] {
  const parts: UrlPart[] = []
  tokens.forEach((t, i) => {
    if (i > 0) parts.push(lit('%20'))
    parts.push({ text: encodeURIComponent(t.text), concepts: t.concepts })
  })
  return parts
}

/** text.ts の quotedTerms のトークン版: AND語(フレーズは引用符)=keywords、"語句"=exactPhrase */
export function quotedTermTokens(state: { terms: string[]; exactPhrase: string[] }): Token[] {
  return [
    ...andTerms(state).map((t) => tok(quoteIfPhrase(t), 'keywords')),
    ...exactPhrases(state).map((p) => tok(`"${stripQuerySyntax(p)}"`, 'exactPhrase')),
  ]
}

/** text.ts の minusExcludes のトークン版 */
export function minusExcludeTokens(state: { exclude: string }): Token[] {
  return words(state.exclude).map((w) => tok(`-${w}`, 'exclude'))
}

/**
 * q の値の断片を URLSearchParams と同一の form エンコードで符号化する(スペースは +)。
 * form エンコードも1文字ずつ独立なので、断片ごとに符号化した連結は
 * 値全体を一括エンコードした結果と1文字も違わない。
 * URLSearchParams でクエリ値に複数概念の語が合成されるサイト(reddit/hatebu)が、
 * ペアを概念別の断片に割るために使う
 */
export function formEncode(text: string): string {
  return new URLSearchParams([['', text]]).toString().slice(1)
}

/**
 * URLSearchParams と同一のエンコード・並びで k=v ペアを UrlPart 化するビルダー。
 * URLSearchParams.toString() はペアごとに独立にエンコードして '&' で連結するだけなので、
 * ペア単位に toString した断片の連結と一致する(=移行前の出力と1文字も変わらない)。
 * 同じキーを2回 set しない前提(各サイトの組み立てはキー一意)
 */
export class ParamParts {
  private entries: Array<{ pair: string; concepts: ConceptId[] }> = []

  set(key: string, value: string, ...concepts: ConceptId[]): void {
    this.entries.push({
      pair: new URLSearchParams([[key, value]]).toString(),
      concepts,
    })
  }

  get size(): number {
    return this.entries.length
  }

  /** 先頭に prefix('?' or '&')を付けたパーツ列。ペアが無ければ空配列 */
  parts(prefix: '?' | '&' | '' = '?'): UrlPart[] {
    if (this.entries.length === 0) return []
    const out: UrlPart[] = prefix ? [lit(prefix)] : []
    this.entries.forEach((e, i) => {
      if (i > 0) out.push(lit('&'))
      out.push({ text: e.pair, concepts: e.concepts })
    })
    return out
  }
}
