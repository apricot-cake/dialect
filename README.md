# SNSまとめて検索

**日本語** ・ [English](README.en.md)

検索条件をフォームで組み立てると、各SNSの検索構文(方言)に翻訳して、演算子付きの検索URLをタブで開くツールです。検索演算子を覚えていない人でも、SNSの検索を使いこなせるようにします。UIは日本語・英語に対応(右上のボタンで切替)。

https://apricot-cake.github.io/dialect/

## 使い方

1. 「条件を入力」でキーワードなどの条件を入力する。条件は対応サイト数の多い順に全て並んでいて、各条件の右端に対応サイトのアイコンが表示される
2. サイトのボタンを押すと、条件を翻訳した検索結果ページが新しいタブで開く(PCは2カラム、スマホはタブ切り替え)

検索結果の取得や表示は行いません。各サイトの本物の検索結果ページを開くだけです。

## 主な機能

- **条件ビルダー** — 完全一致・除外・ユーザー指定・ハッシュタグ・期間・メディア絞り込み・最低いいね数など約20種類の条件を、演算子構文を知らなくてもフォームで指定できる
- **Enter区切りの複数ワード** — キーワードはEnterで区切って複数指定でき、すべて含む投稿を探す(AND)。スペースを含む語句(例: React Aria)は分割されず、ひとまとまりのまま各サイトの構文(引用符など)に翻訳される。除外・ハッシュタグなど複数指定できる項目も同じ操作
- **サイトで絞る** — 「条件を使えるサイトで絞る」で、特定のサイトが使える条件だけを表示できる
- **対応状況の明示** — サイトごとに対応できない条件は自動で外して起動し、何が「使えない/一部だけ効く」かをボタンの上に常時表示する。ボタンが押せなくなることはない
- **Googleフォールバック** — 除外や期間指定などが効かないサイトでは、Googleの `site:` 検索(サイト内検索)で代替する起動ボタンを提示する
- **共有・保存** — 組み立てた条件はURL(パーマリンク)として共有でき、ブラウザ内(localStorage)に保存・履歴も残せる

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
| pixiv | `pixiv.net/tags` | 不要 | OR・除外・期間・並び順・イラスト/マンガ(タグ検索) |
| Misskey.io | `misskey.io/search` | 必要 | キーワード・ユーザー指定のみ |
| Mastodon (mstdn.jp) | `mstdn.jp/tags` | 不要 | ハッシュタグのみ(検索語入りURLは v4.3系が非対応) |
| はてなブックマーク | `b.hatena.ne.jp/search` | 不要 | 豊富(除外・期間・ブクマ数・並び順・タイトル/タグ) |
| Twitch | `twitch.tv/search` | 不要 | キーワード・動画/チャンネル切替のみ |
| 5ちゃんねる | `ff5ch.syoboi.jp`(スレタイ検索) | 不要 | 除外・板指定(公式検索はANDが効かないため外部検索を使用) |
| あにまん掲示板 | `bbs.animanch.com/searchRes` | 不要 | キーワードのみ(本文/過去ログタイトル切替) |
| ニコニコ静画 | `seiga.nicovideo.jp/search` | 不要 | 除外・並び順・イラスト/マンガ切替 |

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
- `src/core/resolve.ts` — 検索条件を適用/近似/非対応に仕分け
- `src/core/google.ts` — Googleフォールバック(site:検索)の生成規則
- `src/core/permalink.ts` — 検索条件とURLパラメータの相互変換(共有・保存の形式)
- `src/i18n/` — 全UI文言(日本語 `ja.ts` / 英語 `en.ts`。右上のボタンで切替、選択は localStorage に保存)

## 注意

検索構文は各SNSの非公式な仕様に基づくため、予告なく動かなくなることがあります。動作しない演算子を見つけたら Issue で教えてください。

## License

[MIT](LICENSE)
