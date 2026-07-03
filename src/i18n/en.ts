// English UI strings. Keys mirror ja.ts exactly (enforced by the Record type in index.ts).
export const en = {
  'app.title': 'Cross-SNS Search',
  'app.description':
    'Build a search once, and open it on each social site and forum in that site’s own search syntax.',
  'app.langSwitch': '日本語',

  // Search concepts (builder rows). placeholder = input example, help = the ⓘ hover description
  'concept.keywords.label': 'Keywords',
  'concept.keywords.placeholder': 'e.g. typhoon',
  'concept.keywords.help': 'Finds posts that contain the words you enter.',
  'concept.terms.removeTerm': 'Remove this word',
  'concept.exactPhrase.label': 'Exact phrase',
  'concept.exactPhrase.placeholder': 'e.g. planned service suspension',
  'concept.exactPhrase.help':
    'Finds only posts containing this exact wording, including word order and spacing.',
  'concept.exclude.label': 'Exclude keywords',
  'concept.exclude.placeholder': 'e.g. ad',
  'concept.exclude.help':
    'Removes posts containing the given words from the results.',
  'concept.titleOnly.label': 'Title only',
  'concept.titleOnly.help':
    'Finds only posts whose title contains the keyword, not the body.',
  'concept.fromUser.label': 'From this user only',
  'concept.fromUser.placeholder': 'e.g. nhk_news',
  'concept.fromUser.help':
    'Finds only posts by the given user. Do not include @ in the username.',
  'concept.excludeUser.label': 'Exclude this user',
  'concept.excludeUser.placeholder': 'e.g. nhk_news',
  'concept.excludeUser.help':
    'Removes posts by the given user from the results. Do not include @ in the username.',
  'concept.toUser.label': 'Replies to this user only',
  'concept.toUser.placeholder': 'e.g. nhk_news',
  'concept.toUser.help':
    'Finds only replies addressed to the given user. Do not include @ in the username.',
  'concept.mentionsUser.label': 'Mentions this user only',
  'concept.mentionsUser.placeholder': 'e.g. user.bsky.social',
  'concept.mentionsUser.help':
    'Finds only posts that mention the given user.',
  'concept.subreddit.label': 'Within this community only',
  'concept.subreddit.placeholder': 'e.g. japan',
  'concept.subreddit.help':
    'Finds only posts within the given community (a subreddit on Reddit, or a board on 5channel). Do not include r/ in the name.',
  'concept.domain.label': 'Links to this site',
  'concept.domain.placeholder': 'e.g. nhk.or.jp',
  'concept.domain.help': 'Finds only posts that link to the given site.',
  'concept.hashtag.label': 'Hashtag',
  'concept.hashtag.placeholder': 'e.g. booklog',
  'concept.hashtag.help':
    'Finds posts with the given hashtag. Do not include #.',
  'concept.period.label': 'Date range',
  'concept.period.since': 'From',
  'concept.period.until': 'Before',
  'concept.period.help':
    'Filters by post date. You can set just one side.',
  'concept.mediaOnly.label': 'With image or video only',
  'concept.mediaOnly.help': 'Keeps only posts that include an image or video.',
  'concept.videoLength.label': 'Video length',
  'concept.videoLength.none': 'Any',
  'concept.videoLength.short': 'Short (under 4 min)',
  'concept.videoLength.medium': 'Medium (4–20 min)',
  'concept.videoLength.long': 'Long (over 20 min)',
  'concept.videoLength.help': 'Filters by video duration.',
  'concept.linksOnly.label': 'With links only',
  'concept.linksOnly.help': 'Keeps only posts that contain a link (URL).',
  'concept.verifiedOnly.label': 'Verified accounts only',
  'concept.verifiedOnly.help': 'Keeps only posts from verified accounts.',
  'concept.excludeReplies.label': 'Exclude replies',
  'concept.excludeReplies.help': 'Removes replies from the results.',
  'concept.minLikes.label': 'Minimum likes',
  'concept.minLikes.placeholder': 'e.g. 100',
  'concept.minLikes.help':
    'Keeps only posts with at least the given number of likes.',
  'concept.minReposts.label': 'Minimum reposts',
  'concept.minReposts.placeholder': 'e.g. 50',
  'concept.minReposts.help':
    'Keeps only posts with at least the given number of reposts.',
  'concept.japaneseOnly.label': 'Japanese posts only',
  'concept.japaneseOnly.help': 'Keeps only posts written in Japanese.',
  'concept.workType.label': 'Work type',
  'concept.workType.none': 'Any',
  'concept.workType.illust': 'Illustration',
  'concept.workType.manga': 'Manga',
  'concept.workType.help':
    'Choose whether to search illustrations or manga. If left unset, each site’s default target is used.',
  'concept.resultType.label': 'Looking for',
  'concept.resultType.none': 'Any',
  'concept.resultType.video': 'Videos',
  'concept.resultType.channel': 'Channels',
  'concept.resultType.help':
    'Choose the type of result. “Channels” finds creators/broadcasters instead of videos.',
  'concept.sortOrder.label': 'Sort order',
  'concept.sortOrder.new': 'Newest',
  'concept.sortOrder.top': 'Popular',
  'concept.sortOrder.auto': 'Auto',
  'concept.sortOrder.help':
    'Sets the result order. “Auto” uses each site’s default order.',

  // Shared hint above the builder
  'builder.hint.enter':
    'Press Enter to separate words and set multiple words in one field.',

  // Site filter and supported-site badge
  'builder.filter.label': 'Filter by site',
  'builder.filter.help':
    'Narrows the list below to the conditions the chosen site supports. It does not change which sites you search. Conditions you have already filled in stay visible while filtering.',
  'builder.help.iconLabel': 'About this condition',
  'builder.filter.active': 'Filtering',
  'builder.filter.all': 'All',
  'builder.support.label': 'Sites',

  // Notes shared across platforms
  'note.loose.and': 'There is no guarantee that all keywords are included.',
  'note.loose.exact':
    'Exact phrase does not work; it is searched as ordinary keywords.',
  'note.exact.unreliable': 'Exact phrase may not work.',
  'note.hashtag.askeyword': 'Searched as an ordinary keyword.',
  'note.tagPage.combined':
    'When combined with other conditions, it is searched as an ordinary keyword.',
  'note.nosort': 'Sort order cannot be set via URL.',
  'note.videoOnly': 'This site is video-only, so this filter is unnecessary.',
  'note.imageOnly':
    'This site is image/illustration-only, so this filter is unnecessary.',
  'note.jaOnly.service':
    'This is a Japanese service, so this filter is unnecessary.',

  // Per-platform notes
  'note.x.period':
    'You cannot search by date alone. Combine it with a keyword.',
  'note.x.unofficial':
    'This is an unofficial feature and may stop working in the future.',
  'note.unofficial':
    'This is an unofficial method and may stop working in the future.',
  'note.niconico.videoLength':
    '“Medium (4–20 min)” cannot be set and is ignored.',
  'note.bluesky.exclude':
    'This feature is not officially documented and may stop working in the future.',
  'note.bluesky.fromUser': 'The username is in the form “user.bsky.social”.',
  'note.bluesky.mediaOnly': 'Bluesky has no way to filter by image/video.',
  'note.bluesky.sort':
    'Newest uses an unofficial URL parameter and may stop working in the future.',
  'note.youtube.exactPhrase': 'Exact phrase often does not work.',
  'note.youtube.exclude': 'Exclusion may not work.',
  'note.youtube.fromUser': 'Opens the in-channel search page.',
  'note.youtube.hashtag': 'Searched as an ordinary keyword.',
  'note.youtube.period':
    'This is an unofficial method and may stop working in the future.',
  'note.youtube.mediaOnly':
    'YouTube is video-only, so this filter is unnecessary.',
  'note.youtube.japaneseOnly': 'YouTube has no way to filter by language.',
  'note.youtube.sort':
    'Popular is approximated by view count (unofficial). Newest currently no longer works on YouTube. It cannot be combined with a user filter.',
  'note.note.keywords':
    'There is no guarantee that all keywords are included (similar articles may also appear).',
  'note.note.exactPhrase':
    'Exact phrase does not work; it is searched as ordinary keywords.',
  'note.note.exclude': 'note has no exclusion search.',
  'note.note.fromUser': 'The username is the note ID (the part after @).',
  'note.note.hashtag':
    'When combined with other conditions, it is searched as an ordinary keyword.',
  'note.note.period': 'note has no date filter.',
  'note.note.mediaOnly': 'note has no way to filter by image/video.',
  'note.note.japaneseOnly':
    'note is a Japanese service, so this filter is unnecessary.',

  // Additional platform-specific notes
  'note.reddit.hashtag': 'Reddit has no hashtag system.',
  'note.reddit.period': 'Rounded to “past day / week / month / year”.',
  'note.instagram.hashtag':
    'Tag pages show only top posts (no latest order).',
  'note.pixiv.keywords':
    'Searched by partial tag match (words not in the tags won’t hit even if they’re in the body).',
  'note.pixiv.fromUser': 'pixiv search has no user filter.',
  'note.pixiv.sort': 'Popular order works only for pixiv Premium members.',
  'note.misskey.keywords':
    'Searched by partial body match. Rare words may return no results.',
  'note.misskey.exclude': 'Misskey has no exclusion search.',
  'note.misskey.fromUser':
    'Requires combining with a keyword. Uses an unofficial URL parameter and may stop working in the future.',
  'note.youtube.resultType':
    'This is an unofficial method. It cannot be combined with a user filter.',
  'note.hatebu.minLikes':
    'Filters by bookmark count. Numbers not among Hatena’s options (1/3/50/100/500) may not work.',
  'note.hatebu.fromUser':
    'Keyword search within a user’s bookmarks requires a Hatena login, so it is not supported.',
  'note.twitch.japaneseOnly':
    'Filtering by language cannot be set via URL.',
  'note.fivech.keywords':
    'Only thread titles are searched. Opens the thread-title search service (ff5ch.syoboi.jp).',
  'note.fivech.subreddit':
    'You can set only one board ID (e.g. sony). Any beyond the first are ignored.',
  'note.animanch.keywords':
    'Searches post bodies (a beta feature, so some may be missed).',
  'note.animanch.titleOnly':
    'Searches only thread titles across the full archive.',

  // Launch panel group headings
  'group.sns': 'SNS',
  'group.video': 'Video',
  'group.image': 'Illustration & Images',
  'group.text': 'Blogs & Forums',

  // Launch panel. {name} is filled with the site name
  'launch.search': 'Search {name}',
  'launch.bgHint': 'Middle-click, or Ctrl/⌘-click, to open in a background tab',
  'launch.loginNote':
    'You must be signed in to {name} in this browser to see results.',
  'launch.appliedCount': '{applied}/{total} conditions applied',
  'launch.approxHeading': 'Partially works',
  'launch.droppedHeading': 'Not available',
  'launch.urlPreview': 'URL to open',

  // Google fallback (site: search). The suffixes follow a list of condition names
  'google.recovered.suffix':
    ' can still be used by searching within this site on Google',
  'google.lost.suffix': ' can’t be carried over to Google',
  'google.launch': 'Search within {name} on Google',

  // Sharing
  'share.copyLink': 'Copy link',
  'share.copyLink.tip':
    'Copies a URL that opens the current conditions as-is. Handy for bookmarking or sharing.',
  'share.copied': 'Copied',

  // Mobile screen-switch button (bottom right). Names the destination screen
  'tab.build': 'Enter conditions',
  'tab.launch': 'Search',
  'column.build': 'Search conditions',
  'column.launch': 'Open on each site',

  // Builder actions
  'builder.clear': 'Clear',
  'builder.clear.tip': 'Resets all conditions to empty.',

  // Saved searches and history
  'saved.save': 'Save',
  'saved.save.tip':
    'Saves the current conditions in this browser. Recall them from “Saved searches” below.',
  'saved.title': 'Saved searches',
  'saved.delete': 'Delete',
  'history.title': 'Recently opened',
  'summary.exclude': 'Exclude',

  // Footer
  'footer.disclaimer':
    'Search syntax relies on each site’s unofficial behavior, so it may stop working without notice.',
  'footer.github': 'GitHub',
}
