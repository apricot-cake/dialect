import type { ConceptId, QueryState } from './types'
import { andTerms, exactPhrases } from './text'

/** state の中で実際に指定されている概念 */
export function activeConcepts(state: QueryState): ConceptId[] {
  const active: ConceptId[] = []
  if (andTerms(state).length > 0) active.push('keywords')
  if (exactPhrases(state).length > 0) active.push('exactPhrase')
  if (state.exclude.trim()) active.push('exclude')
  if (state.titleOnly) active.push('titleOnly')
  if (state.exactTag) active.push('exactTag')
  if (state.fromUser.trim()) active.push('fromUser')
  if (state.excludeUser.trim()) active.push('excludeUser')
  if (state.toUser.trim()) active.push('toUser')
  if (state.mentionsUser.trim()) active.push('mentionsUser')
  if (state.subreddit.trim()) active.push('subreddit')
  if (state.domain.trim()) active.push('domain')
  if (state.hashtag.trim()) active.push('hashtag')
  if (state.since || state.until) active.push('period')
  if (state.mediaOnly) active.push('mediaOnly')
  if (state.videoLength) active.push('videoLength')
  if (state.linksOnly) active.push('linksOnly')
  if (state.verifiedOnly) active.push('verifiedOnly')
  if (state.excludeReplies) active.push('excludeReplies')
  if (state.liveOnly) active.push('liveOnly')
  if (state.minLikes.trim()) active.push('minLikes')
  if (state.minReposts.trim()) active.push('minReposts')
  if (state.minReplies.trim()) active.push('minReplies')
  if (state.language) active.push('language')
  if (state.workType) active.push('workType')
  if (state.genre) active.push('genre')
  if (state.resultType) active.push('resultType')
  if (state.pixivPopular) active.push('pixivPopular')
  if (state.ageRating) active.push('ageRating')
  if (state.excludeAi) active.push('excludeAi')
  // 並び順は初期値(新しい順)のままなら条件として数えない(未入力でも注記が
  // 出てしまうため)。「おまかせ」も条件を課さない選択なので数えない。
  // ユーザーが意図的に選んだ並び順(人気順・急上昇など)だけを注記・件数の対象にする
  if (state.sort !== 'new' && state.sort !== 'auto') active.push('sortOrder')
  return active
}

export function defaultState(): QueryState {
  return {
    terms: [''],
    exactPhrase: [''],
    exclude: '',
    titleOnly: false,
    exactTag: false,
    fromUser: '',
    excludeUser: '',
    toUser: '',
    mentionsUser: '',
    subreddit: '',
    domain: '',
    hashtag: '',
    since: '',
    until: '',
    mediaOnly: false,
    videoLength: '',
    linksOnly: false,
    verifiedOnly: false,
    excludeReplies: false,
    liveOnly: false,
    minLikes: '',
    minReposts: '',
    minReplies: '',
    language: '',
    workType: '',
    genre: '',
    resultType: '',
    sort: 'new',
    pixivPopular: '',
    ageRating: '',
    excludeAi: false,
  }
}
