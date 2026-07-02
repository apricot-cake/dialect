import type { PlatformDef, QueryState, VideoLength } from '../types'
import { andTermWords, hasOrTerms, hasPositiveTerm, orTermGroups, stripAt, stripHash, words } from '../text'

// 出典: docs/operator-research.md
// search_query は検索ボックスと等価。before:/after: は非公式だが実機確認済み(2026-07-02)。
// sp= はprotobufのbase64。ソートと動画の長さは1つのspに合成する(連結は不可)。
// 合成値はktsk.xyzのフィールド定義から計算:
//   sort: 0x08 0x02(アップロード日順) / 0x08 0x03(視聴回数順=人気の近似)
//   filter{duration}: 0x12 0x02 0x18 0x0N (N=1:短,3:中,2:長)
// ユーザー指定はチャンネル内検索ページ(/@handle/search)への切り替えで近似する。
const SP_SORT: Record<'new' | 'top', string> = {
  new: 'CAI%3D',
  top: 'CAM%3D',
}
const SP_LENGTH: Record<Exclude<VideoLength, ''>, string> = {
  short: 'EgIYAQ%3D%3D',
  medium: 'EgIYAw%3D%3D',
  long: 'EgIYAg%3D%3D',
}
const SP_SORT_AND_LENGTH: Record<'new' | 'top', Record<Exclude<VideoLength, ''>, string>> = {
  new: { short: 'CAISAhgB', medium: 'CAISAhgD', long: 'CAISAhgC' },
  top: { short: 'CAMSAhgB', medium: 'CAMSAhgD', long: 'CAMSAhgC' },
}

function buildUrl(state: QueryState): string | null {
  if (!hasPositiveTerm(state) && !hasOrTerms(state)) return null

  const parts: string[] = []
  parts.push(...andTermWords(state))
  // 「どれかを含む」行は括弧+|で結び、他の語とはスペース(AND)で並置する
  for (const group of orTermGroups(state)) {
    parts.push(`(${group.join(' | ')})`)
  }
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

  const sort = state.sort === 'auto' ? null : state.sort
  let sp = ''
  if (state.videoLength && sort) {
    sp = `&sp=${SP_SORT_AND_LENGTH[sort][state.videoLength]}`
  } else if (state.videoLength) {
    sp = `&sp=${SP_LENGTH[state.videoLength]}`
  } else if (sort) {
    sp = `&sp=${SP_SORT[sort]}`
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
    sortOrder: { level: 'partial', noteKey: 'note.youtube.sort' },
  },
  buildUrl,
}
