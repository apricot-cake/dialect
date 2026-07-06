/**
 * 検索照合用の正規化。ピッカー内検索でクエリと概念のコーパスを突き合わせる際、
 * 表記ゆれ(全半角・かな/カナ・大文字小文字)を吸収して同じキーへ寄せる。
 * 表示には使わない(照合キー生成専用)。
 *
 * 手順:
 *   1) NFKC        … 全角英数記号→半角、半角カナ→全角カナ、全角空白→半角空白
 *   2) かな→カナ    … ひらがな(U+3041–U+3096)を +0x60 でカタカナへ寄せる
 *   3) 小文字化     … 英字の大小を無視
 *   4) 空白畳み     … 前後trim＋連続空白(全角含む)を1つに
 *
 * これで「ｷｰﾜｰﾄﾞ」「キーワード」「きーわーど」「KEYWORD」がすべて同じ照合キーに揃う。
 */
export function normalizeForSearch(input: string): string {
  return input
    .normalize('NFKC')
    .replace(/[ぁ-ゖ]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) + 0x60),
    )
    .toLowerCase()
    .trim()
    .replace(/[\s　]+/g, ' ')
}
