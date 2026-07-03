import type { PlatformDef, QueryState } from '../types'
import { andTerms, stripHash, words } from '../text'

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
  if (state.exactPhrase.trim()) parts.push(state.exactPhrase.trim())
  parts.push(...words(state.hashtag).map(stripHash))
  // 正の条件がなければ検索として成立しない(除外だけでは開けない)
  if (parts.length === 0) return null
  parts.push(...words(state.exclude).map((w) => `-${w}`))

  const params = new URLSearchParams()
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
    exclude: { level: 'full' },
    fromUser: { level: 'none', noteKey: 'note.pixiv.fromUser' },
    hashtag: { level: 'full' },
    period: { level: 'partial', noteKey: 'note.unofficial' },
    workType: { level: 'full' },
    mediaOnly: { level: 'none', noteKey: 'note.imageOnly' },
    japaneseOnly: { level: 'none', noteKey: 'note.jaOnly.service' },
    sortOrder: { level: 'partial', noteKey: 'note.pixiv.sort' },
  },
  buildUrl,
}
