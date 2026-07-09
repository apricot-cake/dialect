import type { PlatformDef, QueryState } from '../types'
import { limitSort } from '../types'
import { andTerms, exactPhrases, stripAt, stripHash, words } from '../text'

// 出典: docs/operator-research.md
// 演算子は from:@noteID のみ(公式機能)。除外・完全一致・期間は非対応。
// ハッシュタグ単独ならタグページ(厳密一致)、他条件と併用時はキーワードとして検索。
// new=新着、top=人気(既定)、hot=急上昇。指定なし(auto)は何も送らない。全て実測で動作
const SORT_PARAM: Partial<Record<QueryState['sort'], string>> = {
  new: 'new',
  top: 'popular',
  hot: 'hot',
}

/**
 * 単一タグのみ(ことば・送信者なし)のとき /hashtag/{タグ} のタグページへ行くか。
 * タグページには並び順・有料などの検索フィルタが無いので、その概念を落とす判定に使う
 */
function isTagPath(state: QueryState): boolean {
  const textCount = andTerms(state).length + exactPhrases(state).length
  const tagNames = words(state.hashtag).map(stripHash)
  return tagNames.length === 1 && !stripAt(state.fromUser) && textCount === 0
}

function buildUrl(state: QueryState): string | null {
  const handle = stripAt(state.fromUser)
  // 完全一致・引用符は効かないため、語句をそのままキーワードとして扱う(近似)
  const textParts = [...andTerms(state)]
  textParts.push(...exactPhrases(state))
  const tagNames = words(state.hashtag).map(stripHash)

  if (isTagPath(state)) {
    return `https://note.com/hashtag/${encodeURIComponent(tagNames[0])}`
  }

  const parts = [...textParts, ...tagNames]
  if (handle) parts.push(`from:@${handle}`)
  if (parts.length === 0) return null

  const sortVal = SORT_PARAM[state.sort]
  const sort = sortVal ? `&sort=${sortVal}` : ''
  // 有料のみ(paidOnly)は context を note_for_sale に切り替えて表現(2026-07-09 GUI採取)
  const context = state.paidOnly ? 'note_for_sale' : 'note'
  return `https://note.com/search?context=${context}&q=${encodeURIComponent(parts.join(' '))}${sort}`
}

export const note: PlatformDef = {
  id: 'note',
  name: 'note',
  group: 'text',
  brandColor: '#13b5b1',
  requiresLogin: false,
  googleSite: 'note.com',
  support: {
    keywords: { level: 'partial', noteKey: 'note.note.keywords' },
    exactPhrase: { level: 'partial', noteKey: 'note.note.exactPhrase' },
    exclude: { level: 'none', noteKey: 'note.note.exclude' },
    fromUser: { level: 'full', noteKey: 'note.note.fromUser' },
    hashtag: { level: 'full', noteKey: 'note.note.hashtag' },
    period: { level: 'none', noteKey: 'note.note.period' },
    mediaOnly: { level: 'none', noteKey: 'note.note.mediaOnly' },
    sortOrder: { level: 'full' },
    paidOnly: { level: 'full' },
  },
  buildUrl,
  dynamicSupport: (state) => ({
    // note に無い並び順(コメント数順など)を選んだとき「適用」に見せない
    ...limitSort(state.sort, ['new', 'top', 'hot'], 'note.sortOrder.otherSite'),
    // 単一タグのタグページには有料フィルタが無い。そのときは paidOnly を落とす
    ...(state.paidOnly && isTagPath(state)
      ? { paidOnly: { level: 'none', noteKey: 'note.note.paidOnly.tagPage' } }
      : {}),
  }),
}
