import type { PlatformDef, QueryState } from '../types'
import { limitSort } from '../types'
import { andTerms, exactPhrases, minusExcludes, stripHash, words } from '../text'

// 出典: docs/operator-research.md(2026-07-03調査)
// 検索は /tags/{クエリ}/artworks(イラスト・マンガ)。作品の種類を指定したときは
// /illustrations(イラスト)・/manga(マンガ)にパスを切り替える。
// デフォルトはタグの部分一致(s_mode=s_tag)。
// OR・除外(-)・括弧グループは公式ヘルプに記載あり。引用符の完全一致はなくキーワード扱い。
// ハッシュタグ=pixivのタグそのものなので、#を外してタグ語として畳み込む。
// 期間(scd=/ecd=)は非公式なURLパラメータ。人気順(order=popular_d)はプレミアム会員のみ有効。
function buildUrl(state: QueryState): string | null {
  // 引用符構文がないため、スペースを含む語もそのまま埋め込む(タグの部分一致)
  const parts: string[] = [...andTerms(state)]
  // 完全一致は効かないため、語句をそのままキーワード(タグ語)として扱う(近似)
  parts.push(...exactPhrases(state))
  parts.push(...words(state.hashtag).map(stripHash))
  // 人気の目安=「{N}users入り」タグ(一定ブックマーク数で付く)を1タグとして畳み込む。
  // これ単独でも検索が成立する(=正の条件)ので、null判定より前に足す。
  // プレミアム限定の order=popular_d を使わずに擬似的な人気順を作るハック
  if (state.pixivPopular) parts.push(`${state.pixivPopular}users入り`)
  // 正の条件がなければ検索として成立しない(除外だけでは開けない)
  if (parts.length === 0) return null
  parts.push(...minusExcludes(state))

  const params = new URLSearchParams()
  // タイトルだけ=タイトル・キャプション検索(s_mode=s_tc、公式ヘルプ記載)。
  // 既定はタグ部分一致(s_tag)なので、ONのときだけ切り替える(2026-07-04実測で動作確認)
  if (state.titleOnly) params.set('s_mode', 's_tc')
  // 新着は既定なので order を付けない。order=date_d は scd/ecd と併用すると
  // pixiv がエラーページを返すため明示しない(2026-07-04 実測)。
  // popular_d=人気(プレミアム限定)のときだけ order を指定する。おまかせも指定しない
  if (state.sort === 'top') params.set('order', 'popular_d')
  if (state.since) params.set('scd', state.since)
  if (state.until) params.set('ecd', state.until)
  const qs = params.toString()

  const section =
    state.workType === 'illust'
      ? 'illustrations'
      : state.workType === 'manga'
        ? 'manga'
        : 'artworks'
  return `https://www.pixiv.net/tags/${encodeURIComponent(parts.join(' '))}/${section}${qs ? `?${qs}` : ''}`
}

export const pixiv: PlatformDef = {
  id: 'pixiv',
  name: 'pixiv',
  group: 'image',
  brandColor: '#0096FA',
  requiresLogin: false,
  googleSite: 'pixiv.net',
  support: {
    keywords: { level: 'partial', noteKey: 'note.pixiv.keywords' },
    exactPhrase: { level: 'partial', noteKey: 'note.loose.exact' },
    titleOnly: { level: 'partial', noteKey: 'note.pixiv.titleOnly' },
    exclude: { level: 'full' },
    fromUser: { level: 'none', noteKey: 'note.pixiv.fromUser' },
    hashtag: { level: 'full' },
    period: { level: 'partial', noteKey: 'note.unofficial' },
    workType: { level: 'full' },
    mediaOnly: { level: 'none', noteKey: 'note.imageOnly' },
    sortOrder: { level: 'partial', noteKey: 'note.pixiv.sort' },
    pixivPopular: { level: 'partial', noteKey: 'note.pixiv.popular' },
  },
  buildUrl,
  dynamicSupport: (state) => limitSort(state.sort, ['new', 'top'], 'note.sortOrder.otherSite'),
}
