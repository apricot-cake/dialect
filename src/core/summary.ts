import type { QueryState } from './types'
import { t } from '@/i18n'
import { andTerms, stripAt, stripHash, words } from './text'

/** スペースを含む語は「」で括り、ひとまとまりであることを示す */
function markPhrase(term: string): string {
  return /[\s　]/.test(term) ? `「${term}」` : term
}

/** 保存検索・履歴の一覧に表示する、条件の短い要約 */
export function summarize(state: QueryState): string {
  const parts: string[] = []
  const kw = andTerms(state).map(markPhrase)
  if (kw.length > 0) parts.push(kw.join(' '))
  if (state.exactPhrase.trim()) {
    parts.push(`「${state.exactPhrase.trim()}」`)
  }
  if (state.exclude.trim()) {
    parts.push(`${t('summary.exclude')}: ${words(state.exclude).join(' ')}`)
  }
  if (state.fromUser.trim()) parts.push(`@${stripAt(state.fromUser)}`)
  if (state.excludeUser.trim()) {
    parts.push(...words(state.excludeUser).map((u) => `-@${stripAt(u)}`))
  }
  if (state.toUser.trim()) {
    parts.push(words(state.toUser).map((u) => `→@${stripAt(u)}`).join('・'))
  }
  if (state.mentionsUser.trim()) parts.push(`@${stripAt(state.mentionsUser)}宛`)
  if (state.subreddit.trim()) {
    parts.push(words(state.subreddit).map((s) => `r/${s}`).join('・'))
  }
  if (state.domain.trim()) parts.push(state.domain.trim())
  if (state.hashtag.trim()) {
    parts.push(
      words(state.hashtag)
        .map((t) => `#${stripHash(t)}`)
        .join(state.hashtagMode === 'any' ? ' または ' : ' '),
    )
  }
  if (state.since || state.until) parts.push(`${state.since}〜${state.until}`)
  if (state.minLikes.trim()) parts.push(`♥${state.minLikes.trim()}+`)
  if (state.mediaOnly) parts.push(t('concept.mediaOnly.label'))
  if (state.japaneseOnly) parts.push(t('concept.japaneseOnly.label'))
  return parts.join(' / ')
}

/** 条件セット(セット間OR)の要約。複数セットのときは①②…で区切って並べる */
export function summarizeSets(sets: QueryState[]): string {
  if (sets.length === 1) return summarize(sets[0])
  return sets
    .map((s, i) => `${setMark(i)} ${summarize(s)}`)
    .join(` ${t('sets.or')} `)
}

/** セット番号の記号(①〜⑳、それ以降は (21) 形式) */
export function setMark(index: number): string {
  return index < 20 ? String.fromCodePoint(0x2460 + index) : `(${index + 1})`
}
