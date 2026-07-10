import type { ParsedSearch, PlatformDef, QueryState, UrlPart } from '../types'
import { andTerms, stripAt, stripHash, words } from '../text'
import { encodeTokens, lit, minusExcludeTokens, part, tok, type Token } from '../urlParts'
import { hostIs, leftoverParams, pathSegments, tokenize, unquote } from '../parse'

// 出典: docs/operator-research.md(2026-07-03調査、2026-07-08にログイン済みGUI操作で除外・完全一致を再検証)
// 検索は /search?q=&type=note(要ログイン)。本文検索はMeilisearchで、語ごとのAND・除外(-語)が効く。
// ユーザー指定は &username=(フロントエンドのルーター定義で確認した非公式パラメータ)、リモートは
// host= を分ける。タグ単独なら /tags/(タグページ)、併用時は本文に「#タグ」を含む検索として畳み込む。
// 注意(2026-07-04確認): /search はSPAのためURL遷移だけでは検索が自動実行されず、遷移先で
// 「検索」ボタンの手動クリックが要る(q欄は埋まる)。その旨は note.misskey.keywords で告知する。
// 完全一致(2026-07-08 ログイン済みGUI操作で再検証): "..." で括っても隣接一致にならず、実在の投稿本文を
// そのまま引用符で括ってすら0件になる(引用符が文字として扱われ、クエリ全体を壊す)。さらに他のAND語と
// 組み合わせると検索全体が0件になる実害を確認した。機能しない条件を語のANDに
// 付け替えて送ることはしない(意味を変える畳み込み禁止)ため、非対応として送らない。
function buildParts(state: QueryState): UrlPart[] | null {
  const textToks: Token[] = andTerms(state).map((t) => tok(t, 'keywords'))
  const tagNames = words(state.hashtag).map(stripHash)
  const handle = stripAt(state.fromUser)
  const excludeToks = minusExcludeTokens(state)

  // タグ単独ならタグページ(ログアウトでも見られる唯一の経路)。
  // 除外の指定があるときはタグページでは表現できない(URLに載らず黙って捨てることになる)ので、
  // mastodon/tumblr と同じく検索ページへ回して #タグ+除外 として送る(2026-07-10 修正。
  // それまでタグ+除外の組み合わせで除外が黙って落ちていた=check:parts が検出)
  if (tagNames.length === 1 && textToks.length === 0 && !handle && excludeToks.length === 0) {
    return [
      lit('https://misskey.io/tags/'),
      part(encodeURIComponent(tagNames[0]), 'hashtag'),
    ]
  }

  // ノート本文にはタグが「#タグ」の文字列で含まれるため、部分一致検索に畳み込める
  const toks = [...textToks, ...tagNames.map((t) => tok(`#${t}`, 'hashtag'))]
  // ユーザー指定だけでは検索が実行されないため、検索語を必須にする
  if (toks.length === 0) return null
  // 除外は先頭に - をつける(Meilisearchのマイナス検索。非公式)
  toks.push(...excludeToks)

  // URLSearchParamsはスペースを「+」にするが、Misskey側が「+」を
  // スペースへ戻す保証がないため、%20になるencodeURIComponentで組む。
  // type=note は指定の有無によらず常に送る固定値なので無帰属
  const parts: UrlPart[] = [
    lit('https://misskey.io/search?q='),
    ...encodeTokens(toks),
    lit('&type=note'),
  ]
  if (handle) {
    // リモートユーザー(@user@host)は username と host に分ける
    const [user, host] = handle.split('@')
    parts.push(part(`&username=${encodeURIComponent(user)}`, 'fromUser'))
    if (host) parts.push(part(`&host=${encodeURIComponent(host)}`, 'fromUser'))
  }
  return parts
}

// 逆翻訳: misskey.io/search?q=…&type=note(&username=&host=) と /tags/{tag}。
// 他インスタンスはホスト名から判別できないため misskey.io のみ受ける
function parseUrl(url: URL): ParsedSearch | null {
  if (!hostIs(url, 'misskey.io')) return null
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
  if (type !== null && type !== 'note') ignored.push(`type=${type}`)

  const user = url.searchParams.get('username')
  const host = url.searchParams.get('host')
  if (user) patch.fromUser = host ? `${user}@${host}` : user
  else if (host) ignored.push(`host=${host}`)

  const terms: string[] = []
  const excludes: string[] = []
  const hashtags: string[] = []
  for (const token of tokenize(q)) {
    if (token.startsWith('-') && token.length > 1) excludes.push(token.slice(1))
    else if (token.startsWith('#') && token.length > 1) hashtags.push(token.slice(1))
    // 引用符はMisskeyでは機能しない(送ると壊れる)ため、語に分解して読む
    else if (token.startsWith('"')) terms.push(...words(unquote(token)))
    else terms.push(token)
  }
  if (terms.length > 0) patch.terms = terms
  if (excludes.length > 0) patch.exclude = excludes.join(' ')
  if (hashtags.length > 0) patch.hashtag = hashtags.join(' ')

  leftoverParams(url, new Set(['q', 'type', 'username', 'host']), ignored)
  return { patch, ignored }
}

export const misskey: PlatformDef = {
  id: 'misskey',
  name: 'Misskey.io',
  group: 'sns',
  brandColor: '#A1CA03',
  // 黄緑は輝度判定だと黒字になるが、Misskey本家の配色に合わせて白字で固定する
  ink: '#ffffff',
  requiresLogin: true,
  googleSite: 'misskey.io',
  support: {
    keywords: { level: 'partial', noteKey: 'note.misskey.keywords' },
    exactPhrase: { level: 'none', noteKey: 'note.exactPhrase.dropped' },
    exclude: { level: 'full' },
    fromUser: { level: 'partial', noteKey: 'note.misskey.fromUser' },
    hashtag: { level: 'full', noteKey: 'note.tagPage.combined' },
    sortOrder: { level: 'none', noteKey: 'note.nosort' },
  },
  buildParts,
  parseUrl,
}
