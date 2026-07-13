# @apricot-cake/dialect-core

[dialect](https://github.com/apricot-cake/dialect) の翻訳エンジン本体。サイト非依存の検索条件(`QueryState`)を、pixiv・X・Bluesky・YouTube など対応各サイトの検索ディープリンクへ変換する。UIもブラウザAPIも持たず、ボット・ブラウザ拡張・MCPサーバーなど任意のNode/JS消費者から使える。

まだ安定版はリリースしていない。以下のAPIは `main` ブランチ時点のもので、1.0までは互換性を保証せず変更されうる。

## インストール

```bash
npm install @apricot-cake/dialect-core
```

## 使い方

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

- `defaultState()` — 空の `QueryState`
- `resolve(platform, state)` — 指定条件に対するプラットフォームの対応可否を適用/近似/非対応へ仕分け、結果のURLを組み立てる
- `buildUrl`(各プラットフォームの `PlatformDef` 経由) — `resolve` が呼ぶ低レベルのURLシリアライザ
- `parseSearchUrl(url)` / `reverse` — 逆方向。サイトの検索URLを `QueryState` へ解析する
- `searchSummary(lang, state)` / `translationParts(lang, resolution, state)` — 条件の読みやすい要約(カードのプレビュー・保存名の既定値に使用)
- `PLATFORMS` — 対応する全 `PlatformDef` の配列
- `CONCEPT_DEFS` / `CONCEPT_MAP` / `SELECT_OPTIONS` / `SORT_OPTIONS` — 概念(フィールド)カタログとその選択肢
- `searchConcepts(lang, query)` — 概念カタログのあいまい検索(アプリの条件追加ピッカーが使用)
- `translate(lang, key)` / `ja` / `en` — メッセージ辞書(メッセージID キー、対応2言語)

すべての named export はパッケージルートにある(`import { ... } from '@apricot-cake/dialect-core'`)。サブパスAPIはない。

## アプリ側に残るもの

`packages/core` は純粋なドメイン層。`localStorage`・DOM・「現在言語」という周辺状態に依存するもの(保存検索・履歴・言語切替)は [`apps/web`](../../apps/web) アプリ側に残る。このライブラリは常に言語を明示引数として受け取る。
