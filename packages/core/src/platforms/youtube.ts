import type {
  ConceptId,
  ConceptSupport,
  ParsedSearch,
  PlatformDef,
  QueryState,
  ResultType,
  UrlPart,
} from '../types.js'
import { limitSort } from '../types.js'
import { andTerms, exactPhrases, hasPositiveTerm, stripAt, stripHash, words } from '../text.js'
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
  daysAgoIso,
  emptyBins,
  hostMatches,
  isIsoDate,
  leftoverParams,
  pathSegments,
  tokenize,
  unquote,
} from '../parse.js'

// 出典: docs/operator-research.md
// search_query は検索ボックスと等価。before:/after: は非公式だが実機確認済み(2026-07-02)。
// sp= はprotobufのbase64。ソート・種別・動画の長さは1つのspに合成が必要(連結は不可)
// なので、ktsk.xyzのフィールド定義に基づいてバイト列から組み立てる:
//   sort(field1): 0x08 0x02(アップロード日順) / 0x08 0x03(視聴回数順=人気の近似)
//   filter(field2のサブメッセージ): type(field2) 0x10 0x0N、duration(field3) 0x18 0x0N
// 実測済みの値(CAM%3D・EgIYAQ%3D%3D・CAMSAhgB・EgIQAQ%3D%3D)をこの組み立てが
// 再現することを確認している。
// 2026-07-03実機確認: 視聴回数順(CAM系)は単独・長さとの合成とも動作するが、
// アップロード日順(CAI系)はソートが効かなくなっている(関連度のまま)。
// 復活の可能性に賭けて送信は続けるが、実質なりゆき表示になる。
// ユーザー指定はチャンネル内検索ページ(/@handle/search)への切り替えで近似する。
const SORT_BYTE: Record<'new' | 'top', number> = { new: 0x02, top: 0x03 }
// 種別(タイプ)のバイト。video=1/channel=2/playlist=3 は既存調査値、short=9 は
// 2026-07-04にYouTubeのフィルタUIから実測(sp=EgIQCQ%3D%3D)。ショート/再生リストはYouTube専用。
// 他サイト専用の値(プロフィール・シリーズ・ボード等)はYouTubeには無いため未収録
// (dynamicSupportでYouTube側は選択時にresultTypeをnoneへ落とす)
const TYPE_BYTE: Partial<Record<Exclude<ResultType, ''>, number>> = {
  video: 0x01,
  short: 0x09,
  channel: 0x02,
  playlist: 0x03,
}
// sp= は1つのbase64に並び順・種類・ライブが合成される複合断片なので、
// 寄与した概念を全部持つ1つの UrlPart として返す(分割不能=base64は3バイト/4文字境界)
function spPart(state: QueryState): UrlPart | null {
  const concepts: ConceptId[] = []
  // spで表せるのは新着/視聴回数(=人気)順のみ。hot等はYouTubeにないので送らない
  const sort = state.sort === 'new' || state.sort === 'top' ? state.sort : null
  if (sort) concepts.push('sortOrder')
  const filter: number[] = []
  const typeByte = state.resultType ? TYPE_BYTE[state.resultType] : undefined
  if (typeByte !== undefined) {
    filter.push(0x10, typeByte)
    concepts.push('resultType')
  }
  // ライブ配信の絞り込みは filter サブメッセージの field8(0x40)。2026-07-07にフィルタUIから実測
  if (state.liveOnly) {
    filter.push(0x40, 0x01)
    concepts.push('liveOnly')
  }
  const bytes: number[] = []
  if (sort) bytes.push(0x08, SORT_BYTE[sort])
  if (filter.length > 0) bytes.push(0x12, filter.length, ...filter)
  if (bytes.length === 0) return null
  return { text: `&sp=${encodeURIComponent(btoa(String.fromCharCode(...bytes)))}`, concepts }
}

