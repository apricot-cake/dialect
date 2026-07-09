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
  if (state.tagTitleCaption) active.push('tagTitleCaption')
  if (state.fromUser.trim()) active.push('fromUser')
  if (state.excludeUser.trim()) active.push('excludeUser')
  if (state.toUser.trim()) active.push('toUser')
  if (state.mentionsUser.trim()) active.push('mentionsUser')
  if (state.subreddit.trim()) active.push('subreddit')
  if (state.domain.trim()) active.push('domain')
  if (state.xList.trim()) active.push('xList')
  if (state.hashtag.trim()) active.push('hashtag')
  if (state.since || state.until) active.push('period')
  if (state.mediaOnly) active.push('mediaOnly')
  if (state.videoLength) active.push('videoLength')
  if (state.linksOnly) active.push('linksOnly')
  if (state.verifiedOnly) active.push('verifiedOnly')
  if (state.excludeReplies) active.push('excludeReplies')
  if (state.liveOnly) active.push('liveOnly')
  if (state.fourK) active.push('fourK')
  if (state.hdOnly) active.push('hdOnly')
  if (state.captionsOnly) active.push('captionsOnly')
  if (state.creativeCommons) active.push('creativeCommons')
  if (state.threeSixty) active.push('threeSixty')
  if (state.vr180) active.push('vr180')
  if (state.threeD) active.push('threeD')
  if (state.hdr) active.push('hdr')
  if (state.locationOnly) active.push('locationOnly')
  if (state.purchased) active.push('purchased')
  if (state.minLikes.trim()) active.push('minLikes')
  if (state.minReposts.trim()) active.push('minReposts')
  if (state.minReplies.trim()) active.push('minReplies')
  if (state.language) active.push('language')
  if (state.workType) active.push('workType')
  if (state.genre) active.push('genre')
  if (state.nicoKind) active.push('nicoKind')
  if (state.paidOnly) active.push('paidOnly')
  if (state.fantiaCategory) active.push('fantiaCategory')
  if (state.fantiaAudience) active.push('fantiaAudience')
  if (state.resultType) active.push('resultType')
  if (state.pixivPopular) active.push('pixivPopular')
  if (state.ageRating) active.push('ageRating')
  if (state.excludeAi) active.push('excludeAi')
  // 並び順は既定の「指定なし(auto)」のままなら条件として数えない(サイトの標準の
  // 並びのまま=何も課していないため)。ユーザーが意図的に選んだ並び順
  // (新しい順・人気順など)だけを注記・件数の対象にする
  if (state.sort !== 'auto') active.push('sortOrder')
  return active
}

export function defaultState(): QueryState {
  return {
    terms: [''],
    exactPhrase: [''],
    exclude: '',
    titleOnly: false,
    exactTag: false,
    tagTitleCaption: false,
    fromUser: '',
    excludeUser: '',
    toUser: '',
    mentionsUser: '',
    subreddit: '',
    domain: '',
    xList: '',
    hashtag: '',
    since: '',
    until: '',
    mediaOnly: false,
    videoLength: '',
    linksOnly: false,
    verifiedOnly: false,
    excludeReplies: false,
    liveOnly: false,
    fourK: false,
    hdOnly: false,
    captionsOnly: false,
    creativeCommons: false,
    threeSixty: false,
    vr180: false,
    threeD: false,
    hdr: false,
    locationOnly: false,
    purchased: false,
    minLikes: '',
    minReposts: '',
    minReplies: '',
    language: '',
    workType: '',
    genre: '',
    nicoKind: '',
    paidOnly: false,
    fantiaCategory: '',
    fantiaAudience: '',
    resultType: '',
    sort: 'auto',
    pixivPopular: '',
    ageRating: '',
    excludeAi: false,
  }
}
