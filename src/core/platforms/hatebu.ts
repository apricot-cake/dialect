import type { ConceptId, ConceptSupport, PlatformDef, QueryState } from '../types'
import { limitSort } from '../types'
import { andTerms, exactPhrases, minusExcludes, quotedTerms, stripHash, words } from '../text'

// 出典: docs/operator-research.md(2026-07-03調査、実測)
// 検索対象はパスで分ける: /search/text(本文)・/search/title(タイトル)・/search/tag(タグ)。
// AND(スペース)・除外(-)・期間(date_begin/date_end)・並び順(sort=)・
// 最低ブックマーク数(users=)が全てURLで効く。ログイン不要。
// 引用符のフレーズ一致は絞り込み効果を実測したが公式ヘルプに記載なし(中信頼)。
// 注意: 期間を指定しないと、はてブ側の標準で「直近5年・3users以上」に絞られる。
//
// セーフサーチ(safe=on/off、既定on)は2026-07-09にログイン済みGUI操作で発見(サイドバーの
// 「セーフサーチ」オン/オフリンク)。WebFetch(Cookie無し)でも同じサイドバーが出ることを
// 確認済みで、未ログインでも既定・挙動は同じ
//
// ユーザー指定検索(fromUser)は2026-07-09にログイン済みで再検証: `/{username}/search?q=`という
// パスは存在するが、**自分自身のアカウント以外は403 Forbidden**(ブックマーク一覧自体は
// 公開・閲覧できる他ユーザーで確認)。未ログインだとログインページへリダイレクト(WebFetch確認)。
// つまり「ログインすれば他人のブックマークを検索できる」わけではなく、この検索は
// 常に「自分自身のブックマークの中だけ」を対象にした個人用機能であり、Dialectの
// fromUser(指定した任意ユーザーの投稿を探す)とは性質が異なるため引き続き非対応(none)
function buildUrl(state: QueryState): string | null {
  const textParts = quotedTerms(state)
  const tagNames = words(state.hashtag).map(stripHash)
  const excludes = minusExcludes(state)

  // タグ単独ならタグ検索(タグの完全一致でAND)。キーワード併用時は本文検索へ畳み込む
  const tagOnly = tagNames.length > 0 && textParts.length === 0
  const path = tagOnly ? 'tag' : state.titleOnly ? 'title' : 'text'
  const parts = tagOnly ? [...tagNames, ...excludes] : [...textParts, ...tagNames, ...excludes]
  if (textParts.length === 0 && tagNames.length === 0) return null

  const params = new URLSearchParams({ q: parts.join(' ') })
  // sort=recent=新着、popular=人気(サイト既定)。指定なしは何も送らない
  if (state.sort === 'new') params.set('sort', 'recent')
  else if (state.sort === 'top') params.set('sort', 'popular')
  if (state.since) params.set('date_begin', state.since)
  if (state.until) params.set('date_end', state.until)
  if (state.minLikes.trim()) params.set('users', state.minLikes.trim())
  // セーフサーチ(既定=on)を解除。未ログインでも既定は同じ(2026-07-09にWebFetchで確認)
  if (state.safeSearchOff) params.set('safe', 'off')

  return `https://b.hatena.ne.jp/search/${path}?${params.toString()}`
}

// ハッシュタグ単独のときはタグ検索パスになり、「タイトルだけ」は参照されず効かない
function dynamicSupport(
  state: QueryState,
): Partial<Record<ConceptId, ConceptSupport>> {
  const tagOnly =
    words(state.hashtag).length > 0 &&
    andTerms(state).length === 0 &&
    exactPhrases(state).length === 0
  const overrides: Partial<Record<ConceptId, ConceptSupport>> =
    tagOnly && state.titleOnly
      ? { titleOnly: { level: 'none', noteKey: 'note.hatebu.titleTagConflict' } }
      : {}
  // 急上昇(note専用)などはてブにない並び順は落とす
  return { ...overrides, ...limitSort(state.sort, ['new', 'top'], 'note.sortOrder.otherSite') }
}

export const hatebu: PlatformDef = {
  id: 'hatebu',
  name: 'はてなブックマーク',
  group: 'text',
  brandColor: '#00A4DE',
  requiresLogin: false,
  googleSite: 'b.hatena.ne.jp',
  support: {
    keywords: { level: 'full' },
    exactPhrase: { level: 'partial', noteKey: 'note.exact.unreliable' },
    exclude: { level: 'full' },
    titleOnly: { level: 'full' },
    fromUser: { level: 'none', noteKey: 'note.hatebu.fromUser' },
    hashtag: { level: 'full', noteKey: 'note.tagPage.combined' },
    period: { level: 'full' },
    minLikes: { level: 'partial', noteKey: 'note.hatebu.minLikes' },
    sortOrder: { level: 'full' },
    safeSearchOff: { level: 'full' },
  },
  buildUrl,
  dynamicSupport,
}