function buildParts(state: QueryState): UrlPart[] | null {
  if (!hasPositiveTerm(state) && !state.keywordsOr.trim()) return null

  const toks: Token[] = []
  toks.push(...quotedTermTokens(state))
  toks.push(...minusExcludeTokens(state))
  if (state.titleOnly) {
    // intitle: は語ごとに付ける(非公式)。前置された語は元の概念+titleOnlyの複合になる
    for (const t of toks) {
      if (!t.text.startsWith('-') && !t.text.startsWith('(')) {
        t.text = `intitle:${t.text}`
        t.concepts = [...t.concepts, 'titleOnly']
      }
    }
  }
  // スコープ限定OR(「このどれかを含む」)。2語以上は a|b (パイプ、公式Data APIに記載)、
  // 1語は通常の語と同じ扱い。intitle:は付けない(2026-07-11に「手芸 猫|犬」の組み合わせを
  // youtube.comの検索結果で実機確認、issue #26)
  const orWords = words(state.keywordsOr)
  if (orWords.length >= 2) toks.push(tok(orWords.join('|'), 'keywordsOr'))
  else toks.push(...orWords.map((w) => tok(w, 'keywordsOr')))
  toks.push(...words(state.hashtag).map((t) => tok(`#${stripHash(t)}`, 'hashtag')))
  if (state.since) toks.push(tok(`after:${state.since}`, 'period'))
  if (state.until) toks.push(tok(`before:${state.until}`, 'period'))

  const handle = stripAt(state.fromUser)
  if (handle) {
    // チャンネル内検索。sp(並び順・長さ)は適用できない
    return [
      lit('https://www.youtube.com/@'),
      part(encodeURIComponent(handle), 'fromUser'),
      lit('/search?query='),
      ...encodeTokens(toks),
    ]
  }

  const parts: UrlPart[] = [
    lit('https://www.youtube.com/results?search_query='),
    ...encodeTokens(toks),
  ]
  const sp = spPart(state)
  if (sp) parts.push(sp)
  return parts
}

// 逆翻訳ここから。検索語のトークン(intitle:/after:/before:/#/-/"…")を概念へ戻す
function parseQueryTokens(q: string, patch: Partial<QueryState>, ignored: string[]): void {
  const bins = emptyBins()
  let titleOnly = false
  const orTerms: string[] = []
  for (let token of tokenize(q)) {
    if (token.startsWith('intitle:')) {
      titleOnly = true
      token = token.slice('intitle:'.length)
    }
    if (token.startsWith('after:')) {
      const v = token.slice('after:'.length)
      if (isIsoDate(v)) patch.since = v
      else ignored.push(token)
    } else if (token.startsWith('before:')) {
      const v = token.slice('before:'.length)
      if (isIsoDate(v)) patch.until = v
      else ignored.push(token)
    } else if (token.startsWith('#') && token.length > 1) bins.hashtags.push(token.slice(1))
    else if (token.startsWith('"')) bins.phrases.push(unquote(token))
    else if (token.startsWith('-') && token.length > 1) bins.excludes.push(token.slice(1))
    else if (token.includes('|')) {
      // a|b|...: スコープ限定OR(「このどれかを含む」)
      const parts = token
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean)
      if (parts.length >= 2) orTerms.push(...parts)
      else if (token) bins.terms.push(token)
    } else if (token) bins.terms.push(token)
  }
  applyBins(patch, bins)
  if (titleOnly) patch.titleOnly = true
  if (orTerms.length > 0) patch.keywordsOr = orTerms.join(' ')
}

/** protobufのvarintを読む。[値, 次の位置] を返し、壊れていれば null */
function readVarint(bytes: number[], at: number): [number, number] | null {
  let value = 0
  let shift = 0
  let i = at
  while (i < bytes.length) {
    const b = bytes[i]
    value |= (b & 0x7f) << shift
    i++
    if ((b & 0x80) === 0) return [value, i]
    shift += 7
    if (shift > 28) return null
  }
  return null
}

