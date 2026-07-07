import type { ConceptId, ConceptSupport, PlatformDef, QueryState, ResultType, VideoLength } from '../types'
import { limitSort } from '../types'
import { hasPositiveTerm, minusExcludes, quotedTerms, stripAt, stripHash, words } from '../text'

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

function spParam(state: QueryState): string {
  // spで表せるのは新着/視聴回数(=人気)順のみ。hot等はYouTubeにないので送らない
  const sort = state.sort === 'new' || state.sort === 'top' ? state.sort : null
  const filter: number[] = []
  const typeByte = state.resultType ? TYPE_BYTE[state.resultType] : undefined
  if (typeByte !== undefined) filter.push(0x10, typeByte)
  if (state.videoLength) filter.push(0x18, LENGTH_BYTE[state.videoLength])
  // 「特徴」の各項目はfilterサブメッセージの別フィールドとして合流する(2026-07-07に
  // フィルタUIから実測、field番号の昇順で並べる): 3D=field7(0x38)・HD=field4(0x20)・
  // 字幕=field5(0x28)・クリエイティブ・コモンズ=field6(0x30)・ライブ=field8(0x40)・
  // 購入済み=field9(0x48)・4K=field14(0x70)・360°=field15(0x78)・場所=field23(0xb8,0x01)・
  // HDR=field25(0xc8,0x01)・VR180=field26(0xd0,0x01)。field23以降は2バイトのvarintタグ
  // (fieldが16以上でタグが128を超えるため)。いずれも組み合わせ可能(2026-07-08に
  // 360°/VR180/3D/HDR/場所は実際に絞り込みが効くことをブラウザ実測、購入済みは
  // このアカウントに購入履歴が無く未検証だがバイト値自体はUIから採取)
  if (state.hdOnly) filter.push(0x20, 0x01)
  if (state.captionsOnly) filter.push(0x28, 0x01)
  if (state.creativeCommons) filter.push(0x30, 0x01)
  if (state.threeD) filter.push(0x38, 0x01)
  if (state.liveOnly) filter.push(0x40, 0x01)
  if (state.purchased) filter.push(0x48, 0x01)
  if (state.fourK) filter.push(0x70, 0x01)
  if (state.threeSixty) filter.push(0x78, 0x01)
  if (state.locationOnly) filter.push(0xb8, 0x01, 0x01)
  if (state.hdr) filter.push(0xc8, 0x01, 0x01)
  if (state.vr180) filter.push(0xd0, 0x01, 0x01)
  const bytes: number[] = []
  if (sort) bytes.push(0x08, SORT_BYTE[sort])
  if (filter.length > 0) bytes.push(0x12, filter.length, ...filter)
  if (bytes.length === 0) return ''
  return `&sp=${encodeURIComponent(btoa(String.fromCharCode(...bytes)))}`
}

function buildUrl(state: QueryState): string | null {
  if (!hasPositiveTerm(state)) return null

  const parts: string[] = []
  parts.push(...quotedTerms(state))
  parts.push(...minusExcludes(state))
  if (state.titleOnly) {
    // intitle: は語ごとに付ける(非公式)
    for (let i = 0; i < parts.length; i++) {
      if (!parts[i].startsWith('-') && !parts[i].startsWith('(')) {
        parts[i] = `intitle:${parts[i]}`
      }
    }
  }
  parts.push(...words(state.hashtag).map((t) => `#${stripHash(t)}`))
  if (state.since) parts.push(`after:${state.since}`)
  if (state.until) parts.push(`before:${state.until}`)
  const query = parts.join(' ')

  const handle = stripAt(state.fromUser)
  if (handle) {
    // チャンネル内検索。sp(並び順・長さ)は適用できない
    return `https://www.youtube.com/@${encodeURIComponent(handle)}/search?query=${encodeURIComponent(query)}`
  }

  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}${spParam(state)}`
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
  buildUrl,
  dynamicSupport,
}
