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
  // 人気の目安=「{N}users入り」タグの部分パターン(例: 000users)を語として足す。
  // 先頭の桁を固定しないので 1000/5000/10000…users入り をまとめて拾える。
  // これ単独でも検索が成立する(=正の条件)ので、null判定より前に足す。
  // 部分一致には s_mode=s_tag の明示が必須(省略はタグ完全一致になり #000users で0件。
  // 2026-07-05 実機確認)。プレミアム限定の order=popular_d を使わない擬似人気順ハック
  if (state.pixivPopular) parts.push(state.pixivPopular)
  // 正の条件がなければ検索として成立しない(除外だけでは開けない)
  if (parts.length === 0) return null
  parts.push(...minusExcludes(state))

  const params = new URLSearchParams()
  // タイトルだけ=タイトル・キャプション検索(s_mode=s_tc、公式ヘルプ記載、2026-07-04実測)。
  // 人気の目安は部分一致が要るので s_tag を明示(省略はタグ完全一致で0件になる)。
  // 両方ONは同時に満たせないため、タイトルだけを優先する(稀な組み合わせ)
  if (state.titleOnly) params.set('s_mode', 's_tc')
  else if (state.pixivPopular) params.set('s_mode', 's_tag')
  // 新着は既定なので order を付けない。order=date_d は scd/ecd と併用すると
  // pixiv がエラーページを返すため明示しない(2026-07-04 実測)。
  // popular_d=人気(プレミアム限定)のときだけ order を指定する。おまかせも指定しない
  if (state.sort === 'top') params.set('order', 'popular_d')
  if (state.since) params.set('scd', state.since)
  if (state.until) params.set('ecd', state.until)
  // 年齢制限とAI生成は /tags エンドポイントでも有効(2026-07-05実機確認)。
  // mode=safe(全年齢)/r18(R18のみ)。空(すべて)はアカウント既定なので送らない。
  // ai_type=1 でAI生成作品を除外(送らなければアカウント既定に従う)。どちらも非会員でも効く
  if (state.ageRating) params.set('mode', state.ageRating)
  if (state.excludeAi) params.set('ai_type', '1')
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
    ageRating: { level: 'full' },
    excludeAi: { level: 'full' },
  },
  buildUrl,
  // R18のみ(mode=r18)は未ログインだと結果に出ないので、その値のときだけ注記つきに落とす。
  // 全年齢(safe)は誰でも効くので full のまま
  dynamicSupport: (state) => ({
    ...limitSort(state.sort, ['new', 'top'], 'note.sortOrder.otherSite'),
    ...(state.ageRating === 'r18'
      ? { ageRating: { level: 'partial', noteKey: 'note.pixiv.r18Login' } }
      : {}),
  }),
}