// sp のfilterサブメッセージを読む(spParamの逆方向)。field1=アップロード日バケット
// (1時間/今日/今週/今月/今年)はDialectでは期間の開始日への近似として読む。
// 知らないフィールドは ignored に残して読める分だけ拾う
function parseSpFilter(bytes: number[], patch: Partial<QueryState>, ignored: string[]): void {
  const UPLOAD_DAYS: Record<number, number> = { 1: 0, 2: 0, 3: 7, 4: 31, 5: 365 }
  let i = 0
  while (i < bytes.length) {
    const tag = readVarint(bytes, i)
    if (!tag) {
      ignored.push('sp:(filter)')
      return
    }
    const field = tag[0] >> 3
    const wire = tag[0] & 7
    if (wire === 2) {
      // 長さ付きの未知サブメッセージは読み飛ばす
      const len = readVarint(bytes, tag[1])
      if (!len) {
        ignored.push('sp:(filter)')
        return
      }
      i = len[1] + len[0]
      ignored.push(`sp:field${field}`)
      continue
    }
    if (wire !== 0) {
      ignored.push(`sp:field${field}`)
      return
    }
    const v = readVarint(bytes, tag[1])
    if (!v) {
      ignored.push('sp:(filter)')
      return
    }
    const value = v[0]
    i = v[1]
    if (field === 1) {
      const days = UPLOAD_DAYS[value]
      if (days !== undefined) patch.since = daysAgoIso(days)
      else ignored.push(`sp:date${value}`)
    } else if (field === 2) {
      const rt = Object.entries(TYPE_BYTE).find(([, b]) => b === value)?.[0]
      if (rt) patch.resultType = rt as ResultType
      else ignored.push(`sp:type${value}`)
    } else if (field === 8) patch.liveOnly = true
    else ignored.push(`sp:field${field}`)
  }
}

// sp= 全体を読む(spParamの逆方向)。field1=並び順、field2=filterサブメッセージ。
// base64が壊れているときは sp を丸ごと ignored に残す
function parseSp(sp: string, patch: Partial<QueryState>, ignored: string[]): void {
  let bytes: number[]
  try {
    bytes = Array.from(atob(sp), (c) => c.charCodeAt(0))
  } catch {
    ignored.push(`sp=${sp}`)
    return
  }
  let i = 0
  while (i < bytes.length) {
    const tag = readVarint(bytes, i)
    if (!tag) {
      ignored.push(`sp=${sp}`)
      return
    }
    const field = tag[0] >> 3
    const wire = tag[0] & 7
    if (field === 1 && wire === 0) {
      const v = readVarint(bytes, tag[1])
      if (!v) {
        ignored.push(`sp=${sp}`)
        return
      }
      i = v[1]
      if (v[0] === SORT_BYTE.new) patch.sort = 'new'
      else if (v[0] === SORT_BYTE.top) patch.sort = 'top'
      else if (v[0] === 0) {
        // 関連度順(既定)。明示されていても「指定なし」と同じ
      } else ignored.push(`sp:sort${v[0]}`)
    } else if (field === 2 && wire === 2) {
      const len = readVarint(bytes, tag[1])
      if (!len) {
        ignored.push(`sp=${sp}`)
        return
      }
      parseSpFilter(bytes.slice(len[1], len[1] + len[0]), patch, ignored)
      i = len[1] + len[0]
    } else if (wire === 2) {
      const len = readVarint(bytes, tag[1])
      if (!len) {
        ignored.push(`sp=${sp}`)
        return
      }
      i = len[1] + len[0]
      ignored.push(`sp:field${field}`)
    } else if (wire === 0) {
      const v = readVarint(bytes, tag[1])
      if (!v) {
        ignored.push(`sp=${sp}`)
        return
      }
      i = v[1]
      ignored.push(`sp:field${field}`)
    } else {
      ignored.push(`sp=${sp}`)
      return
    }
  }
}

