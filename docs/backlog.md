# バックログ

未着手のタスク。着手したら消す。

## 指定可能フィールドの網羅調査(ultracode)

対応済み18サイトそれぞれについて、「検索URL(クエリパラメータ・パス)で指定できるフィールド」を多エージェントのワークフロー(ultracode)で網羅的に洗い出す。既存の調査(docs/operator-research.md)は概念側からの調査(この条件は指定できるか)なので、逆方向(サイト側に何のパラメータがあるか)を総当たりして、取りこぼしている概念を発見するのが目的。

- 期待する発見の例: pixivの `s_mode`(タグ完全一致/タイトル・キャプション検索)、Redditの `self:`/`nsfw:`、はてブの `safe=`、YouTubeのShorts sp値、ニコニコの `l_range` 以外の絞り込み、など
- 各サイト1エージェントで「検索フォームのHTML・フロントエンドのルーター定義・公式ヘルプ・スクレイパー実装」の4方向から調査し、発見したパラメータは実測(未ログインHTTP)で裏取りする
- 発見結果は operator-research.md に追記し、概念化の価値があるものは types.ts の ConceptId 追加候補として一覧にする
- 起動方法: このリポジトリで「ultracode」キーワードつきで依頼する

## セキュリティ監査(ultracode)

完全静的SPA(バックエンドなし・データ取得なし・localStorageのみ)という前提で、多エージェントのワークフロー(ultracode)でセキュリティ観点を網羅的に監査する。攻撃面は狭いが、それでも見るべき点を各エージェントに割り当てて洗い出す。

- **URL生成・注入**: 各 `src/core/platforms/*.ts` の `buildUrl` で、ユーザー入力(キーワード・ユーザー名・タグ・板ID等)が適切にエンコードされ、`javascript:` 等の危険なスキームや意図しないパラメータ注入を生まないか。`encodeURIComponent` 漏れ・`URLSearchParams` 迂回の有無
- **パーマリンク/保存の入力検証**: `permalink.ts`・`storage.ts` で、外部から与えられた `?param=`・localStorageの汚染JSONを読み込む際の型検証とフォールバックが安全か(壊れた/悪意ある入力でクラッシュやXSSにならないか)
- **タブ起動のリスク**: `window.open(url, '_blank', 'noopener,noreferrer')` の noopener 徹底、`resolution.url` が null/不正なときの扱い、reverse tabnabbing
- **DOMレンダリング**: React経由で `dangerouslySetInnerHTML` 等の危険なパターンがないか(現状なしのはずだが確認)。ツールチップ・要約・サマリに入るユーザー文字列のエスケープ
- **依存関係**: `npm audit` と、simple-icons等の依存の既知脆弱性・サプライチェーン観点
- **GitHub Actions/Pages**: デプロイワークフローの権限(`permissions:`)過剰付与、シークレット漏れ、`pull_request_target` 等の危険トリガーの有無
- 各観点1エージェントで調査し、発見は深刻度つきで一覧化。誤検知を避けるため、指摘は該当コード箇所+再現条件を添えて敵対的に検証する
- 起動方法: このリポジトリで「ultracode」キーワードつきで依頼する(`/security-review` スキルの単発版より広く、複数エージェントで観点を分担する想定)
