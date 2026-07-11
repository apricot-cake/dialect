import type { ParsedSearch, PlatformDef, PostLanguage, QueryState, UrlPart } from '../types'
import { POST_LANGUAGE_CODES } from '../types'
import { hasPositiveTerm, stripAt, stripHash, words } from '../text'
import { encodeTokens, lit, minusExcludeTokens, part, quotedTermTokens, tok } from '../urlParts'
import {
  applyBins,
  emptyBins,
  hostIs,
  isIsoDate,
  leftoverParams,
  pathSegments,
  tokenize,
  unquote,
} from '../parse'

// 出典: 2026-07-08 実機確認(ログイン済みブラウザ、GUI操作)。mastodon.social/search?q=&type=statuses
// はSPAだがURL遷移だけで検索が自動実行される(Misskeyと違い手動ボタン不要)。ハッシュタグ単独は
// /tags/{tag} でログアウトでも閲覧可能。本文検索(投稿タブ)は未ログインだと"hello"のような
// 一般語でも0件になり実質ログイン必須(検索オプションパネルも「ログイン時のみ利用できます」と表示)。
// ログイン後に演算子を実測(from:/-語/"..."/before:/after:/-is:reply/language:/has:media/has:link):
// 除外語を足すと該当投稿が結果から消える、完全一致は語順を入れ替えると0件になる(真の完全一致)、
// from:は投稿者で絞り込む、before:/after:は日付の前後で正しく絞られる、-is:replyでリプライが
// 除外される、language:で言語が絞られる、has:media/has:linkはそれぞれ独立に結果を変える、
// をすべて実際の投稿の増減で確認済み。
function buildParts(state: QueryState): UrlPart[] | null {
  const tagNames = words(state.hashtag).map(stripHash)
  const handle = stripAt(state.fromUser)
  const textToks = quotedTermTokens(state)
  const excludeToks = minusExcludeTokens(state)

  const hasOtherConditions =
    textToks.length > 0 ||
    excludeToks.length > 0 ||
    Boolean(handle) ||
    Boolean(state.since) ||
    Boolean(state.until) ||
    state.mediaOnly ||
    state.linksOnly ||
    state.excludeReplies ||
    Boolean(state.language)
  // 単一タグのみ(他の条件が何もない)ならタグページ(ログアウトでも見られる唯一の経路)
  if (tagNames.length === 1 && !hasOtherConditions) {
    return [
      lit('https://mastodon.social/tags/'),
      part(encodeURIComponent(tagNames[0]), 'hashtag'),
    ]
  }

  if (!hasPositiveTerm(state)) return null

  const toks = [...textToks, ...tagNames.map((t) => tok(`#${t}`, 'hashtag'))]
  toks.push(...excludeToks)
  if (handle) {
    // リモートユーザー(@user@host)は from:user@host の形でそのまま送れる(実機確認済み)
    toks.push(tok(`from:${handle}`, 'fromUser'))
  }
  if (state.since) toks.push(tok(`after:${state.since}`, 'period'))
  if (state.until) toks.push(tok(`before:${state.until}`, 'period'))
  if (state.mediaOnly) toks.push(tok('has:media', 'mediaOnly'))
  if (state.linksOnly) toks.push(tok('has:link', 'linksOnly'))
  if (state.excludeReplies) toks.push(tok('-is:reply', 'excludeReplies'))
  if (state.language) toks.push(tok(`language:${state.language}`, 'language'))

  // type=statuses は指定の有無によらず常に送る固定値なので無帰属
  return [
    lit('https://mastodon.social/search?q='),
    ...encodeTokens(toks),
    lit('&type=statuses'),
  ]
}

// 逆翻訳: mastodon.social/search?q=…&type=statuses と /tags/{tag}。他インスタンスの
// URLはホスト名からMastodonと判別できないため、既定インスタンスのみ受ける
function parseUrl(url: URL): ParsedSearch | null {
  if (!hostIs(url, 'mastodon.social')) return null
  const segs = pathSegments(url)
  const patch: Partial<QueryState> = {}
  const ignored: string[] = []

  if (segs[0] === 'tags' && segs[1]) {
    patch.hashtag = segs[1]
    leftoverParams(url, new Set(), ignored)
    return { patch, ignored }
  }
  if (segs[0] !== 'search') return null
  const q = url.searchParams.get('q')
  if (!q) return null
  const type = url.searchParams.get('type')
  if (type !== null && type !== 'statuses') ignored.push(`type=${type}`)

  const bins = emptyBins()
  for (const token of tokenize(q)) {
    if (token === 'has:media') patch.mediaOnly = true
    else if (token === 'has:link') patch.linksOnly = true
    else if (token === '-is:reply') patch.excludeReplies = true
    else if (token.startsWith('from:')) patch.fromUser = token.slice('from:'.length)
    else if (token.startsWith('after:')) {
      const v = token.slice('after:'.length)
      if (isIsoDate(v)) patch.since = v
      else ignored.push(token)
    } else if (token.startsWith('before:')) {
      const v = token.slice('before:'.length)
      if (isIsoDate(v)) patch.until = v
      else ignored.push(token)
    } else if (token.startsWith('language:')) {
      const code = token.slice('language:'.length)
      if ((POST_LANGUAGE_CODES as readonly string[]).includes(code)) patch.language = code as PostLanguage
      else ignored.push(token)
    } else if (token.startsWith('#') && token.length > 1) bins.hashtags.push(token.slice(1))
    else if (token.startsWith('"')) bins.phrases.push(unquote(token))
    else if (token.startsWith('-') && token.length > 1) bins.excludes.push(token.slice(1))
    else bins.terms.push(token)
  }
  applyBins(patch, bins)
  leftoverParams(url, new Set(['q', 'type']), ignored)
  return { patch, ignored }
}

export const mastodon: PlatformDef = {
  id: 'mastodon',
  name: 'Mastodon',
  group: 'sns',
  brandColor: '#6364FF',
  requiresLogin: true,
  support: {
    keywords: { level: 'full', noteKey: 'note.mastodon.keywords' },
    exactPhrase: { level: 'full' },
    exclude: { level: 'full' },
    fromUser: { level: 'full' },
    hashtag: { level: 'full', noteKey: 'note.tagPage.combined' },
    period: { level: 'full' },
    mediaOnly: { level: 'full' },
    linksOnly: { level: 'full' },
    excludeReplies: { level: 'full' },
    language: { level: 'full' },
    sortOrder: { level: 'none', noteKey: 'note.nosort' },
  },
  buildParts,
  parseUrl,
}
