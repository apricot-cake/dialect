import type { ConceptId, ConceptSupport, ParsedSearch, PlatformDef, PostLanguage, QueryState, UrlPart } from '../types'
import { limitSort, POST_LANGUAGE_CODES } from '../types'
import {
  andTerms,
  exactPhrases,
  hasPositiveTerm,
  stripAt,
  stripHash,
  words,
} from '../text'
import { encodeTokens, lit, minusExcludeTokens, part, quotedTermTokens, tok, type Token } from '../urlParts'
import {
  applyBins,
  emptyBins,
  hostMatches,
  isIsoDate,
  leftoverParams,
  pathSegments,
  tokenize,
  unquote,
} from '../parse'

// 出典: docs/operator-research.md
// 演算子は公式ドキュメントあり(除外 - のみ未文書化・実測動作)。ログイン不要。
// tab=latest は未文書化だが social-app のコードに実装されている。
// media=true(メディアのみ)は2026-07-09にURL叩きで再検証: 以前は
// フィーチャーゲート中で保留していたが、現在は検索フォームにトグルは出ないものの
// URLへ付けると実際に絞り込まれ、ユーザー/フィードタブも隠れる(サーバー側が認識する
// 挙動)ことを確認できたため採用する。GUI上に対応するトグルはまだ無いため
// 出所は「URL叩き」(フォーム操作での採取ではない)
function buildParts(state: QueryState): UrlPart[] | null {
  // ユーザー検索(tab=user)はアカウント名/ハンドルへのゆるい一致で、本文演算子が効かない。
  // 2026-07-09 GUI操作で確認: 「猫 -犬」で検索しても「犬猫」を含むアカウントが普通に
  // 返る(除外が効かない)、引用符も無視して同じ結果になる(完全一致にならない)。
  // よって語句はそのまま連結するだけにし、他の演算子は使わない
  if (state.resultType === 'people') {
    const toks = [
      ...andTerms(state).map((t) => tok(t, 'keywords')),
      ...exactPhrases(state).map((p) => tok(p, 'exactPhrase')),
    ]
    if (toks.length === 0) return null
    return [
      lit('https://bsky.app/search?q='),
      ...encodeTokens(toks),
      part('&tab=user', 'resultType'),
    ]
  }

  // メンション先・リンク先だけの検索もBlueskyでは成立するので、正の条件に数える
  if (!hasPositiveTerm(state) && !state.mentionsUser.trim() && !state.domain.trim()) {
    return null
  }

  const toks: Token[] = []
  toks.push(...quotedTermTokens(state))
  toks.push(...minusExcludeTokens(state))
  if (state.fromUser.trim()) toks.push(tok(`from:${stripAt(state.fromUser)}`, 'fromUser'))
  if (state.mentionsUser.trim()) toks.push(tok(`mentions:${stripAt(state.mentionsUser)}`, 'mentionsUser'))
  if (state.domain.trim()) toks.push(tok(`domain:${state.domain.trim()}`, 'domain'))
  toks.push(...words(state.hashtag).map((t) => tok(`#${stripHash(t)}`, 'hashtag')))
  if (state.since) toks.push(tok(`since:${state.since}`, 'period'))
  if (state.until) toks.push(tok(`until:${state.until}`, 'period'))

  const parts: UrlPart[] = [lit('https://bsky.app/search?q='), ...encodeTokens(toks)]
  // tab=latest=新しい順。人気順・指定なしは既定のTopタブのまま開く
  if (state.sort === 'new') parts.push(part('&tab=latest', 'sortOrder'))
  // 言語は &lang= のURLパラメータで送る(2026-07-09 GUI採取: 検索ページの言語ドロップダウンが
  // 生成する形。lang: 演算子もAPIレベルでは効くが、UIは lang: をクエリ文字扱いする=実プロダクトの
  // 生成形に揃える)。クエリ本体とは別枠なので他演算子と自由に合成できる
  if (state.language) parts.push(part(`&lang=${state.language}`, 'language'))
  if (state.mediaOnly) parts.push(part('&media=true', 'mediaOnly'))
  return parts
}

