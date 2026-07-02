import type { QueryState } from './types'
import { t } from '@/i18n'
import { stripAt, stripHash, words } from './text'

/** 保存検索・履歴の一覧に表示する、条件の短い要約 */
export function summarize(state: QueryState): string {
  const parts: string[] = []
  if (state.keywords.trim()) parts.push(words(state.keywords).join(' '))
  for (const group of state.orGroups) {
    const orWords = words(group)
    if (orWords.length > 0) parts.push(orWords.join(' または '))
  }
  if (state.exactPhrase.trim()) parts.push(`「${state.exactPhrase.trim()}」`)
  if (state.exclude.trim()) {
    parts.push(`${t('summary.exclude')}: ${words(state.exclude).join(' ')}`)
  }
  if (state.fromUser.trim()) parts.push(`@${stripAt(state.fromUser)}`)
  if (state.toUser.trim()) parts.push(`→@${stripAt(state.toUser)}`)
  if (state.mentionsUser.trim()) parts.push(`@${stripAt(state.mentionsUser)}宛`)
  if (state.subreddit.trim()) parts.push(`r/${state.subreddit.trim()}`)
  if (state.domain.trim()) parts.push(state.domain.trim())
  if (state.hashtag.trim()) parts.push(`#${stripHash(state.hashtag)}`)
  if (state.since || state.until) parts.push(`${state.since}〜${state.until}`)
  if (state.minLikes.trim()) parts.push(`♥${state.minLikes.trim()}+`)
  if (state.mediaOnly) parts.push(t('concept.mediaOnly.label'))
  if (state.japaneseOnly) parts.push(t('concept.japaneseOnly.label'))
  return parts.join(' / ')
}
