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
  'concept.exactTag.label': 'Exact tag',
  'concept.exactTag.help':
    'Finds only works tagged with exactly your search term (pixiv only).',
  'concept.tagTitleCaption.label': 'Search tags, title, and caption',
  'concept.tagTitleCaption.help':
    'Searches the title and caption in addition to tags, widening the match beyond a plain tag search (pixiv only).',
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
  'concept.xList.label': 'Search within an X List',
  'concept.xList.placeholder': 'List URL or ID',
  'concept.xList.help':
    'Finds only posts from an X List (a set of accounts grouped together). Paste the List’s URL or ID.',
  'concept.hashtag.label': 'Hashtag',
  'concept.hashtag.placeholder': 'e.g. booklog',
  'concept.hashtag.help':
    'Finds posts with the given hashtag. Do not include #.',
  'concept.period.label': 'Date range',
  'concept.period.help':
    'Filters by post date. You can set just one side.',
  'concept.mediaOnly.label': 'With image or video only',
  'concept.mediaOnly.help': 'Keeps only posts that include an image or video.',
  'concept.liveOnly.label': 'Live streams only',
  'concept.liveOnly.help': 'On YouTube, keeps only live streams (live and their archives).',
  'concept.fourK.label': '4K videos only',
  'concept.fourK.help': 'On YouTube, keeps only 4K-resolution videos.',
  'concept.hdOnly.label': 'HD videos only',
  'concept.hdOnly.help': 'On YouTube, keeps only HD-resolution videos.',
  'concept.captionsOnly.label': 'Captioned videos only',
  'concept.captionsOnly.help': 'On YouTube, keeps only videos with closed captions.',
  'concept.creativeCommons.label': 'Creative Commons only',
  'concept.creativeCommons.help':
    'On YouTube, keeps only videos under a Creative Commons license (reuse allowed under conditions).',
  'concept.threeSixty.label': '360° videos only',
  'concept.threeSixty.help': 'On YouTube, keeps only 360° videos.',
  'concept.vr180.label': 'VR180 videos only',
  'concept.vr180.help': 'On YouTube, keeps only VR180-format videos.',
  'concept.threeD.label': '3D videos only',
  'concept.threeD.help': 'On YouTube, keeps only 3D videos.',
  'concept.hdr.label': 'HDR videos only',
  'concept.hdr.help': 'On YouTube, keeps only HDR (high dynamic range) videos.',
  'concept.locationOnly.label': 'Videos with location only',
  'concept.locationOnly.help':
    'On YouTube, keeps only videos tagged with a filming location. Combine with a place name.',
  'concept.purchased.label': 'Purchased videos only',
  'concept.purchased.help': 'On YouTube, keeps only movies/shows you have purchased.',
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
  'concept.minReplies.label': 'Minimum replies',
  'concept.minReplies.placeholder': 'e.g. 10',
  'concept.minReplies.help':
    'Keeps only posts with at least the given number of replies.',
  'concept.language.label': 'Post language',
  'concept.language.none': 'Any',
  'concept.language.ja': 'Japanese',
  'concept.language.en': 'English',
  'concept.language.zh': 'Chinese',
  'concept.language.ko': 'Korean',
  'concept.language.es': 'Spanish',
  'concept.language.fr': 'French',
  'concept.language.de': 'German',
  'concept.language.pt': 'Portuguese',
  'concept.language.ru': 'Russian',
  'concept.language.it': 'Italian',
  'concept.language.ar': 'Arabic',
  'concept.language.hi': 'Hindi',
  'concept.language.th': 'Thai',
  'concept.language.id': 'Indonesian',
  'concept.language.help':
    'Filters by the language the post is written in (X and Bluesky only).',
  'concept.workType.label': 'Work type',
  'concept.workType.none': 'Any',
  'concept.workType.illust': 'Illustration',
  'concept.workType.manga': 'Manga',
  'concept.workType.ugoira': 'Animation (ugoira)',
  'concept.workType.novel': 'Novel',
  'concept.workType.help': 'Choose the work type: illustration, manga, ugoira, or novel.',
  'concept.genre.label': 'Genre',
  'concept.genre.none': 'Any',
  'concept.genre.music_sound': 'Music & sound',
  'concept.genre.game': 'Gaming',
  'concept.genre.animal': 'Animals',
  'concept.genre.entertainment': 'Entertainment',
  'concept.genre.anime': 'Anime',
  'concept.genre.dance': 'Dance',
  'concept.genre.technology_craft': 'Tech & craft',
  'concept.genre.commentary_lecture': 'Commentary & lectures',
  'concept.genre.cooking': 'Cooking',
  'concept.genre.sports': 'Sports',
  'concept.genre.radio': 'Radio',
  'concept.genre.vehicle': 'Vehicles',
  'concept.genre.traveling_outdoor': 'Travel & outdoors',
  'concept.genre.nature': 'Nature',
  'concept.genre.society_politics_news': 'Society, politics & news',
  'concept.genre.r18': 'Adult content',
  'concept.genre.other': 'Other',
  'concept.genre.help': 'Filters videos by genre (niconico only).',
  'concept.resultType.label': 'Result type',
  'concept.resultType.none': 'Any',
  'concept.resultType.video': 'Videos',
  'concept.resultType.short': 'Shorts',
  'concept.resultType.channel': 'Channels',
  'concept.resultType.playlist': 'Playlists',
  'concept.resultType.posts': 'Posts',
  'concept.resultType.communities': 'Communities',
  'concept.resultType.comments': 'Comments',
  'concept.resultType.media': 'Media',
  'concept.resultType.people': 'Profiles',
  'concept.resultType.board': 'Boards',
  'concept.resultType.bangumi': 'Anime series',
  'concept.resultType.pgc': 'Movies & shows',
  'concept.resultType.live': 'Live streams',
  'concept.resultType.article': 'Articles',
  'concept.resultType.help':
    'Chooses what kind of result to look for. Video sites (YouTube, Twitch) offer videos, channels, and so on; Reddit offers posts, communities, comments, and so on. Which types are available depends on the site.',
  'concept.sortOrder.label': 'Sort order',
  'concept.sortOrder.new': 'Newest',
  'concept.sortOrder.top': 'Popular',
  'concept.sortOrder.hot': 'Trending',
  'concept.sortOrder.comments': 'Comment count',
  'concept.sortOrder.danmaku': 'Danmaku count',
  'concept.sortOrder.favorites': 'Favorite count',
  'concept.sortOrder.likes': 'Like count',
  'concept.sortOrder.auto': 'Default',
  'concept.sortOrder.help':
    "Sets the result order. \"Default\" keeps each site's own ordering (usually relevance-based).",
  'concept.pixivPopular.label': 'Popularity',
  'concept.pixivPopular.none': 'Any',
  'concept.pixivPopular.100': '100+ bookmarks',
  'concept.pixivPopular.1000': '1,000+ bookmarks',
  'concept.pixivPopular.10000': '10,000+ bookmarks',
  'concept.pixivPopular.help':
    'On pixiv, finds only popular works that reached a given bookmark count — a pseudo “popular” sort without Premium (uses the “N users入り” tags).',
  'concept.ageRating.label': 'Age rating',
  'concept.ageRating.none': 'Any',
  'concept.ageRating.safe': 'All ages only',
  'concept.ageRating.r18': 'R-18 only',
  'concept.ageRating.help': 'On pixiv, keeps only all-ages works, or only R-18 works.',
  'concept.excludeAi.label': 'Exclude AI-generated',
  'concept.excludeAi.help': 'On pixiv, removes AI-generated works from the results.',

  // Site filter in the picker, and the supported-sites label on bars
  'builder.filter.label': 'Show conditions a site supports',
  'builder.filter.help':
    'Shows only the conditions the chosen site supports. This changes what is listed, not which sites you search.',
  'builder.filter.all': 'All',
  'builder.support.label': 'Sites',

  // Notes shared across platforms
  'note.loose.and': 'Some results may contain only some of your words.',
  'note.loose.exact':
    'Exact phrase does not work; it is searched as ordinary keywords.',
  'note.exact.unreliable':
    'Searches for the exact phrase, but some results may have the words scattered apart.',
  'note.tagPage.combined':
    'When combined with other conditions, it is searched as an ordinary keyword.',
  'note.nosort': 'Sort order cannot be set.',
  'note.videoOnly': 'This site is video-only, so this filter is unnecessary.',
  'note.imageOnly':
    'This site is image/illustration-only, so this filter is unnecessary.',

  // Per-platform notes
  'note.x.period':
    'You cannot search by date alone. Combine it with a keyword.',
  'note.x.listInvalid':
    'Couldn’t read the List from that input. Paste the URL of the List’s page.',
  'note.niconico.videoLength':
    '“Medium (4–20 min)” cannot be set and is ignored.',
  'note.bluesky.fromUser': 'The username is in the form “user.bsky.social”.',
  'note.bluesky.mediaOnly': 'Bluesky has no way to filter by image/video.',
  'note.youtube.exactPhrase':
    'Searches for the exact phrase, but many results may have the words scattered apart.',
  'note.youtube.exclude': 'Words you exclude may still appear in the results.',
  'note.youtube.fromUser': 'Opens the in-channel search page.',
  'note.youtube.hashtag': 'Searched as an ordinary keyword.',
  'note.youtube.mediaOnly':
    'YouTube is video-only, so this filter is unnecessary.',
  'note.youtube.sort':
    'Popular is approximated by view count. Newest currently no longer works on YouTube.',
  'note.youtube.channelConflict':
    'This filter has no effect when combined with a user filter (in-channel search).',
  'note.note.keywords':
    'Some articles may contain only some of your words.',
  'note.note.exactPhrase':
    'Exact phrase does not work; it is searched as ordinary keywords.',
  'note.note.exclude': 'note has no exclusion search.',
  'note.note.fromUser': 'The username is the part after @.',
  'note.note.hashtag':
    'When combined with other conditions, it is searched as an ordinary keyword.',
  'note.note.period': 'note has no date filter.',
  'note.note.mediaOnly': 'note has no way to filter by image/video.',

  // Additional platform-specific notes
  'note.reddit.hashtag': 'Reddit has no hashtag system.',
  'note.reddit.period': 'Filtered roughly by “past day / week / month / year”.',
  'note.reddit.untilOnly':
    'Reddit cannot filter by an end date alone (a start date is required).',
  'note.reddit.mediaOnly':
    'This filter is not available. Choosing “Media” under Result type gets close.',
  'note.instagram.hashtag':
    'Tag pages show only top posts (no latest order).',
  'note.instagram.multiTag':
    'With two or more hashtags this becomes a loose search rather than a tag page, and some results may include only some of the tags.',
  'note.pixiv.keywords':
    'Searches by tags. Words not in the tags won’t be found even if they’re in the body.',
  'note.pixiv.titleOnly':
    'Searches titles and descriptions, not tags.',
  'note.pixiv.fromUser': 'pixiv search has no user filter.',
  'note.pixiv.sort': 'Popular order works only for pixiv Premium members.',
  'note.pixiv.popular':
    'Filters to popular works via the “N users入り” tags. These are added by fans by hand, so some popular works may be missed.',
  'note.pixiv.r18Login':
    'Showing R-18 works requires being logged in to pixiv (they won’t appear when logged out).',
  'note.pixiv.smodeConflict':
    'pixiv allows only one match target, so another mode (title only / exact tag) takes priority and this condition is not sent.',
  'note.misskey.keywords':
    'Finds posts that contain all your words. On the page that opens, press the “Search” button to see results.',
  'note.misskey.exactPhrase':
    'Exact phrase matching isn’t available; it’s treated as separate words that must all appear (AND).',
  'note.misskey.fromUser': 'Requires combining with a keyword.',
  'note.youtube.resultType': 'It cannot be combined with a user filter.',
  'note.hatebu.minLikes':
    'The number you set is used as the minimum bookmark count.',
  'note.hatebu.titleTagConflict':
    'When searching by hashtag alone, the title-only filter has no effect.',
  'note.hatebu.fromUser':
    'Keyword search within a user’s bookmarks requires a Hatena login, so it is not supported.',
  'note.twitch.resultType': 'Twitch can only search videos and channels.',
  'note.sortOrder.otherSite': 'This sort order is not available on this site.',
  'note.resultType.otherSite': 'This type is not available on this site.',
  'note.fivech.keywords':
    'Only thread titles are searched. Opens the thread-title search service (ff5ch.syoboi.jp).',
  'note.fivech.titleOnly':
    '5ch search always targets thread titles only (regardless of this setting).',
  'note.fivech.subreddit':
    'Filters by board name (e.g. sony). Set several to match any of those boards.',
  'note.animanch.keywords':
    'Searches post bodies (an experimental feature, so some may be missed).',
  'note.animanch.titleOnly':
    'Searches only thread titles across the full archive.',
  'note.seiga.workType': 'Niconico Seiga can only search illustrations and manga.',
  'note.seiga.mangaSort': "Sort order can't be set when searching manga.",
  'note.tumblr.tagSort': "Sort order can't be set when searching by hashtag alone (results are by popularity).",
  'note.mastodon.keywords':
    'Only covers posts your logged-in instance knows about (your own posts, people you follow, and posts it has seen through federation).',
  'note.exclude.literal':
    "The exclusion sign (-) has no effect; it's treated as a literal part of the search term.",
  'note.fanbox.hashtagOnly':
    'Only works when exactly one hashtag is given. Keywords and other conditions are not supported.',
  'note.bilibili.videoLength':
    'Length buckets differ slightly (short = under 10 min, medium = 10–30 min, long = over 60 min).',
  'note.bilibili.tabSort': "This sort order isn't available for the selected result type.",
  'note.bilibili.tabOnly': 'Only available when the result type is videos (or unspecified).',

  // Launch panel. {name} is filled with the site name
  'launch.search': 'Search {name}',
  'launch.bgHint':
    'Middle-click or Ctrl/⌘-click to open several sites in background tabs.',
  'launch.approxHeading': 'Partially works',
  'launch.droppedHeading': 'Not available',
  'launch.specialtyHeading': 'Only on other sites',
  'launch.specialtyOnly': '{name} only',

  // Launch-card translation preview (effective conditions as readable labels). {v} is the value
  'sum.exclude': 'excluding {v}',
  'sum.from': 'from {v}',
  'sum.to': 'to {v}',
  'sum.excludeUser': 'excluding {v}',
  'sum.mentions': 'mentioning {v}',
  'sum.community': 'in {v}',
  'sum.domain': 'links to {v}',
  'sum.xList': 'in a List',
  'sum.minLikes': '{v}+ likes',
  'sum.minReposts': '{v}+ reposts',
  'sum.minReplies': '{v}+ replies',
  'sum.since': 'since {v}',
  'sum.until': 'until {v}',
  'sum.between': '{a}–{b}',

  // Site group headings on the launch screen
  'group.sns': 'SNS',
  'group.video': 'Video',
  'group.image': 'Illustration & Images',
  'group.text': 'Blogs & Forums',

  // Two-screen snap layout
  'ui.addCondition': 'Add a condition',
  'ui.clearConditions': 'Clear all',
  'ui.copyLink': 'Copy URL',
  'ui.copyLinkDone': 'Copied',
  'ui.copyLinkHint': 'Copies a URL containing all your current conditions. Bookmark or share it to reopen the same search on another device or browser.',
  'ui.save': 'Save',
  'ui.removeCondition': 'Remove this condition',
  'ui.scrollToLinks': 'Scroll to open the searches',
  'ui.scrollToConditions': 'Scroll back to conditions',
  'ui.enterToAdd': 'to add',
  'ui.loginRequired': 'Sign-in required',
  'ui.notSearchable': 'Not searchable with these conditions',

  // Saved searches (named, localStorage)
  'saved.open': 'Saved searches',
  'saved.title': 'Saved searches',
  'saved.close': 'Close',
  'saved.hint': 'Saved searches stay on this device and browser. They are lost if you clear history or site data, or open a different browser, device, or private window. To carry a search across devices, use “Copy URL” on the condition bar to share the URL.',
  'saved.empty': 'No saved searches yet. Build a search and press Save to keep it here.',
  'saved.restore': 'Load this search',
  'saved.delete': 'Delete',
  'saved.save.title': 'Save this search',
  'saved.save.nameLabel': 'Name',
  'saved.save.namePlaceholder': 'Name this search',
  'saved.save.confirm': 'Save',
  'saved.save.cancel': 'Cancel',

  'support.full': 'Full support',
  'support.partial': 'Partial support',
  'picker.title': 'Add a condition',
  'picker.search.placeholder': 'Search conditions (e.g. buzz, quality, replies)',
  'picker.search.empty': 'No matching conditions',
  'picker.search.didYouMean': 'Did you mean',
  'picker.category.label': 'Filter by category',
  'cat.word': 'Words',
  'cat.person': 'People & communities',
  'cat.popular': 'Popularity',
  'cat.media': 'Media & format',
  'cat.time': 'Time & order',
  'cat.age': 'Age & origin',
  'cat.lang': 'Language',
  'picker.related.heading': 'Related conditions',
  'picker.related.addAll': 'Add all',
  'family.reaction': 'Filter by reactions',
  'family.mention': 'Replies & mentions',
  'cal.clear': 'Clear',
  'cal.pickDate': 'Pick a date',

  // Footer
  'footer.privacy':
    'Your conditions are never sent to a server — search URLs are built entirely in your browser.',
}
