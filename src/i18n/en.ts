// English UI strings. Keys mirror ja.ts exactly (enforced by the Record type in index.ts).
export const en = {
  'app.langSwitch': '日本語',
  'app.themeToggle': 'Toggle theme',
  'app.tagline': 'Build your conditions, then search each platform',

  // Search concepts (builder rows). placeholder = input example, help = the ⓘ hover description
  'concept.keywords.label': 'Keywords',
  'concept.keywords.placeholder': 'Type what you want to find',
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
  'concept.language.label': 'Post language',
  'concept.language.none': 'Any',
  'concept.language.ja': 'Japanese',
  'concept.language.en': 'English',
  'concept.language.help':
    'Filters by the language the post is written in (X and Bluesky only).',
  'concept.workType.label': 'Work type',
  'concept.workType.none': 'Any',
  'concept.workType.illust': 'Illustration',
  'concept.workType.manga': 'Manga',
  'concept.workType.help': 'Choose whether to search illustrations or manga.',
  'concept.resultType.label': 'Video / channel type',
  'concept.resultType.none': 'Any',
  'concept.resultType.video': 'Videos',
  'concept.resultType.short': 'Shorts',
  'concept.resultType.channel': 'Channels',
  'concept.resultType.playlist': 'Playlists',
  'concept.resultType.help':
    'On video sites (YouTube, Twitch), choose what to look for — videos, channels, and so on. Shorts and Playlists work on YouTube only.',
  'concept.sortOrder.label': 'Sort order',
  'concept.sortOrder.new': 'Newest',
  'concept.sortOrder.top': 'Popular',
  'concept.sortOrder.hot': 'Trending',
  'concept.sortOrder.auto': 'Auto',
  'concept.sortOrder.help': 'Sets the result order.',
  'concept.pixivPopular.label': 'Popularity',
  'concept.pixivPopular.none': 'Any',
  'concept.pixivPopular.100': '100+ bookmarks',
  'concept.pixivPopular.1000': '1,000+ bookmarks',
  'concept.pixivPopular.10000': '10,000+ bookmarks',
  'concept.pixivPopular.help':
    'On pixiv, finds only popular works that reached a given bookmark count — a pseudo “popular” sort without Premium (uses the “N users入り” tags).',

  // Site filter in the picker, and the supported-sites label on bars
  'builder.filter.label': 'Show conditions a site supports',
  'builder.filter.help':
    'Shows only the conditions the chosen site supports. This changes what is listed, not which sites you search.',
  'builder.filter.all': 'All',
  'builder.support.label': 'Sites',

  // Notes shared across platforms
  'note.loose.and': 'There is no guarantee that all keywords are included.',
  'note.loose.exact':
    'Exact phrase does not work; it is searched as ordinary keywords.',
  'note.exact.unreliable': 'Exact phrase may not work.',
  'note.tagPage.combined':
    'When combined with other conditions, it is searched as an ordinary keyword.',
  'note.nosort': 'Sort order cannot be set via URL.',
  'note.videoOnly': 'This site is video-only, so this filter is unnecessary.',
  'note.imageOnly':
    'This site is image/illustration-only, so this filter is unnecessary.',

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
  'note.youtube.sort':
    'Popular is approximated by view count (unofficial). Newest currently no longer works on YouTube.',
  'note.youtube.channelConflict':
    'This filter has no effect when combined with a user filter (in-channel search).',
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

  // Additional platform-specific notes
  'note.reddit.hashtag': 'Reddit has no hashtag system.',
  'note.reddit.period': 'Rounded to “past day / week / month / year”.',
  'note.reddit.untilOnly':
    'Reddit cannot filter by an end date alone (a start date is required).',
  'note.instagram.hashtag':
    'Tag pages show only top posts (no latest order).',
  'note.instagram.multiTag':
    'With two or more hashtags this becomes a loose keyword search rather than a tag page, with no guarantee all tags are included.',
  'note.pixiv.keywords':
    'Searched by partial tag match (words not in the tags won’t hit even if they’re in the body).',
  'note.pixiv.titleOnly':
    'Searches titles and captions (descriptions), not tags.',
  'note.pixiv.fromUser': 'pixiv search has no user filter.',
  'note.pixiv.sort': 'Popular order works only for pixiv Premium members.',
  'note.pixiv.popular':
    'Filters to popular works via the “N users入り” tags. These are added by fans by hand, so some popular works may be missed.',
  'note.misskey.keywords':
    'Searched as an AND of each word by partial match (rare words may return nothing). After the page opens, press the “Search” button there to show results.',
  'note.misskey.exclude':
    'Excludes terms prefixed with “-” (unofficial, so it may not work).',
  'note.misskey.fromUser':
    'Requires combining with a keyword. Uses an unofficial URL parameter and may stop working in the future.',
  'note.youtube.resultType':
    'This is an unofficial method. It cannot be combined with a user filter.',
  'note.hatebu.minLikes':
    'The number you set is used as the minimum bookmark count.',
  'note.hatebu.titleTagConflict':
    'When searching by hashtag alone, the title-only filter has no effect.',
  'note.hatebu.fromUser':
    'Keyword search within a user’s bookmarks requires a Hatena login, so it is not supported.',
  'note.twitch.resultType': 'Twitch can only search videos and channels.',
  'note.sortOrder.otherSite': 'This sort order is not available on this site.',
  'note.fivech.keywords':
    'Only thread titles are searched. Opens the thread-title search service (ff5ch.syoboi.jp).',
  'note.fivech.titleOnly':
    '5ch search always targets thread titles only (it searches titles regardless of this toggle).',
  'note.fivech.subreddit':
    'Filters by board ID (e.g. sony). Set several to match any of those boards (OR).',
  'note.animanch.keywords':
    'Searches post bodies (a beta feature, so some may be missed).',
  'note.animanch.titleOnly':
    'Searches only thread titles across the full archive.',

  // Launch panel. {name} is filled with the site name
  'launch.search': 'Search {name}',
  'launch.bgHint':
    'Middle-click or Ctrl/⌘-click to open several sites in background tabs.',
  'launch.approxHeading': 'Partially works',
  'launch.droppedHeading': 'Not available',

  // Site group headings on the launch screen
  'group.sns': 'SNS',
  'group.video': 'Video',
  'group.image': 'Illustration & Images',
  'group.text': 'Blogs & Forums',

  // Two-screen snap layout
  'ui.addCondition': 'Add a condition',
  'ui.clearConditions': 'Clear all',
  'ui.removeCondition': 'Remove this condition',
  'ui.scrollToLinks': 'Scroll to open the searches',
  'ui.scrollToConditions': 'Scroll back to conditions',
  'ui.enterToAdd': 'to add',
  'ui.loginRequired': 'Sign-in required',
  'ui.notSearchable': 'Not searchable with these conditions',
  'support.full': 'Full support',
  'support.partial': 'Partial support',
  'picker.title': 'Add a condition',
  'cal.clear': 'Clear',
  'cal.pickDate': 'Pick a date',

  // Footer
  'footer.disclaimer':
    'Some filters rely on unofficial behavior and may break without notice.',
  'footer.privacy':
    'Your conditions are never sent to a server — search URLs are built entirely in your browser.',
}
