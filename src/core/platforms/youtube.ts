import type { PlatformDef, QueryState, VideoLength } from '../types'
import { andTerms, hasPositiveTerm, quoteIfPhrase, stripAt, stripHash, words } from '../text'

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
const TYPE_BYTE: Record<'video' | 'channel', number> = { video: 0x01, channel: 0x02 }
const LENGTH_BYTE: Record<Exclude<VideoLength, ''>, number> = {
  short: 0x01,
  medium: 0x03,
  long: 0x02,
}

function spParam(state: QueryState): string {
  const sort = state.sort === 'auto' ? null : state.sort
  const filter: number[] = []
  if (state.resultType) filter.push(0x10, TYPE_BYTE[state.resultType])
  if (state.videoLength) filter.push(0x18, LENGTH_BYTE[state.videoLength])
  const bytes: number[] = []
  if (sort) bytes.push(0x08, SORT_BYTE[sort])
  if (filter.length > 0) bytes.push(0x12, filter.length, ...filter)
  if (bytes.length === 0) return ''
  return `&sp=${encodeURIComponent(btoa(String.fromCharCode(...bytes)))}`
}

function buildUrl(state: QueryState): string | null {
  if (!hasPositiveTerm(state)) return null

  const parts: string[] = []
  parts.push(...andTerms(state).map(quoteIfPhrase))
  if (state.exactPhrase.trim()) parts.push(`"${state.exactPhrase.trim()}"`)
  parts.push(...words(state.exclude).map((w) => `-${w}`))
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
    titleOnly: { level: 'partial', noteKey: 'note.unofficial' },
    fromUser: { level: 'partial', noteKey: 'note.youtube.fromUser' },
    hashtag: { level: 'partial', noteKey: 'note.youtube.hashtag' },
    period: { level: 'partial', noteKey: 'note.youtube.period' },
    mediaOnly: { level: 'none', noteKey: 'note.youtube.mediaOnly' },
    videoLength: { level: 'partial', noteKey: 'note.unofficial' },
    resultType: { level: 'partial', noteKey: 'note.youtube.resultType' },
    japaneseOnly: { level: 'none', noteKey: 'note.youtube.japaneseOnly' },
    sortOrder: { level: 'partial', noteKey: 'note.youtube.sort' },
  },
  buildUrl,
}
