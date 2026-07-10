import type { ParsedSearch, PlatformDef, QueryState } from '../types'
import { FANTIA_CATEGORIES, limitSort } from '../types'
import { andTerms, words } from '../text'
import { hostMatches, leftoverParams, pathSegments } from '../parse'

// 出典: 2026-07-09 実機確認(ログイン済み、GUI操作)。年齢確認ゲート通過後、
// ヘッダーの「さがす」検索ボックス→「投稿」タブで採取。
//
// キーワードはAND(スペース区切り)。除外(-語)は文字列としてそのまま検索語に混入し、
// 一致0件になる実害を確認(「-犬」を含む投稿が無いため)。完全一致("..")も同様に
// 引用符ごと literal に扱われ0件になる。どちらも実装しない(none)。
//
// 「キーワード検索」ドロップダウン(タイトルのみ/タイトルと本文)が既存の titleOnly と
// 対応するが、Fantiaの既定はタイトルのみ(keyword_type省略=title_only)なので、
// 他サイトと逆に「タイトルのみを外す」ときだけ明示的に keyword_type=all を送る必要がある。
//
// 対象読者(brand_type=全年齢3/男性向け0/女性向け2)は省略するとアカウント/セッションの
// 直近の閲覧設定に従ってしまい(2026-07-09実測: 未操作でも男性向けになっていた)、
// 全年齢に固定されないため、Dialectは常に明示的に送る(既定=3)。
//
// カテゴリー(category=)はサイト側では複数選択可(カンマ区切り、2026-07-09実測)だが、
// Dialectは他の種類系の概念と同じ単一選択で対応する。
//
// 並び順は5値実測(投稿の新しい順=newer/古い順=create_old/更新の新しい順=updater/
// 更新の古い順=update_old/お気に入り数順=popular)。Dialectは新しい順(new)と
// お気に入り数順(top)のみ対応し、残り3値(更新順・古い順)は未着手のまま残す
// (docs/operator-research.md 参照)。
//
// 検索対象タブは「投稿」以外に「クリエイター/無料チケット/商品/コミッション/タグ」があるが、
// いずれも投稿の全文検索とは異なる性質(クリエイター一覧・商品販売・コミッション受付・
// タグ発見)のため今回は対象外(未着手、見送りではない)
const ORDER_PARAM: Partial<Record<QueryState['sort'], string>> = {
  new: 'newer',
  top: 'popular',
}

function buildUrl(state: QueryState): string | null {
  const terms = andTerms(state)
  if (terms.length === 0) return null

  const params = new URLSearchParams()
  params.set('brand_type', state.fantiaAudience === 'male' ? '0' : state.fantiaAudience === 'female' ? '2' : '3')
  if (state.fantiaCategory) params.set('category', state.fantiaCategory)
  params.set('order', ORDER_PARAM[state.sort] ?? 'newer')
  params.set('keyword_type', state.titleOnly ? 'title_only' : 'all')
  params.set('keyword', terms.join(' '))
  return `https://fantia.jp/posts?${params.toString()}`
}

// 逆翻訳: fantia.jp/posts?keyword=…。order=newer と brand_type=3 と keyword_type=all は
// buildUrl が常に明示する既定値なので「指定なし」として読む
function parseUrl(url: URL): ParsedSearch | null {
  if (!hostMatches(url, 'fantia.jp')) return null
  if (pathSegments(url)[0] !== 'posts') return null
  if (!url.searchParams.has('keyword')) return null

  const patch: Partial<QueryState> = {}
  const ignored: string[] = []
  const terms = words(url.searchParams.get('keyword') ?? '')
  if (terms.length > 0) patch.terms = terms

  const keywordType = url.searchParams.get('keyword_type')
  if (keywordType === 'title_only') patch.titleOnly = true
  else if (keywordType !== null && keywordType !== 'all') ignored.push(`keyword_type=${keywordType}`)
  const category = url.searchParams.get('category')
  if (category !== null) {
    if ((FANTIA_CATEGORIES as readonly string[]).includes(category)) {
      patch.fantiaCategory = category as QueryState['fantiaCategory']
    } else ignored.push(`category=${category}`)
  }
  const brandType = url.searchParams.get('brand_type')
  if (brandType === '0') patch.fantiaAudience = 'male'
  else if (brandType === '2') patch.fantiaAudience = 'female'
  else if (brandType !== null && brandType !== '3') ignored.push(`brand_type=${brandType}`)
  const order = url.searchParams.get('order')
  if (order === 'popular') patch.sort = 'top'
  else if (order !== null && order !== 'newer') ignored.push(`order=${order}`)

  leftoverParams(url, new Set(['keyword', 'keyword_type', 'category', 'brand_type', 'order']), ignored)
  return { patch, ignored }
}

export const fantia: PlatformDef = {
  id: 'fantia',
  name: 'Fantia',
  group: 'image',
  brandColor: '#EA4C89',
  requiresLogin: true,
  googleSite: 'fantia.jp',
  support: {
    keywords: { level: 'full' },
    exactPhrase: { level: 'none', noteKey: 'note.fantia.exactLiteral' },
    exclude: { level: 'none', noteKey: 'note.exclude.literal' },
    titleOnly: { level: 'full' },
    fantiaCategory: { level: 'full' },
    fantiaAudience: { level: 'full' },
    sortOrder: { level: 'partial', noteKey: 'note.fantia.sort' },
  },
  buildUrl,
  parseUrl,
  dynamicSupport: (state) => limitSort(state.sort, ['new', 'top'], 'note.sortOrder.otherSite'),
}
