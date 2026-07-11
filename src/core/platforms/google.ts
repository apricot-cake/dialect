import type {
  ConceptId,
  ConceptSupport,
  GoogleFileType,
  GoogleLicense,
  ParsedSearch,
  PlatformDef,
  PostLanguage,
  QueryState,
  ResultType,
  UrlPart,
} from '../types'
import { GOOGLE_FILE_TYPES, POST_LANGUAGE_CODES } from '../types'
import { andTerms, exactPhrases, stripQuerySyntax, words } from '../text'
import {
  encodeTokens,
  lit,
  minusExcludeTokens,
  ParamParts,
  quotedTermTokens,
  tok,
  type Token,
} from '../urlParts'
import { daysAgoIso, emptyBins, applyBins, leftoverParams, pathSegments, tokenize, unquote } from '../parse'

// 出典: 2026-07-11にGUI操作で実測(issue #33)。詳細検索フォーム(google.com/advanced_search)を
// 実際に操作しadvanced formがサーバー側でq=内の演算子(引用符・-・site:・filetype:)へ
// 変換すること、ツールメニュー(期間プリセット・カスタム期間・完全一致)の生成URLを直接確認した。
// 詳細は docs/operator-checklist.md の Google 節を参照。未ログインで全機能に到達できたため
// requiresLogin: false と判定(検索・詳細検索フォーム・ツールメニュー・結果タブいずれも
// ログインリンクが出たまま操作できた)。

const RESULT_TYPE_UDM: Partial<Record<ResultType, string>> = {
  images: '2',
  video: '7',
  shopping: '28',
  short: '39',
  web: 'web',
  books: '36',
}
const UDM_RESULT_TYPE: Record<string, ResultType> = Object.fromEntries(
  Object.entries(RESULT_TYPE_UDM).map(([rt, udm]) => [udm, rt as ResultType]),
)
const GOOGLE_RESULT_TYPES = new Set<ResultType>(['images', 'shopping', 'short', 'video', 'web', 'books', 'news'])

// ツールメニューの期間プリセット(tbs=qdr:h/d/w/m/y)。自前生成では使わないが、
// Google自身のツールメニューが生成したURLの貼り付け読み込み(逆翻訳)に備えて受ける
const QDR_DAYS: Record<string, number> = { h: 0, d: 1, w: 7, m: 30, y: 365 }

