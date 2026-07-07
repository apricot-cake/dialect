import type { ConceptId, ConceptSupport, PlatformDef, QueryState } from '../types'
import { limitSort } from '../types'
import { hasPositiveTerm, minusExcludes, quotedTerms, stripAt, stripHash, words } from '../text'

// 出典: 2026-07-07 実機確認(未ログイン、GUI操作+URL叩き)。tumblr.com/search/{q}=コンテンツ検索
// (既定=人気順)、/search/{q}/recent=最新順。単一タグは /tagged/{タグ}(人気順のみ。旧 /chrono は
// 廃止され /explore/trending へ飛ぶ=タグページの並び替えはボタンのみでURL化できない)。
// 詳細検索/フィルタのGUIで判明した演算子(2026-07-07実測): -語(除外)/from:ブログ(送信者)/
// since:・before:(期間、開始終了とも単独で有効)/複数#tag(AND)/"…"(完全一致、語順まで効く)/
// ?postTypes=csv(投稿タイプ。photo,gif,video/link 等)。いずれもブラウザで実際に絞られることを確認済み。
/** タグページ(/tagged/{tag})になるのは、単一タグだけで他の条件が何も無いとき */
function singleTagOnly(state: QueryState): string | null {
  const tagNames = words(state.hashtag).map(stripHash)
  const hasOtherConditions =
    quotedTerms(state).length > 0 ||
    minusExcludes(state).length > 0 ||
    state.fromUser.trim().length > 0 ||
    Boolean(state.since) ||
    Boolean(state.until) ||
    state.mediaOnly ||
    state.linksOnly
  return !hasOtherConditions && tagNames.length === 1 ? tagNames[0] : null
}

function buildUrl(state: QueryState): string | null {
  const singleTag = singleTagOnly(state)
  // 単一タグのみ(他の条件が何もない)ならタグページ。並び順・投稿タイプ等はURLで指定できない(人気順固定)
  if (singleTag) {
    return `https://www.tumblr.com/tagged/${encodeURIComponent(singleTag)}`
  }

  const textParts = quotedTerms(state)
  const excludeParts = minusExcludes(state)
  const tagNames = words(state.hashtag).map(stripHash)
  const hasFromUser = state.fromUser.trim().length > 0

  if (!hasPositiveTerm(state)) return null

  // それ以外はコンテンツ検索へまとめる(複数タグは #tag で本物のタグ演算子として送る)
  const parts = [...textParts, ...excludeParts]
  if (hasFromUser) parts.push(`from:${stripAt(state.fromUser)}`)
  parts.push(...tagNames.map((t) => `#${t}`))
  if (state.since) parts.push(`since:${state.since}`)
  if (state.until) parts.push(`before:${state.until}`)
  const path = encodeURIComponent(parts.join(' '))

  // 最新順だけ /recent を付ける。人気順(既定)・おまかせは何も付けない
  const suffix = state.sort === 'new' ? '/recent' : ''

  // 投稿タイプ。画像・動画つきだけ/リンクだけを postTypes= の値集合で絞る
  const postTypes: string[] = []
  if (state.mediaOnly) postTypes.push('photo', 'gif', 'video')
  if (state.linksOnly) postTypes.push('link')
  const query = postTypes.length > 0 ? `?postTypes=${postTypes.join(',')}` : ''

  return `https://www.tumblr.com/search/${path}${suffix}${query}`
}

export const tumblr: PlatformDef = {
  id: 'tumblr',
  name: 'Tumblr',
  group: 'sns',
  brandColor: '#36465D',
  requiresLogin: false,
  googleSite: 'tumblr.com',
  support: {
    keywords: { level: 'partial', noteKey: 'note.loose.and' },
    exactPhrase: { level: 'full' },
    exclude: { level: 'full' },
    fromUser: { level: 'full' },
    hashtag: { level: 'full' },
    period: { level: 'full' },
    mediaOnly: { level: 'full' },
    linksOnly: { level: 'full' },
    sortOrder: { level: 'full' },
  },
  buildUrl,
  dynamicSupport: (state) => {
    const overrides: Partial<Record<ConceptId, ConceptSupport>> = {
      // 新着/人気以外(急上昇)は無いので落とす
      ...limitSort(state.sort, ['new', 'top'], 'note.sortOrder.otherSite'),
    }
    // タグページ(単一タグ・他の条件なし)は並び順をURLで指定できない(人気順固定)ので落とす
    if (singleTagOnly(state)) {
      overrides.sortOrder = { level: 'none', noteKey: 'note.tumblr.tagSort' }
    }
    return overrides
  },
}
