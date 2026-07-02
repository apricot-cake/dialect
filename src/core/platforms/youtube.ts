import type { PlatformDef, QueryState, VideoLength } from '../types'
import { hasPositiveTerm, stripAt, stripHash, words } from '../text'

// 出典: docs/operator-research.md
// search_query は検索ボックスと等価。before:/after: は非公式だが実機確認済み(2026-07-02)。
// sp= はprotobufのbase64。ソート(アップロード日順)と動画の長さは1つのspに合成する
// (連結は不可)。合成値はktsk.xyzのフィールド定義から計算:
//   sort=date: 0x08 0x02 / filter{duration}: 0x12 0x02 0x18 0x0N (N=1:短,3:中,2:長)
// ユーザー指定はチャンネル内検索ページ(/@handle/search)への切り替えで近似する。
const SP_SORT_NEW = 'CAI%3D'
const SP_LENGTH: Record<Exclude<VideoLength, ''>, string> = {
  short: 'EgIYAQ%3D%3D',
  medium: 'EgIYAw%3D%3D',
  long: 'EgIYAg%3D%3D',
}
const SP_SORT_AND_LENGTH: Record<Exclude<VideoLength, ''>, string> = {
  short: 'CAISAhgB',
  medium: 'CAISAhgD',
  long: 'CAISAhgC',
}

function buildUrl(state: QueryState): string | null {
  if (!hasPositiveTerm(state)) return null

  const parts: string[] = []
  parts.push(...words(state.keywords))
  const orWords = words(state.orAny)
  if (orWords.length > 0) parts.push(`(${orWords.join(' | ')})`)
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
  if (state.hashtag.trim()) parts.push(`#${stripHash(state.hashtag)}`)
  if (state.since) parts.push(`after:${state.since}`)
  if (state.until) parts.push(`before:${state.until}`)
  const query = parts.join(' ')

  const handle = stripAt(state.fromUser)
  if (handle) {
    // チャンネル内検索。sp(並び順・長さ)は適用できない
    return `https://www.youtube.com/@${encodeURIComponent(handle)}/search?query=${encodeURIComponent(query)}`
  }

  let sp = ''
  if (state.videoLength && state.newestFirst) {
    sp = `&sp=${SP_SORT_AND_LENGTH[state.videoLength]}`
  } else if (state.videoLength) {
    sp = `&sp=${SP_LENGTH[state.videoLength]}`
  } else if (state.newestFirst) {
    sp = `&sp=${SP_SORT_NEW}`
  }
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}${sp}`
}

export const youtube: PlatformDef = {
  id: 'youtube',
  name: 'YouTube',
  group: 'video',
  brandColor: '#ff0033',
  requiresLogin: false,
  support: {
    keywords: { level: 'full' },
    orAny: { level: 'full' },
    exactPhrase: { level: 'partial', noteKey: 'note.youtube.exactPhrase' },
    exclude: { level: 'partial', noteKey: 'note.youtube.exclude' },
    titleOnly: { level: 'partial', noteKey: 'note.unofficial' },
    fromUser: { level: 'partial', noteKey: 'note.youtube.fromUser' },
    hashtag: { level: 'partial', noteKey: 'note.youtube.hashtag' },
    period: { level: 'partial', noteKey: 'note.youtube.period' },
    mediaOnly: { level: 'none', noteKey: 'note.youtube.mediaOnly' },
    videoLength: { level: 'partial', noteKey: 'note.unofficial' },
    japaneseOnly: { level: 'none', noteKey: 'note.youtube.japaneseOnly' },
    newestFirst: { level: 'partial', noteKey: 'note.youtube.newestFirst' },
  },
  buildUrl,
}
