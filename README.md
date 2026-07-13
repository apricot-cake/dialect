# Dialect

**English** · [日本語](README.ja.md)

Assemble your conditions, and each is translated into every site's own search syntax (its "dialect") and opened as an operator-rich search URL in a new tab. It lets people who don't remember search operators make full use of each site's search. The UI is available in English and Japanese (toggle at the top right).

https://apricot-cake.github.io/dialect/

![Dialect demo: building keywords and conditions, then opening each site's search](docs/demo.gif)

## How to use

1. Add conditions such as keywords, date range, or user from "Add a condition". Conditions are listed in order of how many sites support them, and you can see which sites support each one.
2. Scroll (or use the button at the bottom) to the "Open on each site" screen, then press a site's button to open that site's real search results — translated from your conditions — in a new tab.

It never fetches or displays results itself. It only opens each site's own real search-results page.

## Features

- **Condition builder** — Specify around 20 conditions (exact phrase, exclusion, user, hashtag, date range, media filter, minimum likes, post language, and more) from a form, without knowing any operator syntax.
- **Enter-separated multiple words** — Keywords can be split with Enter to set several, finding posts that contain all of them (AND). A phrase with spaces (e.g. "React Aria") is kept as one unit and translated into each site's syntax (quotes, etc.). Fields that allow multiple values (exclusion, hashtags, etc.) work the same way.
- **Filter conditions by site** — When adding a condition, narrow the list to just the conditions a given site supports (this changes what is listed, not which sites you search).
- **Clear support status** — Conditions a site can't handle are automatically dropped on launch, and what is "not available / partially works" is shown above the button. Buttons never become unclickable.
- **Google fallback for conditions a site can't handle** — When a dropped condition is one Google's own search can express, a "Similar search on Google" link (`site:` restricted to that platform) appears next to the button, as a workaround rather than a dead end.
- **See the URL being opened** — Hover over a site's button to see the full search URL it will open. Each condition and the URL fragment it produced share the same color, which also makes it a way to learn each site's raw operators.
- **Share via URL** — Assembled conditions are reflected in the URL, so bookmarking or sharing the browser URL reopens the same conditions.
- **Load a search URL (reverse translation)** — Paste a search page URL from any supported site into "Load URL" and it is translated back into conditions, so a search built on one site can be carried to another. Anything that can't be read is shown, not silently dropped.
- **Open all at once** — One "Open all" button on the "open on each site" screen opens every selected site in its own new tab. Sites to open are chosen with checkboxes, and the selection is remembered on this device. If your browser blocks the pop-ups, a prompt tells you to allow them.
- **Dark mode / English & Japanese** — Toggle the theme and display language from the buttons at the top right.

## Supported sites

|                | Search page                    | Login        | Operator support                                                                                                                |
| -------------- | ------------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| X              | `x.com/search`                 | Required     | Rich (all unofficial), scoped OR                                                                                                |
| Bluesky        | `bsky.app/search`              | Required     | Rich (officially documented, plus advanced-filter parameters: multi-value author/mention/hashtag OR, video-only, reply filters) |
| Instagram      | `instagram.com/explore/search` | Required     | Keywords only                                                                                                                   |
| YouTube        | `youtube.com/results`          | Not required | Date, exclusion, sort, scoped OR, etc.                                                                                          |
| niconico       | `nicovideo.jp/search`          | Not required | Rich (arbitrary date, exclusion, sort, genre, video source, scoped OR)                                                          |
| pixiv          | `pixiv.net/tags`               | Not required | Exclusion, date, sort, illustration/manga (tag search), scoped OR                                                               |
| Niconico Seiga | `seiga.nicovideo.jp/search`    | Not required | Exclusion, exact phrase, sort, illustration/manga switch, scoped OR                                                             |
| Misskey.io     | `misskey.io/search`            | Required     | Keywords / user only                                                                                                            |
| Tumblr         | `tumblr.com/search`            | Not required | Rich (exclusion, sender, date, exact phrase, multiple tags, post type, sort)                                                    |
| Mastodon       | `mastodon.social/search`       | Required     | Rich (exclusion, exact phrase, sender, date, reply exclusion, language, media)                                                  |
| FANBOX         | `fanbox.cc/tags`               | Not required | Single hashtag only (no full-text search, sort, exclusion, etc.)                                                                |
| bilibili       | `search.bilibili.com`          | Not required | Rich (arbitrary date, tab switch, danmaku/favorite-count sorts)                                                                 |
| Fantia         | `fantia.jp/posts`              | Required     | Category, audience section, title/body toggle, sort (exclusion/exact phrase not supported)                                      |
| Google         | `google.com/search`            | Not required | Rich (verbatim mode, arbitrary date, scoped OR, result type)                                                                    |

Sites are chosen on one axis: they search a **stream of user posts** (fandom and creative-work searching is the primary use case). Impressions, works, and discussions flow past daily, and a shared vocabulary — author, tag, date, reactions — translates across them (how much of that vocabulary each site shares may vary). Reference works you "look up" (encyclopedias), product catalogs filtered by price and stock (e-commerce), and self-contained ecosystems like code search don't share that vocabulary and are out of scope. Google is the one exception, kept as an escape hatch: a site: fallback that rescues dropped conditions, plus a window onto the whole web. The technical bar is only "a search URL with a keyword can be opened": even with thin operator support, there is value in not having to retype the query on each site.

## How it works

- A fully static SPA. No backend, API keys, or external-service dependencies whatsoever.
- All searching is "open an operator-rich deep link." Because it fetches no data, it does not run into any site's terms or rate limits.
- Operator support and translation rules are based on the research in [docs/operator-research.md](docs/operator-research.md) (as of 2026-07).
- The procedure and records for verifying unofficial operators are in [docs/operator-checklist.md](docs/operator-checklist.md).

## Development

This is an npm workspaces monorepo: `packages/core` is the framework-agnostic translation engine (published as [`@apricot-cake/dialect-core`](packages/core/README.md)), `apps/web` is the React app that ships to GitHub Pages.

```bash
npm install
npm run dev      # dev server
npm run build    # build packages/core, then apps/web
npm run lint     # oxlint (repo-wide)
```

Stack: Vite + React + TypeScript + Tailwind CSS v4 + Base UI + Motion. Pushing to `main` auto-deploys to GitHub Pages via GitHub Actions.

### Code layout

- `packages/core/src/types.ts` — types for search concepts (ConceptId) and platform definitions
- `packages/core/src/platforms/*.ts` — each platform's support table (translation dictionary) and URL serializer
- `packages/core/src/resolve.ts` — sorts conditions into applied / approximated / unsupported
- `packages/core/src/permalink.ts` — conversion between conditions and URL parameters (the share/bookmark format)
- `packages/core/src/{ja,en}.ts` — all UI strings, keyed by message id (the translation engine's own note text plus the app's UI copy)
- `apps/web/src/components/` — UI for the two screens (conditions / open on each site) and the add-condition modal
- `apps/web/src/i18n/` — current-language state (toggle at the top right, choice saved in localStorage) built on top of `packages/core`'s dictionaries

## Note

Because search syntax relies on each site's unofficial behavior, it may stop working without notice. If you find an operator that no longer works, please let us know in an Issue.

## License

[MIT](LICENSE)
