import type { ConceptId, ConceptSupport, ParsedSearch, PlatformDef, PostLanguage, QueryState, UrlPart } from '../types'
import { limitSort, POST_LANGUAGE_CODES } from '../types'
import {
  andTerms,
  hasPositiveTerm,
  stripAt,
  stripHash,
  stripQuerySyntax,
  words,
} from '../text'
import { encodeTokens, formEncode, lit, minusExcludeTokens, part, quotedTermTokens, tok, type Token } from '../urlParts'
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
// 演算子は公式ドキュメントあり(除外 - のみ未文書化・実測動作)。2026-07-11に仕様変更で
// 未ログイン検索が不可になったため requiresLogin: true(issue #27)。
// tab=latest は未文書化だが social-app のコードに実装されている。
// media=true(メディアのみ)は2026-07-09にURL叩きで再検証: 以前は
// フィーチャーゲート中で保留していたが、現在は検索フォームにトグルは出ないものの
// URLへ付けると実際に絞り込まれ、ユーザー/フィードタブも隠れる(サーバー側が認識する
// 挙動)ことを確認できたため採用する。GUI上に対応するトグルはまだ無いため
// 出所は「URL叩き」(フォーム操作での採取ではない)
//
// 2026-07-11、issue #27の全項目監査(GUI操作・ログイン済み)で「高度な検索オプション」
// モーダルの全項目を採取(docs/operator-research.mdの該当節参照)。author=/mentions=/domain=/
// tag=(いずれも除外版と対で存在)は、q内の from:/mentions:/domain:/#tag トークン(単一値・
// AND限定)とは別径路のURLパラメータで、スペース区切りの複数値=OR(実測で確認済み)。
// 既存のfromUser/excludeUser/mentionsUser/domain概念をBluesky専用にこの新径路へ流用し
// (概念自体の型・他サイトでの意味論は変えない)、hashtagOrはAND意味論のhashtagとは
// 別概念として新設(issue #26のkeywordsOr方式を踏襲、ユーザー承認済みの設計判断)。
// url=/excludeUrl=は対応する既存概念が無い完全新規(linkUrl/excludeLinkUrl)。
function buildParts(state: QueryState): UrlPart[] | null {
  // ユーザー検索(tab=user)はアカウント名/ハンドルへのゆるい一致で、本文演算子が効かない。
  // 2026-07-09 GUI操作で確認: 「猫 -犬」で検索しても「犬猫」を含むアカウントが普通に
  // 返る(除外が効かない)、引用符も無視して同じ結果になる(完全一致にならない)。
  // よって語だけをそのまま連結し、完全一致は送らない(非対応)・他の演算子も使わない
  if (state.resultType === 'people') {
    const toks = andTerms(state).map((t) => tok(stripQuerySyntax(t), 'keywords'))
    if (toks.length === 0) return null
    return [
      lit('https://bsky.app/search?q='),
      ...encodeTokens(toks),
      part('&tab=user', 'resultType'),
    ]
  }

  // メンション先・リンク先・ハッシュタグOR・埋め込みURLだけの検索もBlueskyでは成立するので、
  // 正の条件に数える(除外系・トグル系は元々のhasPositiveTermの流儀通り単独では不十分)
  if (
    !hasPositiveTerm(state) &&
    !state.mentionsUser.trim() &&
    !state.domain.trim() &&
    !state.hashtagOr.trim() &&
    !state.linkUrl.trim()
  ) {
    return null
  }

  const toks: Token[] = []
  toks.push(...quotedTermTokens(state))
  toks.push(...minusExcludeTokens(state))
  // hashtag(AND)はq内の#タグ並置のまま(変更なし)。OR意味論のhashtagOrは下でtag=として送る
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
  if (state.videoOnly) parts.push(part('&video=true', 'videoOnly'))
  // replies=none/only は同じパラメータの2値(排他)。両方選ばれた矛盾状態は
  // excludeReplies(返信を除く)を優先し、repliesOnly側はdynamicSupportでnoneに落として正直に伝える
  if (state.excludeReplies) parts.push(part('&replies=none', 'excludeReplies'))
  else if (state.repliesOnly) parts.push(part('&replies=only', 'repliesOnly'))
  if (state.followingOnly) parts.push(part('&following=true', 'followingOnly'))

  // 追加フィルタ群(author=/mentions=/domain=/tag=/url= とそれぞれの除外版)。
  // 既存フィールドを流用する4組はスペース区切りで複数語に割り、スペースをformEncodeで
  // +として結合する(2026-07-11 GUI採取: author=jay.bsky.team+pfrazee.com の実際の形と一致)
  if (state.fromUser.trim()) {
    parts.push(part(`&author=${formEncode(words(state.fromUser).map(stripAt).join(' '))}`, 'fromUser'))
  }
  if (state.excludeUser.trim()) {
    parts.push(part(`&excludeAuthor=${formEncode(words(state.excludeUser).map(stripAt).join(' '))}`, 'excludeUser'))
  }
  if (state.mentionsUser.trim()) {
    parts.push(part(`&mentions=${formEncode(words(state.mentionsUser).map(stripAt).join(' '))}`, 'mentionsUser'))
  }
  if (state.excludeMentions.trim()) {
    parts.push(
      part(`&excludeMentions=${formEncode(words(state.excludeMentions).map(stripAt).join(' '))}`, 'excludeMentions'),
    )
  }
  if (state.domain.trim()) {
    parts.push(part(`&domain=${formEncode(words(state.domain).join(' '))}`, 'domain'))
  }
  if (state.excludeDomain.trim()) {
    parts.push(part(`&excludeDomain=${formEncode(words(state.excludeDomain).join(' '))}`, 'excludeDomain'))
  }
  // url=/excludeUrl= は単一値のみ確認済み(複数値は未検証)なので、そのままtrimして送る
  if (state.linkUrl.trim()) {
    parts.push(part(`&url=${formEncode(stripQuerySyntax(state.linkUrl.trim()))}`, 'linkUrl'))
  }
  if (state.excludeLinkUrl.trim()) {
    parts.push(part(`&excludeUrl=${formEncode(stripQuerySyntax(state.excludeLinkUrl.trim()))}`, 'excludeLinkUrl'))
  }
  // tag=(OR意味論。既存hashtag概念とは別物)とexcludeTag=
  if (state.hashtagOr.trim()) {
    parts.push(part(`&tag=${formEncode(words(state.hashtagOr).map(stripHash).join(' '))}`, 'hashtagOr'))
  }
  if (state.excludeHashtag.trim()) {
    parts.push(part(`&excludeTag=${formEncode(words(state.excludeHashtag).map(stripHash).join(' '))}`, 'excludeHashtag'))
  }
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
    // アカウント検索は引用符を無視し完全一致が成立しないため、送らない(非対応)
    overrides.exactPhrase = { level: 'none', noteKey: 'note.exactPhrase.dropped' }
    overrides.exclude = PEOPLE_CONFLICT
    overrides.fromUser = PEOPLE_CONFLICT
    overrides.excludeUser = PEOPLE_CONFLICT
    overrides.mentionsUser = PEOPLE_CONFLICT
    overrides.excludeMentions = PEOPLE_CONFLICT
    overrides.domain = PEOPLE_CONFLICT
    overrides.excludeDomain = PEOPLE_CONFLICT
    overrides.linkUrl = PEOPLE_CONFLICT
    overrides.excludeLinkUrl = PEOPLE_CONFLICT
    overrides.hashtag = PEOPLE_CONFLICT
    overrides.hashtagOr = PEOPLE_CONFLICT
    overrides.excludeHashtag = PEOPLE_CONFLICT
    overrides.period = PEOPLE_CONFLICT
    overrides.mediaOnly = PEOPLE_CONFLICT
    overrides.videoOnly = PEOPLE_CONFLICT
    overrides.excludeReplies = PEOPLE_CONFLICT
    overrides.repliesOnly = PEOPLE_CONFLICT
    overrides.followingOnly = PEOPLE_CONFLICT
    overrides.language = PEOPLE_CONFLICT
    overrides.sortOrder = PEOPLE_CONFLICT
  } else if (state.resultType) {
    // Bluesky が対応しない値(他サイト専用)
    overrides.resultType = { level: 'none', noteKey: 'note.resultType.otherSite' }
  }
  // replies=none/only は同じパラメータの2値なので同時選択は矛盾。buildParts は
  // excludeReplies(replies=none)を優先するので、その状態では repliesOnly が実際には
  // 送られない(=静かな嘘)。people検索側で既にnoneのときは上書きしない
  if (state.excludeReplies && state.repliesOnly && overrides.repliesOnly === undefined) {
    overrides.repliesOnly = { level: 'none', noteKey: 'note.bluesky.repliesConflict' }
  }
  return {
    ...overrides,
    ...(state.resultType !== 'people'
      ? limitSort(state.sort, ['new', 'top'], 'note.sortOrder.otherSite')
      : {}),
  }
}

