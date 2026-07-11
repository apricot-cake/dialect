import type { ConceptId, QueryState } from './types'
import { normalizeForSearch } from './searchNormalize'
import { parsePeriodWord } from './smartInput'

/**
 * "Did you mean" suggestions over the smart input (issue #17): map nouns in
 * the keyword tokens (動画, バズった, 先週, ...) to condition candidates.
 * Semantic leaps are never auto-applied — each match becomes a tappable chip
 * and the user decides. Matches inside a longer token (「猫の動画」) also
 * report the remainder (「猫」) so adopting can peel just the matched part
 */

export interface SmartSuggestion {
  /** The keyword token the match came from, as typed */
  source: string
  /** Source with the matched word peeled off (empty = whole token matched) */
  remainder: string
  concept: ConceptId
  /** What adopting applies. Single-value overwrite, same as smart-input merge */
  patch: Partial<QueryState>
  /** Dedup/display key, e.g. "resultType:video" or "minLikes:10000" */
  key: string
}

interface VocabEntry {
  /** Natural ja/en words, matched after normalizeForSearch */
  words: string[]
  concept: ConceptId
  key: string
  patch: Partial<QueryState>
}

/**
 * Hand-curated word → condition-value table. Values must exist in
 * SELECT_OPTIONS / QueryState; the words follow conceptTags' "intent
 * satisfaction" bar (would someone typing this be happy with the condition?).
 * バズった→10000 likes mirrors the issue's canonical example
 */
const VOCAB: VocabEntry[] = [
  {
    words: ['動画', 'ビデオ', 'video', 'videos'],
    concept: 'resultType',
    key: 'resultType:video',
    patch: { resultType: 'video' },
  },
  {
    words: ['ショート', 'shorts'],
    concept: 'resultType',
    key: 'resultType:short',
    patch: { resultType: 'short' },
  },
  {
    words: ['イラスト', 'illustration', 'illust'],
    concept: 'workType',
    key: 'workType:illust',
    patch: { workType: 'illust' },
  },
  {
    words: ['漫画', 'マンガ', 'まんが', 'manga'],
    concept: 'workType',
    key: 'workType:manga',
    patch: { workType: 'manga' },
  },
  {
    words: ['うごイラ', 'ugoira'],
    concept: 'workType',
    key: 'workType:ugoira',
    patch: { workType: 'ugoira' },
  },
  {
    words: ['小説', 'novel', 'novels'],
    concept: 'workType',
    key: 'workType:novel',
    patch: { workType: 'novel' },
  },
  {
    words: ['ライブ', '生放送', '生配信', '配信中', 'ライブ配信', 'live'],
    concept: 'liveOnly',
    key: 'liveOnly',
    patch: { liveOnly: true },
  },
  {
    words: ['画像', '写真', 'メディア', 'image', 'images', 'photo', 'photos', 'picture', 'media'],
    concept: 'mediaOnly',
    key: 'mediaOnly',
    patch: { mediaOnly: true },
  },
  {
    words: ['バズった', 'バズってる', 'バズっている', 'バズ', 'viral', 'buzz'],
    concept: 'minLikes',
    key: 'minLikes:10000',
    patch: { minLikes: '10000' },
  },
  {
    words: ['人気', '話題', '注目', 'popular', 'trending'],
    concept: 'sortOrder',
    key: 'sortOrder:top',
    patch: { sort: 'top' },
  },
  {
    words: ['最新', '新着', '新しい順', 'newest', 'latest'],
    concept: 'sortOrder',
    key: 'sortOrder:new',
    patch: { sort: 'new' },
  },
]

/** Period words double as suggestions when buried inside a longer token */
const PERIOD_WORDS = ['今日', '昨日', '今週', '先週', '今月', '先月', '今年', '去年', '昨年']

/** Particles/glue that may sit at the cut edge after peeling the match */
const EDGE_GLUE = /^(?:の|な|だけ|のみ|で|に|を|は|が)+|(?:の|な|だけ|のみ|で|に|を|は|が)+$/g

function peel(source: string, word: string): string | null {
  const idx = source.indexOf(word)
  if (idx < 0) return null
  const rest = (source.slice(0, idx) + source.slice(idx + word.length)).replace(EDGE_GLUE, '')
  return rest
}

/** Whether the word may match as a substring of a longer token (CJK only —
 * Latin words inside other words, like "live" in "delivery", are noise) */
function cjk(word: string): boolean {
  return /[぀-ヿ㐀-鿿]/.test(word)
}

/**
 * Suggest conditions for the bare keyword tokens of the current input.
 * Exact token matches come first, then CJK substring matches. Suggestions
 * whose value is already set in `state` are omitted (nothing to add)
 */
export function suggestFor(terms: string[], state: QueryState, now: Date): SmartSuggestion[] {
  const out: SmartSuggestion[] = []
  const seen = new Set<string>()
  const push = (s: SmartSuggestion) => {
    if (seen.has(s.key)) return
    seen.add(s.key)
    out.push(s)
  }
  const alreadySet = (patch: Partial<QueryState>): boolean =>
    Object.entries(patch).every(([k, v]) => state[k as keyof QueryState] === v)

  for (const source of terms) {
    const norm = normalizeForSearch(source)
    for (const entry of VOCAB) {
      if (alreadySet(entry.patch)) continue
      for (const word of entry.words) {
        const w = normalizeForSearch(word)
        if (norm === w) {
          push({
            source,
            remainder: '',
            concept: entry.concept,
            patch: entry.patch,
            key: entry.key,
          })
          break
        }
        if (cjk(word)) {
          const rest = peel(source, word)
          if (rest !== null) {
            push({
              source,
              remainder: rest,
              concept: entry.concept,
              patch: entry.patch,
              key: entry.key,
            })
            break
          }
        }
      }
    }
    // Period words inside longer tokens (bare exact tokens are consumed by
    // the parser itself before reaching here)
    for (const word of PERIOD_WORDS) {
      const rest = peel(source, word)
      if (rest === null || rest === source) continue
      const range = parsePeriodWord(word, now)
      if (!range) continue
      const patch: Partial<QueryState> = { since: range.since, until: range.until ?? '' }
      if (alreadySet(patch)) continue
      push({ source, remainder: rest, concept: 'period', patch, key: `period:${word}` })
      break
    }
  }
  return out.slice(0, 4)
}
