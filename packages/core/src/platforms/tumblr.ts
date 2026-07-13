import type {
  ConceptId,
  ConceptSupport,
  ParsedSearch,
  PlatformDef,
  QueryState,
  UrlPart,
} from '../types.js'
import { limitSort } from '../types.js'
import { hasPositiveTerm, minusExcludes, quotedTerms, stripAt, stripHash, words } from '../text.js'
import {
  encodeTokens,
  lit,
  minusExcludeTokens,
  part,
  quotedTermTokens,
  tok,
  type Token,
} from '../urlParts.js'
import {
  applyBins,
  emptyBins,
  hostMatches,
  isIsoDate,
  leftoverParams,
  pathSegments,
  tokenize,
  unquote,
} from '../parse.js'

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
    state.mediaOnly
  return !hasOtherConditions && tagNames.length === 1 ? tagNames[0] : null
}

function buildParts(state: QueryState): UrlPart[] | null {
  const singleTag = singleTagOnly(state)
  // 単一タグのみ(他の条件が何もない)ならタグページ。並び順・投稿タイプ等はURLで指定できない(人気順固定)
  if (singleTag) {
    return [lit('https://www.tumblr.com/tagged/'), part(encodeURIComponent(singleTag), 'hashtag')]
  }

  if (!hasPositiveTerm(state)) return null

  // それ以外はコンテンツ検索へまとめる(複数タグは #tag で本物のタグ演算子として送る)
  const toks: Token[] = [...quotedTermTokens(state), ...minusExcludeTokens(state)]
  if (state.fromUser.trim()) toks.push(tok(`from:${stripAt(state.fromUser)}`, 'fromUser'))
  toks.push(...words(state.hashtag).map((t) => tok(`#${stripHash(t)}`, 'hashtag')))
  if (state.since) toks.push(tok(`since:${state.since}`, 'period'))
  if (state.until) toks.push(tok(`before:${state.until}`, 'period'))

  const parts: UrlPart[] = [lit('https://www.tumblr.com/search/'), ...encodeTokens(toks)]

  // 最新順だけ /recent を付ける。人気順(既定)・指定なしは何も付けない
  if (state.sort === 'new') parts.push(part('/recent', 'sortOrder'))

  // 投稿タイプ。画像・動画つきだけを postTypes= の値集合で絞る
  if (state.mediaOnly) {
    parts.push(part('?postTypes=photo,gif,video', 'mediaOnly'))
  }

  return parts
}

// 逆翻訳: /search/{q}(/recent)?postTypes=… と /tagged/{tag}。q内の from:/since:/
// before:/#/-/"…" を概念へ戻し、postTypes は画像・動画つき/リンクありへ振り分ける
function parseUrl(url: URL): ParsedSearch | null {
  if (!hostMatches(url, 'tumblr.com')) return null
  const segs = pathSegments(url)
  const patch: Partial<QueryState> = {}
  const ignored: string[] = []

  if (segs[0] === 'tagged' && segs[1]) {
    patch.hashtag = segs[1]
    leftoverParams(url, new Set(), ignored)
    return { patch, ignored }
  }
  if (segs[0] !== 'search' || !segs[1]) return null
  if (segs[2] === 'recent') patch.sort = 'new'
  else if (segs[2]) ignored.push(`/${segs[2]}`)

  const bins = emptyBins()
  for (const token of tokenize(segs[1])) {
    if (token.startsWith('from:')) patch.fromUser = token.slice('from:'.length)
    else if (token.startsWith('since:')) {
      const v = token.slice('since:'.length)
      if (isIsoDate(v)) patch.since = v
      else ignored.push(token)
    } else if (token.startsWith('before:')) {
      const v = token.slice('before:'.length)
      if (isIsoDate(v)) patch.until = v
      else ignored.push(token)
    } else if (token.startsWith('#') && token.length > 1) bins.hashtags.push(token.slice(1))
    else if (token.startsWith('"')) bins.phrases.push(unquote(token))
    else if (token.startsWith('-') && token.length > 1) bins.excludes.push(token.slice(1))
    else bins.terms.push(token)
  }
  applyBins(patch, bins)

  const postTypes = url.searchParams.get('postTypes')
  if (postTypes !== null) {
    const values = new Set(
      postTypes
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    )
    const media = ['photo', 'gif', 'video'].filter((m) => values.delete(m))
    if (media.length > 0) patch.mediaOnly = true
    // link(リンクだけ)は概念を剪定済み。残った値はまとめて無視へ回す
    for (const rest of values) ignored.push(`postTypes=${rest}`)
  }
  leftoverParams(url, new Set(['postTypes']), ignored)
  return { patch, ignored }
}

export const tumblr: PlatformDef = {
  id: 'tumblr',
  name: 'Tumblr',
  group: 'sns',
  brandColor: '#36465D',
  requiresLogin: false,
  support: {
    keywords: { level: 'partial', noteKey: 'note.loose.and' },
    exactPhrase: { level: 'full' },
    exclude: { level: 'full' },
    fromUser: { level: 'full' },
    hashtag: { level: 'full' },
    period: { level: 'full' },
    mediaOnly: { level: 'full' },
    sortOrder: { level: 'full' },
  },
  buildParts,
  parseUrl,
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
