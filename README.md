# Dialect

**検索のことばは、SNSごとに違う。**

検索条件を日本語のフォームで組み立てると、Dialect が各SNSの検索構文(方言)に翻訳して、演算子付きの検索URLをタブで開くツールです。検索演算子を覚えていない人でも、SNSの検索を使いこなせるようにします。

https://apricot-cake.github.io/dialect/

## 対応プラットフォーム

| | 検索ページ | ログイン |
|---|---|---|
| X | `x.com/search` | 必要 |
| Bluesky | `bsky.app/search` | 不要 |
| YouTube | `youtube.com/results` | 不要 |
| note | `note.com/search` | 不要 |

各プラットフォームの演算子対応状況は組み立て中にリアルタイムで表示されます(緑=対応 / 黄=一部対応 / 灰=非対応)。非対応の条件は起動時に自動で外され、何が外れるかは事前に明示されます。

## 仕組み

- 完全静的なSPA。バックエンド・APIキー・外部サービスへの依存は一切なし
- 検索はすべて「演算子付きディープリンクを開く」方式。データ取得を行わないため、各SNSの規約・レート制限に抵触しない
- 演算子の対応可否と翻訳ルールは [docs/operator-research.md](docs/operator-research.md) の調査に基づく(2026-07時点)

## 開発

```bash
npm install
npm run dev      # 開発サーバー
npm run build    # 型チェック + ビルド
npm run lint     # oxlint
```

スタック: Vite + React + TypeScript + Tailwind CSS v4 + shadcn/ui

### コード構成

- `src/core/types.ts` — 検索概念(ConceptId)とプラットフォーム定義の型
- `src/core/platforms/*.ts` — プラットフォームごとの対応表(翻訳辞書)とURLシリアライザ
- `src/core/resolve.ts` — 条件セットを適用/近似/非対応に仕分け
- `src/i18n/ja.ts` — 全UI文言(表示は日本語のみ、文言はここに集約)

## 注意

検索構文は各SNSの非公式な仕様に基づくため、予告なく動かなくなることがあります。動作しない演算子を見つけたら Issue で教えてください。

## License

[MIT](LICENSE)
