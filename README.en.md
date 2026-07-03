# Cross-SNS Search

**English** · [日本語](README.md)

Build a search in a form, and it is translated into each site's own search syntax (its "dialect") and opened as an operator-rich search URL in a new tab. It lets people who don't remember search operators make full use of each site's search. The UI is available in English and Japanese (toggle at the top right).

https://apricot-cake.github.io/dialect/

## How to use

1. Enter conditions such as keywords under "Enter conditions". Conditions are listed in order of how many sites support them, with the supporting sites' count shown at the right of each row.
2. Press a site's button to open that site's real search results — translated from your conditions — in a new tab (two columns on desktop, tab switching on mobile).

It never fetches or displays results itself. It only opens each site's own real search-results page.

## Features

- **Condition builder** — Specify around 20 conditions (exact phrase, exclusion, user, hashtag, date range, media filter, minimum likes, and more) from a form, without knowing any operator syntax.
- **Enter-separated multiple words** — Keywords can be split with Enter to set several, finding posts that contain all of them (AND). A phrase with spaces (e.g. "React Aria") is kept as one unit and translated into each site's syntax (quotes, etc.). Fields that allow multiple values (exclusion, hashtags, etc.) work the same way.
- **Filter by site** — "Filter by site" narrows the list to just the conditions a given site supports.
- **Clear support status** — Conditions a site can't handle are automatically dropped on launch, and what is "not available / partially works" is always shown above the button. Buttons never become unclickable.
- **Google fallback** — For sites where exclusion, date range, etc. don't work, a launch button offers Google's `site:` search (in-site search) as an alternative.
- **Share & save** — Assembled conditions can be shared as a URL (permalink) and saved with history in the browser (localStorage).

## Supported sites

| | Search page | Login | Operator support |
|---|---|---|---|
| X | `x.com/search` | Required | Rich (all unofficial) |
| Bluesky | `bsky.app/search` | Not required | Rich (officially documented) |
| Threads | `threads.com/search` | Required | Newest / user only |
| Instagram | `instagram.com/explore/search` | Required | Keywords only |
| Facebook | `facebook.com/search/top` | Required | Keywords only |
| YouTube | `youtube.com/results` | Not required | Date, exclusion, sort, video length, etc. |
| niconico | `nicovideo.jp/search` | Not required | Rich (arbitrary date, exclusion, sort) |
| note | `note.com/search` | Not required | User / sort only |
| TikTok | `tiktok.com/search` | Not required | Keywords only |
| Reddit | `reddit.com/search` | Not required | Rich (official Boolean operators) |
| pixiv | `pixiv.net/tags` | Not required | OR, exclusion, date, sort, illustration/manga (tag search) |
| Misskey.io | `misskey.io/search` | Required | Keywords / user only |
| Mastodon (mstdn.jp) | `mstdn.jp/tags` | Not required | Hashtag only (v4.3 can't take a URL with a search term) |
| Hatena Bookmark | `b.hatena.ne.jp/search` | Not required | Rich (exclusion, date, bookmark count, sort, title/tag) |
| Twitch | `twitch.tv/search` | Not required | Keywords, videos/channels toggle only |
| 5channel | `ff5ch.syoboi.jp` (thread-title search) | Not required | Exclusion, board (official search's AND doesn't work, so an external search is used) |
| Animanch BBS | `bbs.animanch.com/searchRes` | Not required | Keywords only (body / archived-title toggle) |
| Niconico Seiga | `seiga.nicovideo.jp/search` | Not required | Exclusion, sort, illustration/manga toggle |

The only bar for adding a site is "a search URL with a keyword can be opened." Even with thin operator support, there is value in not having to retype the query on each site.

## How it works

- A fully static SPA. No backend, API keys, or external-service dependencies whatsoever.
- All searching is "open an operator-rich deep link." Because it fetches no data, it does not run into any site's terms or rate limits.
- Operator support and translation rules are based on the research in [docs/operator-research.md](docs/operator-research.md) (as of 2026-07).
- The procedure and records for verifying unofficial operators are in [docs/operator-checklist.md](docs/operator-checklist.md).

## Development

```bash
npm install
npm run dev      # dev server
npm run build    # type check + build
npm run lint     # oxlint
```

Stack: Vite + React + TypeScript + Tailwind CSS v4 + shadcn/ui. Pushing to `main` auto-deploys to GitHub Pages via GitHub Actions.

### Code layout

- `src/core/types.ts` — types for search concepts (ConceptId) and platform definitions
- `src/core/platforms/*.ts` — each platform's support table (translation dictionary) and URL serializer
- `src/core/resolve.ts` — sorts conditions into applied / approximated / unsupported
- `src/core/google.ts` — rules for generating the Google fallback (site: search)
- `src/core/permalink.ts` — conversion between conditions and URL parameters (the share/save format)
- `src/i18n/` — all UI strings (Japanese `ja.ts` / English `en.ts`; toggle at the top right, choice saved in localStorage)

## Note

Because search syntax relies on each site's unofficial behavior, it may stop working without notice. If you find an operator that no longer works, please let us know in an Issue.

## License

[MIT](LICENSE)
