# Dialect

**English** · [日本語](README.md)

Assemble your conditions, and each is translated into every site's own search syntax (its "dialect") and opened as an operator-rich search URL in a new tab. It lets people who don't remember search operators make full use of each site's search. The UI is available in English and Japanese (toggle at the top right).

https://apricot-cake.github.io/dialect/

## How to use

1. Add conditions such as keywords, date range, or user from "Add a condition". Conditions are listed in order of how many sites support them, and you can see which sites support each one.
2. Scroll (or use the button at the bottom) to the "Open on each site" screen, then press a site's button to open that site's real search results — translated from your conditions — in a new tab.

It never fetches or displays results itself. It only opens each site's own real search-results page.

## Features

- **Condition builder** — Specify around 20 conditions (exact phrase, exclusion, user, hashtag, date range, media filter, minimum likes, post language, and more) from a form, without knowing any operator syntax.
- **Enter-separated multiple words** — Keywords can be split with Enter to set several, finding posts that contain all of them (AND). A phrase with spaces (e.g. "React Aria") is kept as one unit and translated into each site's syntax (quotes, etc.). Fields that allow multiple values (exclusion, hashtags, etc.) work the same way.
- **Filter conditions by site** — When adding a condition, narrow the list to just the conditions a given site supports (this changes what is listed, not which sites you search).
- **Clear support status** — Conditions a site can't handle are automatically dropped on launch, and what is "not available / partially works" is shown above the button. Buttons never become unclickable.
- **Share via URL** — Assembled conditions are reflected in the URL, so bookmarking or sharing the browser URL reopens the same conditions.
- **Dark mode / English & Japanese** — Toggle the theme and display language from the buttons at the top right.

## Supported sites

| | Search page | Login | Operator support |
|---|---|---|---|
| X | `x.com/search` | Required | Rich (all unofficial) |
| Bluesky | `bsky.app/search` | Not required | Rich (officially documented) |
| Instagram | `instagram.com/explore/search` | Required | Keywords only |
| YouTube | `youtube.com/results` | Not required | Date, exclusion, sort, video length, etc. |
| niconico | `nicovideo.jp/search` | Not required | Rich (arbitrary date, exclusion, sort) |
| note | `note.com/search` | Not required | User / sort only |
| Reddit | `reddit.com/search` | Not required | Rich (official Boolean operators) |
| pixiv | `pixiv.net/tags` | Not required | OR, exclusion, date, sort, illustration/manga (tag search) |
| Misskey.io | `misskey.io/search` | Required | Keywords / user only |
| Hatena Bookmark | `b.hatena.ne.jp/search` | Not required | Rich (exclusion, date, bookmark count, sort, title/tag) |
| Twitch | `twitch.tv/search` | Not required | Keywords, videos/channels toggle only |
| 5channel | `ff5ch.syoboi.jp` (thread-title search) | Not required | Exclusion, board (official search's AND doesn't work, so an external search is used) |
| Animanch BBS | `bbs.animanch.com/searchRes` | Not required | Keywords only (body / archived-title toggle) |

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

Stack: Vite + React + TypeScript + Tailwind CSS v4 + Base UI + Motion. Pushing to `main` auto-deploys to GitHub Pages via GitHub Actions.

### Code layout

- `src/core/types.ts` — types for search concepts (ConceptId) and platform definitions
- `src/core/platforms/*.ts` — each platform's support table (translation dictionary) and URL serializer
- `src/core/resolve.ts` — sorts conditions into applied / approximated / unsupported
- `src/core/permalink.ts` — conversion between conditions and URL parameters (the share/bookmark format)
- `src/components/` — UI for the two screens (conditions / open on each site) and the add-condition modal
- `src/i18n/` — all UI strings (Japanese `ja.ts` / English `en.ts`; toggle at the top right, choice saved in localStorage)

## Note

Because search syntax relies on each site's unofficial behavior, it may stop working without notice. If you find an operator that no longer works, please let us know in an Issue.

## License

[MIT](LICENSE)
