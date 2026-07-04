import type { QueryState } from './types'
import { getLang, t } from '@/i18n'
import { andTerms, exactPhrases, stripAt, stripHash, words } from './text'

/** ひとまとまりの語句を括る引用符。日本語は「」、英語は"" */
function quote(s: string): string {
  return getLang() === 'ja' ? `「${s}」` : `“${s}”`
}

/** スペースを含む語は引用符で括り、ひとまとまりであることを示す */
function markPhrase(term: string): string {
  return /[\s　]/.test(term) ? quote(term) : term
}

/** 保存検索・履歴の一覧に表示する、条件の短い要約 */
export function summarize(state: QueryState): string {
  const parts: string[] = []
  const kw = andTerms(state).map(markPhrase)
  if (kw.length > 0) parts.push(kw.join(' '))
  const phrases = exactPhrases(state).map(quote)
  if (phrases.length > 0) parts.push(phrases.join(' '))
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
        .join(' '),
    )
  }
  if (state.since || state.until) parts.push(`${state.since}〜${state.until}`)
  if (state.minLikes.trim()) parts.push(`♥${state.minLikes.trim()}+`)
  if (state.workType) parts.push(t(`concept.workType.${state.workType}`))
  if (state.resultType) parts.push(t(`concept.resultType.${state.resultType}`))
  if (state.mediaOnly) parts.push(t('concept.mediaOnly.label'))
  if (state.japaneseOnly) parts.push(t('concept.japaneseOnly.label'))
  return parts.join(' / ')
}
