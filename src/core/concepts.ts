import type { ConceptId, QueryState } from './types'
import { andTerms, exactPhrases } from './text'

/** state の中で実際に指定されている概念 */
export function activeConcepts(state: QueryState): ConceptId[] {
  const active: ConceptId[] = []
  if (andTerms(state).length > 0) active.push('keywords')
  if (exactPhrases(state).length > 0) active.push('exactPhrase')
  if (state.keywordsOr.trim()) active.push('keywordsOr')
  if (state.exclude.trim()) active.push('exclude')
  if (state.titleOnly) active.push('titleOnly')
  if (state.exactTag) active.push('exactTag')
  if (state.tagTitleCaption) active.push('tagTitleCaption')
  if (state.fromUser.trim()) active.push('fromUser')
  if (state.excludeUser.trim()) active.push('excludeUser')
  if (state.toUser.trim()) active.push('toUser')
  if (state.mentionsUser.trim()) active.push('mentionsUser')
  if (state.excludeMentions.trim()) active.push('excludeMentions')
  if (state.subreddit.trim()) active.push('subreddit')
  if (state.domain.trim()) active.push('domain')
  if (state.excludeDomain.trim()) active.push('excludeDomain')
  if (state.linkUrl.trim()) active.push('linkUrl')
  if (state.excludeLinkUrl.trim()) active.push('excludeLinkUrl')
  if (state.fileType) active.push('fileType')
  if (state.region.trim()) active.push('region')
  if (state.license) active.push('license')
  if (state.exactMatchMode) active.push('exactMatchMode')
  if (state.codeLanguage.trim()) active.push('codeLanguage')
  if (state.minStars.trim()) active.push('minStars')
  if (state.minStocks.trim()) active.push('minStocks')
  if (state.semanticSearch) active.push('semanticSearch')
  if (state.xList.trim()) active.push('xList')
  if (state.hashtag.trim()) active.push('hashtag')
  if (state.hashtagOr.trim()) active.push('hashtagOr')
  if (state.excludeHashtag.trim()) active.push('excludeHashtag')
  if (state.since || state.until) active.push('period')
  if (state.mediaOnly) active.push('mediaOnly')
  if (state.videoOnly) active.push('videoOnly')
  if (state.videoLength) active.push('videoLength')
  if (state.linksOnly) active.push('linksOnly')
  if (state.verifiedOnly) active.push('verifiedOnly')
  if (state.excludeReplies) active.push('excludeReplies')
  if (state.repliesOnly) active.push('repliesOnly')
  if (state.followingOnly) active.push('followingOnly')
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
  if (state.safeSearchOff) active.push('safeSearchOff')
  if (state.resultType) active.push('resultType')
  if (state.pixivPopular) active.push('pixivPopular')
  if (state.ageRating) active.push('ageRating')
  if (state.excludeAi) active.push('excludeAi')
  if (state.minForks.trim()) active.push('minForks')
  if (state.minSizeKb.trim()) active.push('minSizeKb')
  if (state.pushedSince || state.pushedUntil) active.push('pushedPeriod')
  if (state.codeLicense) active.push('codeLicense')
  if (state.includeForks) active.push('includeForks')
  if (state.visibility) active.push('visibility')
  if (state.topic.trim()) active.push('topic')
  if (state.searchInName) active.push('searchInName')
  if (state.searchInDescription) active.push('searchInDescription')
  if (state.searchInReadme) active.push('searchInReadme')
  if (state.archived) active.push('archived')
  if (state.mirror) active.push('mirror')
  if (state.org.trim()) active.push('org')
  if (state.fileExtension.trim()) active.push('fileExtension')
  if (state.filePath.trim()) active.push('filePath')
  if (state.fileName.trim()) active.push('fileName')
  if (state.issueState) active.push('issueState')
  if (state.issueReason) active.push('issueReason')
  if (state.minComments.trim()) active.push('minComments')
  if (state.label.trim()) active.push('label')
  if (state.assignee.trim()) active.push('assignee')
  if (state.updatedSince || state.updatedUntil) active.push('updatedPeriod')
  if (state.fullName.trim()) active.push('fullName')
  if (state.userLocation.trim()) active.push('userLocation')
  if (state.minFollowers.trim()) active.push('minFollowers')
  if (state.minRepos.trim()) active.push('minRepos')
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
    keywordsOr: '',
    exclude: '',
    titleOnly: false,
    exactTag: false,
    tagTitleCaption: false,
    fromUser: '',
    excludeUser: '',
    toUser: '',
    mentionsUser: '',
    excludeMentions: '',
    subreddit: '',
    domain: '',
    excludeDomain: '',
    linkUrl: '',
    excludeLinkUrl: '',
    fileType: '',
    region: '',
    license: '',
    exactMatchMode: false,
    codeLanguage: '',
    minStars: '',
    minStocks: '',
    semanticSearch: false,
    xList: '',
    hashtag: '',
    hashtagOr: '',
    excludeHashtag: '',
    since: '',
    until: '',
    mediaOnly: false,
    videoOnly: false,
    videoLength: '',
    linksOnly: false,
    verifiedOnly: false,
    excludeReplies: false,
    repliesOnly: false,
    followingOnly: false,
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
    safeSearchOff: false,
    resultType: '',
    sort: 'auto',
    pixivPopular: '',
    ageRating: '',
    excludeAi: false,
    minForks: '',
    minSizeKb: '',
    pushedSince: '',
    pushedUntil: '',
    codeLicense: '',
    includeForks: '',
    visibility: '',
    topic: '',
    searchInName: false,
    searchInDescription: false,
    searchInReadme: false,
    archived: '',
    mirror: '',
    org: '',
    fileExtension: '',
    filePath: '',
    fileName: '',
    issueState: '',
    issueReason: '',
    minComments: '',
    label: '',
    assignee: '',
    updatedSince: '',
    updatedUntil: '',
    fullName: '',
    userLocation: '',
    minFollowers: '',
    minRepos: '',
  }
}
