# @apricot-cake/dialect-core

The translation engine behind [dialect](https://github.com/apricot-cake/dialect): converts a site-agnostic search condition (`QueryState`) into deep-link search URLs for pixiv, X, Bluesky, YouTube, and the other sites dialect supports. No UI, no browser APIs — usable from a bot, a browser extension, an MCP server, or any other Node/JS consumer.

This package has no stable release yet; the API below reflects the current `main` branch and may change without a major version bump until 1.0.

## Install

```bash
npm install @apricot-cake/dialect-core
```

## Usage

```ts
import { defaultState, resolve, PLATFORMS, searchSummary } from '@apricot-cake/dialect-core'

const state = { ...defaultState(), keywords: 'ミク' }

for (const platform of PLATFORMS) {
  const resolution = resolve(platform, state)
  console.log(platform.id, resolution.url)
}

console.log(searchSummary('ja', state)) // => "ミク"
```

## API

- `defaultState()` — an empty `QueryState`
- `resolve(platform, state)` — sorts a platform's support for the given condition into applied / approximated / unsupported, and builds the resulting URL
- `buildUrl` (per-platform, via each platform's `PlatformDef`) — the low-level URL serializer `resolve` calls
- `parseSearchUrl(url)` / `reverse` — the inverse: parse a site's search URL back into a `QueryState`
- `searchSummary(lang, state)` / `translationParts(lang, resolution, state)` — human-readable summaries of a condition, used for card previews and default names
- `PLATFORMS` — the array of all supported `PlatformDef`s
- `CONCEPT_DEFS` / `CONCEPT_MAP` / `SELECT_OPTIONS` / `SORT_OPTIONS` — the concept (field) catalog and its select-option choices
- `searchConcepts(lang, query)` — fuzzy search over the concept catalog (used by the app's condition picker)
- `translate(lang, key)` / `ja` / `en` — the message dictionary, keyed by message id, in both supported languages

All named exports live at the package root (`import { ... } from '@apricot-cake/dialect-core'`) — there is no subpath API.

## What stays in the app

`packages/core` is the pure domain layer. Anything that touches `localStorage`, the DOM, or an ambient "current language" (saved searches, history, the language toggle) lives in the [`apps/web`](../../apps/web) app instead — this library only ever takes a language as an explicit argument.
