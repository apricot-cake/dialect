import type { ConceptId, ConceptSupport, ParsedSearch, PlatformDef, QueryState, ResultType, UrlPart, VideoLength } from '../types'
import { limitSort } from '../types'
import { andTerms, exactPhrases, hasPositiveTerm, stripAt, stripHash, words } from '../text'
import { encodeTokens, lit, minusExcludeTokens, part, quotedTermTokens, tok, type Token } from '../urlParts'
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
} from '../parse'

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
// posts/communities/comments/media/people はReddit専用の値でYouTubeには無いため未収録
// (dynamicSupportでYouTube側は選択時にresultTypeをnoneへ落とす)
const TYPE_BYTE: Partial<Record<Exclude<ResultType, ''>, number>> = {
  video: 0x01,
  short: 0x09,
  channel: 0x02,
  playlist: 0x03,
}
const LENGTH_BYTE: Record<Exclude<VideoLength, ''>, number> = {
  short: 0x01,
  medium: 0x03,
  long: 0x02,
}

// sp= は1つのbase64に並び順・種類・長さ・特徴が合成される複合断片なので、
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
  if (state.videoLength) {
    filter.push(0x18, LENGTH_BYTE[state.videoLength])
    concepts.push('videoLength')
  }
  // 「特徴」の各項目はfilterサブメッセージの別フィールドとして合流する(2026-07-07に
  // フィルタUIから実測、field番号の昇順で並べる): 3D=field7(0x38)・HD=field4(0x20)・
  // 字幕=field5(0x28)・クリエイティブ・コモンズ=field6(0x30)・ライブ=field8(0x40)・
  // 購入済み=field9(0x48)・4K=field14(0x70)・360°=field15(0x78)・場所=field23(0xb8,0x01)・
  // HDR=field25(0xc8,0x01)・VR180=field26(0xd0,0x01)。field23以降は2バイトのvarintタグ
  // (fieldが16以上でタグが128を超えるため)。いずれも組み合わせ可能(2026-07-08に
  // 360°/VR180/3D/HDR/場所は実際に絞り込みが効くことをブラウザ実測、購入済みは
  // このアカウントに購入履歴が無く未検証だがバイト値自体はUIから採取)
  if (state.hdOnly) {
    filter.push(0x20, 0x01)
    concepts.push('hdOnly')
  }
  if (state.captionsOnly) {
    filter.push(0x28, 0x01)
    concepts.push('captionsOnly')
  }
  if (state.creativeCommons) {
    filter.push(0x30, 0x01)
    concepts.push('creativeCommons')
  }
  if (state.threeD) {
    filter.push(0x38, 0x01)
    concepts.push('threeD')
  }
  if (state.liveOnly) {
    filter.push(0x40, 0x01)
    concepts.push('liveOnly')
  }
  if (state.purchased) {
    filter.push(0x48, 0x01)
    concepts.push('purchased')
  }
  if (state.fourK) {
    filter.push(0x70, 0x01)
    concepts.push('fourK')
  }
  if (state.threeSixty) {
    filter.push(0x78, 0x01)
    concepts.push('threeSixty')
  }
  if (state.locationOnly) {
    filter.push(0xb8, 0x01, 0x01)
    concepts.push('locationOnly')
  }
  if (state.hdr) {
    filter.push(0xc8, 0x01, 0x01)
    concepts.push('hdr')
  }
  if (state.vr180) {
    filter.push(0xd0, 0x01, 0x01)
    concepts.push('vr180')
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
      const parts = token.split('|').map((s) => s.trim()).filter(Boolean)
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
    } else if (field === 3) {
      const vl = Object.entries(LENGTH_BYTE).find(([, b]) => b === value)?.[0]
      if (vl) patch.videoLength = vl as VideoLength
      else ignored.push(`sp:duration${value}`)
    } else if (field === 4) patch.hdOnly = true
    else if (field === 5) patch.captionsOnly = true
    else if (field === 6) patch.creativeCommons = true
    else if (field === 7) patch.threeD = true
    else if (field === 8) patch.liveOnly = true
    else if (field === 9) patch.purchased = true
    else if (field === 14) patch.fourK = true
    else if (field === 15) patch.threeSixty = true
    else if (field === 23) patch.locationOnly = true
    else if (field === 25) patch.hdr = true
    else if (field === 26) patch.vr180 = true
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
function dynamicSupport(
  state: QueryState,
): Partial<Record<ConceptId, ConceptSupport>> {
  const overrides: Partial<Record<ConceptId, ConceptSupport>> = {}
  if (state.fromUser.trim()) {
    overrides.sortOrder = CHANNEL_CONFLICT
    overrides.videoLength = CHANNEL_CONFLICT
    overrides.resultType = CHANNEL_CONFLICT
    overrides.liveOnly = CHANNEL_CONFLICT
    overrides.fourK = CHANNEL_CONFLICT
    overrides.hdOnly = CHANNEL_CONFLICT
    overrides.captionsOnly = CHANNEL_CONFLICT
    overrides.creativeCommons = CHANNEL_CONFLICT
    overrides.threeSixty = CHANNEL_CONFLICT
    overrides.vr180 = CHANNEL_CONFLICT
    overrides.threeD = CHANNEL_CONFLICT
    overrides.hdr = CHANNEL_CONFLICT
    overrides.locationOnly = CHANNEL_CONFLICT
    overrides.purchased = CHANNEL_CONFLICT
  } else if (state.resultType && !(state.resultType in TYPE_BYTE)) {
    // Reddit専用の値(投稿・コミュニティ・コメント・メディア・プロフィール)はYouTubeに無い
    overrides.resultType = { level: 'none', noteKey: 'note.resultType.otherSite' }
  }
  // intitle: はキーワード・完全一致の語にだけ付く。語が無い(タグだけの)検索では
  // 何も送られないので、「適用」に見せない(check:parts が検出した食い違い)
  if (state.titleOnly && andTerms(state).length === 0 && exactPhrases(state).length === 0) {
    overrides.titleOnly = { level: 'none', noteKey: 'note.titleOnly.needsWords' }
  }
  // 急上昇・コメント数順はnote/Reddit専用。YouTubeでは指定できないので落とす(fromUser時の注記より優先)
  return { ...overrides, ...limitSort(state.sort, ['new', 'top'], 'note.sortOrder.otherSite') }
}

export const youtube: PlatformDef = {
  id: 'youtube',
  name: 'YouTube',
  group: 'video',
  brandColor: '#ff0033',
  requiresLogin: false,
  googleSite: 'youtube.com',
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
    videoLength: { level: 'partial' },
    liveOnly: { level: 'partial' },
    fourK: { level: 'full' },
    hdOnly: { level: 'full' },
    captionsOnly: { level: 'full' },
    creativeCommons: { level: 'full' },
    threeSixty: { level: 'full' },
    vr180: { level: 'full' },
    threeD: { level: 'full' },
    hdr: { level: 'full' },
    locationOnly: { level: 'full' },
    purchased: { level: 'full' },
    resultType: { level: 'partial', noteKey: 'note.youtube.resultType' },
    sortOrder: { level: 'partial', noteKey: 'note.youtube.sort' },
  },
  buildParts,
  parseUrl,
  dynamicSupport,
}