// 逆翻訳: bsky.app/search?q=…。tab=user(アカウント検索)は語だけ、それ以外はURLパラメータ
// (author=/mentions=/domain=/tag=/url=とそれぞれの除外版、video=/replies=/following=)を
// 優先して読み、旧いq内トークン(from:/mentions:/domain:/#tag)は後方互換で読む
// (buildParts が出すのは常に新パラメータ形式。2026-07-11 issue #27)
function parseUrl(url: URL): ParsedSearch | null {
  if (!hostMatches(url, 'bsky.app')) return null
  if (pathSegments(url)[0] !== 'search') return null
  const q = url.searchParams.get('q')
  // q= 自体が無いURLは検索として読めない。ただし値が空文字(絞り込みだけの検索)は許す
  if (q === null) return null

  const patch: Partial<QueryState> = {}
  const ignored: string[] = []
  const consumed = new Set([
    'q', 'tab', 'lang', 'media', 'video', 'replies', 'following',
    'author', 'excludeAuthor', 'mentions', 'excludeMentions',
    'domain', 'excludeDomain', 'url', 'excludeUrl', 'tag', 'excludeTag',
  ])

  const lang = url.searchParams.get('lang')
  if (lang) {
    if ((POST_LANGUAGE_CODES as readonly string[]).includes(lang)) patch.language = lang as PostLanguage
    else ignored.push(`lang=${lang}`)
  }
  const media = url.searchParams.get('media')
  if (media === 'true') patch.mediaOnly = true
  else if (media) ignored.push(`media=${media}`)
  const video = url.searchParams.get('video')
  if (video === 'true') patch.videoOnly = true
  else if (video) ignored.push(`video=${video}`)
  const replies = url.searchParams.get('replies')
  if (replies === 'none') patch.excludeReplies = true
  else if (replies === 'only') patch.repliesOnly = true
  else if (replies) ignored.push(`replies=${replies}`)
  const following = url.searchParams.get('following')
  if (following === 'true') patch.followingOnly = true
  else if (following) ignored.push(`following=${following}`)

  // 新パラメータ形式(スペース区切り複数値)。旧q内トークンより優先する
  const author = url.searchParams.get('author')
  if (author) patch.fromUser = words(author).join(' ')
  const excludeAuthor = url.searchParams.get('excludeAuthor')
  if (excludeAuthor) patch.excludeUser = words(excludeAuthor).join(' ')
  const mentions = url.searchParams.get('mentions')
  if (mentions) patch.mentionsUser = words(mentions).join(' ')
  const excludeMentionsParam = url.searchParams.get('excludeMentions')
  if (excludeMentionsParam) patch.excludeMentions = words(excludeMentionsParam).join(' ')
  const domain = url.searchParams.get('domain')
  if (domain) patch.domain = words(domain).join(' ')
  const excludeDomain = url.searchParams.get('excludeDomain')
  if (excludeDomain) patch.excludeDomain = words(excludeDomain).join(' ')
  const linkUrl = url.searchParams.get('url')
  if (linkUrl) patch.linkUrl = linkUrl
  const excludeLinkUrl = url.searchParams.get('excludeUrl')
  if (excludeLinkUrl) patch.excludeLinkUrl = excludeLinkUrl
  const tag = url.searchParams.get('tag')
  if (tag) patch.hashtagOr = words(tag).join(' ')
  const excludeTag = url.searchParams.get('excludeTag')
  if (excludeTag) patch.excludeHashtag = words(excludeTag).join(' ')

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
    // 旧q内トークン形式(後方互換)。新パラメータが既に読めていれば優先し上書きしない
    if (token.startsWith('from:')) {
      if (patch.fromUser === undefined) patch.fromUser = token.slice('from:'.length)
    } else if (token.startsWith('mentions:')) {
      if (patch.mentionsUser === undefined) patch.mentionsUser = token.slice('mentions:'.length)
    } else if (token.startsWith('domain:')) {
      if (patch.domain === undefined) patch.domain = token.slice('domain:'.length)
    } else if (token.startsWith('since:')) {
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
  requiresLogin: true,
  support: {
    keywords: { level: 'full' },
    exactPhrase: { level: 'full' },
    exclude: { level: 'partial' },
    fromUser: { level: 'full', noteKey: 'note.bluesky.fromUser' },
    excludeUser: { level: 'full', noteKey: 'note.bluesky.fromUser' },
    mentionsUser: { level: 'full', noteKey: 'note.bluesky.fromUser' },
    excludeMentions: { level: 'full', noteKey: 'note.bluesky.fromUser' },
    domain: { level: 'full', noteKey: 'note.bluesky.domainMulti' },
    excludeDomain: { level: 'full', noteKey: 'note.bluesky.domainMulti' },
    linkUrl: { level: 'full' },
    excludeLinkUrl: { level: 'full' },
    hashtag: { level: 'full' },
    hashtagOr: { level: 'full' },
    excludeHashtag: { level: 'full' },
    period: { level: 'full' },
    mediaOnly: { level: 'full' },
    videoOnly: { level: 'full' },
    excludeReplies: { level: 'full' },
    repliesOnly: { level: 'full' },
    followingOnly: { level: 'full', noteKey: 'note.bluesky.followingOnly' },
    language: { level: 'full' },
    resultType: { level: 'full' },
    sortOrder: { level: 'partial' },
  },
  buildParts,
  parseUrl,
  dynamicSupport,
}