// resultType=people(アカウント検索)は許可リスト方式(Blueskyが対応する1値のみ)。
// 選ばれたら、アカウント検索では効かない演算子をまとめて「使えない」に落とす
const PEOPLE_CONFLICT: ConceptSupport = {
  level: 'none',
  noteKey: 'note.bluesky.peopleConflict',
}
function dynamicSupport(
  state: QueryState,
): Partial<Record<ConceptId, ConceptSupport>> {
  const overrides: Partial<Record<ConceptId, ConceptSupport>> = {}
  if (state.resultType === 'people') {
    // 語句どうしのANDも保証されない、ふつうの部分一致(note.loose.and)
    overrides.keywords = { level: 'partial', noteKey: 'note.loose.and' }
    // 完全一致は引用符が無視されるが、語句自体はゆるい一致の検索語として送られる
    // (buildParts が実際に送っている)ので「使えない」ではなく「ゆるく畳む」近似
    overrides.exactPhrase = { level: 'partial', noteKey: 'note.loose.exact' }
    overrides.exclude = PEOPLE_CONFLICT
    overrides.fromUser = PEOPLE_CONFLICT
    overrides.mentionsUser = PEOPLE_CONFLICT
    overrides.domain = PEOPLE_CONFLICT
    overrides.hashtag = PEOPLE_CONFLICT
    overrides.period = PEOPLE_CONFLICT
    overrides.mediaOnly = PEOPLE_CONFLICT
    overrides.language = PEOPLE_CONFLICT
    overrides.sortOrder = PEOPLE_CONFLICT
  } else if (state.resultType) {
    // Bluesky が対応しない値(他サイト専用)
    overrides.resultType = { level: 'none', noteKey: 'note.resultType.otherSite' }
  }
  return {
    ...overrides,
    ...(state.resultType !== 'people'
      ? limitSort(state.sort, ['new', 'top'], 'note.sortOrder.otherSite')
      : {}),
  }
}

// 逆翻訳: bsky.app/search?q=…。tab=user(アカウント検索)は語だけ、それ以外は
// クエリ内演算子(from:/mentions:/domain:/since:/until:/#/-/"…")を概念へ戻す
function parseUrl(url: URL): ParsedSearch | null {
  if (!hostMatches(url, 'bsky.app')) return null
  if (pathSegments(url)[0] !== 'search') return null
  const q = url.searchParams.get('q')
  if (!q) return null

  const patch: Partial<QueryState> = {}
  const ignored: string[] = []
  const consumed = new Set(['q', 'tab', 'lang', 'media'])

  const lang = url.searchParams.get('lang')
  if (lang) {
    if ((POST_LANGUAGE_CODES as readonly string[]).includes(lang)) patch.language = lang as PostLanguage
    else ignored.push(`lang=${lang}`)
  }
  const media = url.searchParams.get('media')
  if (media === 'true') patch.mediaOnly = true
  else if (media) ignored.push(`media=${media}`)

  const tab = url.searchParams.get('tab')
  if (tab === 'user') {
    // アカウント検索。本文演算子は効かないため語をそのままキーワードとして読む
    patch.resultType = 'people'
    const terms = words(q)
    if (terms.length > 0) patch.terms = terms
    leftoverParams(url, consumed, ignored)
    return { patch, ignored }
  }
  if (tab === 'latest') patch.sort = 'new'
  else if (tab === 'top') patch.sort = 'top'
  else if (tab) ignored.push(`tab=${tab}`)

  const bins = emptyBins()
  for (const token of tokenize(q)) {
    if (token.startsWith('from:')) patch.fromUser = token.slice('from:'.length)
    else if (token.startsWith('mentions:')) patch.mentionsUser = token.slice('mentions:'.length)
    else if (token.startsWith('domain:')) patch.domain = token.slice('domain:'.length)
    else if (token.startsWith('since:')) {
      const v = token.slice('since:'.length)
      if (isIsoDate(v)) patch.since = v
      else ignored.push(token)
    } else if (token.startsWith('until:')) {
      const v = token.slice('until:'.length)
      if (isIsoDate(v)) patch.until = v
      else ignored.push(token)
    } else if (token.startsWith('lang:')) {
      // UIは生成しないがAPIレベルで効く形。&lang= と同じ概念へ戻す
      const code = token.slice('lang:'.length)
      if ((POST_LANGUAGE_CODES as readonly string[]).includes(code)) patch.language = code as PostLanguage
      else ignored.push(token)
    } else if (token.startsWith('#') && token.length > 1) bins.hashtags.push(token.slice(1))
    else if (token.startsWith('"')) bins.phrases.push(unquote(token))
    else if (token.startsWith('-') && token.length > 1) bins.excludes.push(token.slice(1))
    else bins.terms.push(token)
  }
  applyBins(patch, bins)
  leftoverParams(url, consumed, ignored)
  return { patch, ignored }
}

export const bluesky: PlatformDef = {
  id: 'bluesky',
  name: 'Bluesky',
  group: 'sns',
  brandColor: '#0085ff',
  requiresLogin: false,
  googleSite: 'bsky.app',
  support: {
    keywords: { level: 'full' },
    exactPhrase: { level: 'full' },
    exclude: { level: 'partial' },
    fromUser: { level: 'full', noteKey: 'note.bluesky.fromUser' },
    mentionsUser: { level: 'full', noteKey: 'note.bluesky.fromUser' },
    domain: { level: 'full' },
    hashtag: { level: 'full' },
    period: { level: 'full' },
    mediaOnly: { level: 'full' },
    language: { level: 'full' },
    resultType: { level: 'full' },
    sortOrder: { level: 'partial' },
  },
  buildParts,
  parseUrl,
  dynamicSupport,
}