// 逆翻訳: /results?search_query=…(&sp=…) と /@handle/search?query=…(チャンネル内)。
// m.youtube.com などのサブドメインも受ける
function parseUrl(url: URL): ParsedSearch | null {
  if (!hostMatches(url, 'youtube.com')) return null
  const segs = pathSegments(url)
  const patch: Partial<QueryState> = {}
  const ignored: string[] = []

  if (segs.length === 2 && segs[0].startsWith('@') && segs[1] === 'search') {
    const q = url.searchParams.get('query')
    if (q === null) return null
    patch.fromUser = segs[0].slice(1)
    parseQueryTokens(q, patch, ignored)
    leftoverParams(url, new Set(['query']), ignored)
    return { patch, ignored }
  }

  if (segs[0] === 'results') {
    const q = url.searchParams.get('search_query')
    if (!q) return null
    parseQueryTokens(q, patch, ignored)
    const sp = url.searchParams.get('sp')
    if (sp) parseSp(sp, patch, ignored)
    leftoverParams(url, new Set(['search_query', 'sp']), ignored)
    return { patch, ignored }
  }
  return null
}

// ユーザー指定時はチャンネル内検索URL(/@handle/search)に切り替わり、sp= を送れない。
// このとき並び順・動画の長さ・探すものは実際には効かないので「使えない」に落とす
const CHANNEL_CONFLICT: ConceptSupport = {
  level: 'none',
  noteKey: 'note.youtube.channelConflict',
}
function dynamicSupport(state: QueryState): Partial<Record<ConceptId, ConceptSupport>> {
  const overrides: Partial<Record<ConceptId, ConceptSupport>> = {}
  if (state.fromUser.trim()) {
    overrides.sortOrder = CHANNEL_CONFLICT
    overrides.resultType = CHANNEL_CONFLICT
    overrides.liveOnly = CHANNEL_CONFLICT
  } else if (state.resultType && !(state.resultType in TYPE_BYTE)) {
    // 他サイト専用の値(プロフィール・シリーズ・ボード等)はYouTubeに無い
    overrides.resultType = { level: 'none', noteKey: 'note.resultType.otherSite' }
  }
  // intitle: はキーワード・完全一致の語にだけ付く。語が無い(タグだけの)検索では
  // 何も送られないので、「適用」に見せない(check:parts が検出した食い違い)
  if (state.titleOnly && andTerms(state).length === 0 && exactPhrases(state).length === 0) {
    overrides.titleOnly = { level: 'none', noteKey: 'note.titleOnly.needsWords' }
  }
  // コメント数順は他サイト専用。YouTubeでは指定できないので落とす(fromUser時の注記より優先)
  return { ...overrides, ...limitSort(state.sort, ['new', 'top'], 'note.sortOrder.otherSite') }
}

export const youtube: PlatformDef = {
  id: 'youtube',
  name: 'YouTube',
  group: 'video',
  brandColor: '#ff0033',
  requiresLogin: false,
  support: {
    keywords: { level: 'full' },
    exactPhrase: { level: 'partial', noteKey: 'note.youtube.exactPhrase' },
    keywordsOr: { level: 'full' },
    exclude: { level: 'partial', noteKey: 'note.youtube.exclude' },
    titleOnly: { level: 'partial' },
    fromUser: { level: 'partial', noteKey: 'note.youtube.fromUser' },
    hashtag: { level: 'partial', noteKey: 'note.youtube.hashtag' },
    period: { level: 'partial' },
    mediaOnly: { level: 'none', noteKey: 'note.youtube.mediaOnly' },
    liveOnly: { level: 'partial' },
    resultType: { level: 'partial', noteKey: 'note.youtube.resultType' },
    sortOrder: { level: 'partial', noteKey: 'note.youtube.sort' },
  },
  buildParts,
  parseUrl,
  dynamicSupport,
}