// カスタム期間(tbs=cdr:1,cd_min:M/D/YYYY,cd_max:M/D/YYYY)。ISO(YYYY-MM-DD)との相互変換。
// 2026-07-11にツールメニュー「期間を指定」をGUI操作で実測(先頭ゼロなしのM/D/YYYY形式)
function toGoogleDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${m}/${d}/${y}`
}

function fromGoogleDate(s: string): string | null {
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return null
  const [, mo, da, yr] = m
  return `${yr}-${mo.padStart(2, '0')}-${da.padStart(2, '0')}`
}

function isGoogleHost(url: URL): boolean {
  const host = url.hostname.toLowerCase().replace(/^www\./, '')
  return /^google\.[a-z.]+$/.test(host)
}

function buildParts(state: QueryState): UrlPart[] | null {
  const orWords = words(state.keywordsOr)
  // hasPositiveTerm(hashtag/fromUser込み)は使わない。Googleはこの2概念を持たないため、
  // ハッシュタグだけ入力された状態でも「検索が成立する」と誤判定し、空のq=を生む取りこぼしになる
  const hasQuery =
    andTerms(state).length > 0 ||
    exactPhrases(state).length > 0 ||
    state.domain.trim() !== '' ||
    state.fileType !== '' ||
    orWords.length > 0
  if (!hasQuery) return null

  const toks: Token[] = []
  // allintitle: はそれ以降の語すべてをタイトル一致に切り替える単一トークン(詳細検索フォームには
  // 相当欄が無いため公式ヘルプの演算子表[doc]。2026-07-11にURL叩きで実結果を確認したところ、
  // タイトルに一致しない結果も混ざる(近年の緩和挙動)ため partial 扱いにする
  if (state.titleOnly && (andTerms(state).length > 0 || exactPhrases(state).length > 0)) {
    toks.push(tok('allintitle:', 'titleOnly'))
  }
  toks.push(...quotedTermTokens(state))
  if (orWords.length >= 2) toks.push(tok(`(${orWords.join(' OR ')})`, 'keywordsOr'))
  else toks.push(...orWords.map((w) => tok(w, 'keywordsOr')))
  toks.push(...minusExcludeTokens(state))
  if (state.domain.trim()) toks.push(tok(`site:${stripQuerySyntax(state.domain.trim())}`, 'domain'))
  if (state.fileType) toks.push(tok(`filetype:${state.fileType}`, 'fileType'))

  const params = new ParamParts()
  if (state.language) {
    // Googleのlrに汎用「中国語」は無く簡体/繁体の指定のみ。簡体(zh-CN)へ近似する
    const lr = state.language === 'zh' ? 'lang_zh-CN' : `lang_${state.language}`
    params.set('lr', lr, 'language')
  }
  if (state.region.trim()) params.set('cr', `country${state.region.trim().toUpperCase()}`, 'region')
  if (state.safeSearchOff) params.set('safe', 'off', 'safeSearchOff')

  // tbs= はカンマ区切りで複数機能を1つの値に合成する(YouTubeのsp=と同様の複合パラメータ)。
  // 期間・完全一致・ライセンスを同時指定したときの組み合わせ効果はGUI操作で確証を得られて
  // いない(ツールメニュー自体が単一選択のUIのため。docs/operator-checklist.md参照)
  const tbsConcepts: ConceptId[] = []
  const tbsParts: string[] = []
  if (state.since || state.until) {
    tbsConcepts.push('period')
    tbsParts.push('cdr:1')
    if (state.since) tbsParts.push(`cd_min:${toGoogleDate(state.since)}`)
    if (state.until) tbsParts.push(`cd_max:${toGoogleDate(state.until)}`)
  }
  if (state.exactMatchMode) {
    tbsConcepts.push('exactMatchMode')
    tbsParts.push('li:1')
  }
  if (state.license) {
    tbsConcepts.push('license')
    tbsParts.push(`sur:${state.license}`)
  }
  if (tbsParts.length > 0) params.set('tbs', tbsParts.join(','), ...tbsConcepts)

  if (state.resultType === 'news') params.set('tbm', 'nws', 'resultType')
  else if (state.resultType) {
    const udm = RESULT_TYPE_UDM[state.resultType]
    if (udm) params.set('udm', udm, 'resultType')
  }

  return [lit('https://www.google.com/search?q='), ...encodeTokens(toks), ...params.parts('&')]
}

// 逆翻訳: google.{tld}/search?q=…(google.co.jp等のTLD違いも受ける)。
// q内の演算子(allintitle:/intitle:/"…"/-語/site:/filetype:/(a OR b))と、
// lr=/cr=/safe=/tbs=/tbm=/udm= を読む。読めないものは ignored へ
function parseUrl(url: URL): ParsedSearch | null {
  if (!isGoogleHost(url)) return null
  if (pathSegments(url)[0] !== 'search') return null
  const q = url.searchParams.get('q')
  if (!q) return null

  const patch: Partial<QueryState> = {}
  const ignored: string[] = []
  const bins = emptyBins()
  const orTerms: string[] = []
  let titleOnly = false

  for (const token of tokenize(q)) {
    if (token === 'allintitle:') titleOnly = true
    else if (token.startsWith('site:')) patch.domain = token.slice('site:'.length)
    else if (token.startsWith('filetype:')) {
      const v = token.slice('filetype:'.length)
      if ((GOOGLE_FILE_TYPES as readonly string[]).includes(v)) patch.fileType = v as GoogleFileType
      else ignored.push(token)
    } else if (token.startsWith('intitle:')) {
      titleOnly = true
      const rest = token.slice('intitle:'.length)
      if (rest.startsWith('"')) bins.phrases.push(unquote(rest))
      else if (rest) bins.terms.push(rest)
    } else if (token.startsWith('(') && token.endsWith(')')) {
      const inner = token
        .slice(1, -1)
        .split(/\s+OR\s+/i)
        .map((s) => s.trim())
        .filter(Boolean)
      if (inner.length >= 2 && inner.every((p) => !p.includes(':'))) orTerms.push(...inner)
      else ignored.push(token)
    } else if (token.startsWith('"')) bins.phrases.push(unquote(token))
    else if (token.startsWith('-') && token.length > 1) bins.excludes.push(token.slice(1))
    else bins.terms.push(token)
  }
  applyBins(patch, bins)
  if (orTerms.length > 0) patch.keywordsOr = orTerms.join(' ')
  if (titleOnly) patch.titleOnly = true

  const lr = url.searchParams.get('lr')
  if (lr !== null) {
    const code = lr.replace(/^lang_/, '')
    if ((POST_LANGUAGE_CODES as readonly string[]).includes(code)) patch.language = code as PostLanguage
    else if (code === 'zh-CN' || code === 'zh-TW') patch.language = 'zh'
    else ignored.push(`lr=${lr}`)
  }
  const cr = url.searchParams.get('cr')
  if (cr !== null) {
    const m = cr.match(/^country([A-Za-z]{2})$/)
    if (m) patch.region = m[1].toUpperCase()
    else ignored.push(`cr=${cr}`)
  }
  const safe = url.searchParams.get('safe')
  if (safe === 'off') patch.safeSearchOff = true
  else if (safe !== null && safe !== 'active') ignored.push(`safe=${safe}`)

  const tbs = url.searchParams.get('tbs')
  if (tbs !== null) {
    for (const sub of tbs.split(',')) {
      if (sub === 'li:1') patch.exactMatchMode = true
      else if (sub === 'cdr:1') {
        // カスタム期間の枠マーカーのみ。cd_min/cd_maxが実体を持つ
      } else if (sub.startsWith('sur:')) {
        const v = sub.slice('sur:'.length)
        if (v === 'f' || v === 'fc' || v === 'fm' || v === 'fmc') patch.license = v as GoogleLicense
        else ignored.push(`tbs=${sub}`)
      } else if (sub.startsWith('cd_min:')) {
        const iso = fromGoogleDate(sub.slice('cd_min:'.length))
        if (iso) patch.since = iso
        else ignored.push(`tbs=${sub}`)
      } else if (sub.startsWith('cd_max:')) {
        const iso = fromGoogleDate(sub.slice('cd_max:'.length))
        if (iso) patch.until = iso
        else ignored.push(`tbs=${sub}`)
      } else if (sub.startsWith('qdr:')) {
        const days = QDR_DAYS[sub.slice('qdr:'.length)]
        if (days !== undefined) patch.since = daysAgoIso(days)
        else ignored.push(`tbs=${sub}`)
      } else if (sub) ignored.push(`tbs=${sub}`)
    }
  }

  const tbm = url.searchParams.get('tbm')
  const udm = url.searchParams.get('udm')
  if (tbm === 'nws') patch.resultType = 'news'
  else if (tbm !== null) ignored.push(`tbm=${tbm}`)
  else if (udm !== null) {
    const rt = UDM_RESULT_TYPE[udm]
    if (rt) patch.resultType = rt
    else ignored.push(`udm=${udm}`)
  }

  leftoverParams(url, new Set(['q', 'lr', 'cr', 'safe', 'tbs', 'tbm', 'udm']), ignored)
  return { patch, ignored }
}

function dynamicSupport(state: QueryState): Partial<Record<ConceptId, ConceptSupport>> {
  const overrides: Partial<Record<ConceptId, ConceptSupport>> = {}
  if (state.language === 'zh') {
    overrides.language = { level: 'partial', noteKey: 'note.google.zhApprox' }
  }
  if (state.resultType && !GOOGLE_RESULT_TYPES.has(state.resultType)) {
    overrides.resultType = { level: 'none', noteKey: 'note.resultType.otherSite' }
  }
  // allintitle: はキーワード・完全一致の語にしか付かない(1トークンで先頭に置く形のため)。
  // 語が無い(サイト指定やファイル形式だけの)検索では送られないので「適用」に見せない
  if (state.titleOnly && andTerms(state).length === 0 && exactPhrases(state).length === 0) {
    overrides.titleOnly = { level: 'none', noteKey: 'note.titleOnly.needsWords' }
  }
  return overrides
}

export const google: PlatformDef = {
  id: 'google',
  name: 'Google',
  group: 'web',
  brandColor: '#4285F4',
  requiresLogin: false,
  support: {
    keywords: { level: 'full' },
    exactPhrase: { level: 'full' },
    keywordsOr: { level: 'full' },
    exclude: { level: 'full' },
    titleOnly: { level: 'partial', noteKey: 'note.google.titleOnly' },
    domain: { level: 'full' },
    fileType: { level: 'full' },
    region: { level: 'full' },
    license: { level: 'full' },
    exactMatchMode: { level: 'full' },
    period: { level: 'full' },
    language: { level: 'full' },
    safeSearchOff: { level: 'full' },
    resultType: { level: 'full' },
  },
  buildParts,
  parseUrl,
  dynamicSupport,
}
