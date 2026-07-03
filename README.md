# Dialect

検索条件を日本語のフォームで組み立てると、Dialect が各SNSの検索構文(方言)に翻訳して、演算子付きの検索URLをタブで開くツールです。検索演算子を覚えていない人でも、SNSの検索を使いこなせるようにします。

https://apricot-cake.github.io/dialect/

## 使い方

1. 「検索条件」でキーワードを入力する。「条件を追加」から完全一致・除外・期間・ユーザー指定などの条件を足せる
2. 「検索する」に並ぶサイトのボタンを押すと、条件を翻訳した検索結果ページが新しいタブで開く

検索結果の取得や表示は行いません。各サイトの本物の検索結果ページを開くだけです。

## 主な機能

- **条件ビルダー** — 完全一致・除外・ユーザー指定・ハッシュタグ・期間・メディア絞り込み・最低いいね数など約20種類の条件を、演算子構文を知らなくてもフォームで指定できる
- **「または」の条件セット** — 条件セットを複数並べると「どれかに当てはまる」検索になる(1セット=1タブ)
- **対応状況の明示** — サイトごとに対応できない条件は自動で外して起動し、何が「使えない/一部だけ効く」かをボタンの上に常時表示する。ボタンが押せなくなることはない
- **Googleフォールバック** — 除外や期間指定などが効かないサイトでは、Googleの `site:` 検索(サイト内検索)で代替する起動ボタンを提示する
- **共有・保存** — 組み立てた条件はURL(パーマリンク)として共有でき、ブラウザ内(localStorage)に保存・履歴も残せる
- **使うサイトの選択** — 表示するサイトはON/OFFでき、選択は記憶される

## 対応サイト

| | 検索ページ | ログイン | 演算子対応 |
|---|---|---|---|
| X | `x.com/search` | 必要 | 豊富(全て非公式) |
| Bluesky | `bsky.app/search` | 不要 | 豊富(公式ドキュメントあり) |
| Threads | `threads.com/search` | 必要 | 新着順・ユーザー指定のみ |
| Instagram | `instagram.com/explore/search` | 必要 | キーワードのみ |
| Facebook | `facebook.com/search/top` | 必要 | キーワードのみ |
| YouTube | `youtube.com/results` | 不要 | 期間・除外・並び順・動画の長さなど |
| niconico | `nicovideo.jp/search` | 不要 | 豊富(任意期間・除外・並び順) |
| note | `note.com/search` | 不要 | ユーザー指定・並び順のみ |
| TikTok | `tiktok.com/search` | 不要 | キーワードのみ |
| Reddit | `reddit.com/search` | 不要 | 豊富(公式Boolean演算子) |
| pixiv | `pixiv.net/tags` | 不要 | OR・除外・期間・並び順(タグ検索) |
| Misskey.io | `misskey.io/search` | 必要 | キーワード・ユーザー指定のみ |

サイト追加の基準は「キーワード入りの検索URLが開けること」だけです。演算子対応が薄くても、各サイトで打ち直さずに済むことに価値があるためです。

## 仕組み

- 完全静的なSPA。バックエンド・APIキー・外部サービスへの依存は一切なし
- 検索はすべて「演算子付きディープリンクを開く」方式。データ取得を行わないため、各SNSの規約・レート制限に抵触しない
- 演算子の対応可否と翻訳ルールは [docs/operator-research.md](docs/operator-research.md) の調査に基づく(2026-07時点)
- 非公式演算子の動作確認手順と記録は [docs/operator-checklist.md](docs/operator-checklist.md)

## 開発

```bash
npm install
npm run dev      # 開発サーバー
npm run build    # 型チェック + ビルド
npm run lint     # oxlint
```

スタック: Vite + React + TypeScript + Tailwind CSS v4 + shadcn/ui。main への push で GitHub Actions が GitHub Pages に自動デプロイします。

### コード構成

- `src/core/types.ts` — 検索概念(ConceptId)とプラットフォーム定義の型
- `src/core/platforms/*.ts` — プラットフォームごとの対応表(翻訳辞書)とURLシリアライザ
- `src/core/resolve.ts` — 条件セットを適用/近似/非対応に仕分け
- `src/core/google.ts` — Googleフォールバック(site:検索)の生成規則
- `src/core/permalink.ts` — 条件セットとURLパラメータの相互変換(共有・保存の形式)
- `src/i18n/ja.ts` — 全UI文言(表示は日本語のみ、文言はここに集約)

## 注意

検索構文は各SNSの非公式な仕様に基づくため、予告なく動かなくなることがあります。動作しない演算子を見つけたら Issue で教えてください。

## License

[MIT](LICENSE)
