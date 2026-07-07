import type { ConceptId, ConceptSupport, PlatformDef, QueryState } from '../types'
import { limitSort } from '../types'
import { andTerms, exactPhrases, minusExcludes, stripHash, words } from '../text'

// 出典: docs/operator-research.md(2026-07-03調査)
// 検索は /tags/{クエリ}/artworks(イラスト・マンガ)。作品の種類を指定したときは
// /illustrations(イラスト)・/manga(マンガ)にパスを切り替える。
// デフォルトはタグの部分一致(s_mode=s_tag)。
// OR・除外(-)・括弧グループは公式ヘルプに記載あり。引用符の完全一致はなくキーワード扱い。
// ハッシュタグ=pixivのタグそのものなので、#を外してタグ語として畳み込む。
// 期間(scd=/ecd=)は非公式なURLパラメータ。人気順(order=popular_d)はプレミアム会員のみ有効。
//
// タグ・タイトル・キャプション(s_mode=tag_tc)だけは /tags/{q}/{section} パスでは
// 「不正なリクエスト」エラーになり、/search?q=…&type=… という別エンドポイントが必要
// (2026-07-07にGUI操作で実測)。作品の種類のtype値もこのエンドポイント独自:
// 既定=artwork、manga=manga、novel=novel、illust=illust、ugoira=ugoira
// (/tagsのillustrationsセクション+type=ugoiraサブ絞り込みと違い、5値がそれぞれ独立)
const SEARCH_ENDPOINT_TYPE: Record<'' | 'illust' | 'manga' | 'ugoira' | 'novel', string> = {
  '': 'artwork',
  illust: 'illust',
  manga: 'manga',
  ugoira: 'ugoira',
  novel: 'novel',
}

function buildUrl(state: QueryState): string | null {
  // 引用符構文がないため、スペースを含む語もそのまま埋め込む(タグの部分一致)
  const parts: string[] = [...andTerms(state)]
  // 完全一致は効かないため、語句をそのままキーワード(タグ語)として扱う(近似)
  parts.push(...exactPhrases(state))
  parts.push(...words(state.hashtag).map(stripHash))
  // 人気の目安=「{N}users入り」タグの部分パターン(例: 000users)を語として足す。
  // 先頭の桁を固定しないので 1000/5000/10000…users入り をまとめて拾える。
  // 部分一致には s_mode=s_tag が必須。タイトルだけ(s_tc)・完全一致(s_tag_full)・
  // タグ・タイトル・キャプション(tag_tc)が s_mode 枠を取ると効かないので、
  // そのときは term も足さない(送っても嘘になる)。
  const usePopular =
    Boolean(state.pixivPopular) && !state.titleOnly && !state.exactTag && !state.tagTitleCaption
  if (usePopular) parts.push(state.pixivPopular)
  // 正の条件がなければ検索として成立しない(除外だけでは開けない)
  if (parts.length === 0) return null
  parts.push(...minusExcludes(state))

  const params = new URLSearchParams()
  // s_mode は1枠。優先度 タイトルだけ(s_tc) > タグ完全一致(s_tag_full) >
  // タグ・タイトル・キャプション(tag_tc) > 人気の目安(s_tag)。
  // タイトルだけ=タイトル・キャプション検索(公式ヘルプ記載)。完全一致=s_tag_full(2026-07-06実測、
  // 部分732千→完全724千で実際に絞られる)。タグ・タイトル・キャプションは通常のタグ部分一致より
  // 広い範囲がヒットする(2026-07-07実測、猫の部分一致24万件→tag_tcで112万件)。
  // 人気の目安は部分一致が要るので s_tag を明示。
  if (state.titleOnly) params.set('s_mode', 's_tc')
  else if (state.exactTag) params.set('s_mode', 's_tag_full')
  else if (state.tagTitleCaption) params.set('s_mode', 'tag_tc')
  else if (usePopular) params.set('s_mode', 's_tag')
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

  if (state.tagTitleCaption) {
    // タグ・タイトル・キャプションのときだけ /search?q=…&type=… エンドポイントへ
    params.set('type', SEARCH_ENDPOINT_TYPE[state.workType])
    const qs = params.toString()
    return `https://www.pixiv.net/search?q=${encodeURIComponent(parts.join(' '))}&${qs}`
  }

  // うごくイラストは専用パスが無く(/tags/…/ugoira は「不正なリクエスト」)、
  // illustrations カテゴリで type=ugoira を付けて絞る(2026-07-06 実測: 全72万→約7千)。
  if (state.workType === 'ugoira') params.set('type', 'ugoira')
  const qs = params.toString()

  // イラスト・うごくイラストは illustrations、マンガは manga、小説は novels、
  // 指定なしは全作品(artworks)。うごくは上の type=ugoira で更に絞る
  const section =
    state.workType === 'manga'
      ? 'manga'
      : state.workType === 'novel'
        ? 'novels'
        : state.workType === 'illust' || state.workType === 'ugoira'
          ? 'illustrations'
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
    exactTag: { level: 'full' },
    tagTitleCaption: { level: 'full' },
    exclude: { level: 'full' },
    fromUser: { level: 'none', noteKey: 'note.pixiv.fromUser' },
    hashtag: { level: 'full' },
    period: { level: 'partial' },
    workType: { level: 'full' },
    mediaOnly: { level: 'none', noteKey: 'note.imageOnly' },
    sortOrder: { level: 'partial', noteKey: 'note.pixiv.sort' },
    pixivPopular: { level: 'partial', noteKey: 'note.pixiv.popular' },
    ageRating: { level: 'full' },
    excludeAi: { level: 'full' },
  },
  buildUrl,
  dynamicSupport: (state) => {
    const overrides: Partial<Record<ConceptId, ConceptSupport>> = {}
    // s_mode は1枠。優先度 titleOnly > exactTag > tagTitleCaption > pixivPopular で
    // 負けた概念は実際には送られないので none に落として正直に(「適用と出るのに効かない」を防ぐ)
    const conflict: ConceptSupport = { level: 'none', noteKey: 'note.pixiv.smodeConflict' }
    if (state.titleOnly) {
      if (state.exactTag) overrides.exactTag = conflict
      if (state.tagTitleCaption) overrides.tagTitleCaption = conflict
      if (state.pixivPopular) overrides.pixivPopular = conflict
    } else if (state.exactTag) {
      if (state.tagTitleCaption) overrides.tagTitleCaption = conflict
      if (state.pixivPopular) overrides.pixivPopular = conflict
    } else if (state.tagTitleCaption && state.pixivPopular) {
      overrides.pixivPopular = conflict
    }
    return {
      ...overrides,
      ...limitSort(state.sort, ['new', 'top'], 'note.sortOrder.otherSite'),
      // R18のみ(mode=r18)は未ログインだと結果に出ないので、その値のときだけ注記つきに落とす。
      // 全年齢(safe)は誰でも効くので full のまま
      ...(state.ageRating === 'r18'
        ? { ageRating: { level: 'partial', noteKey: 'note.pixiv.r18Login' } }
        : {}),
    }
  },
}
