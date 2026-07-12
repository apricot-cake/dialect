---
name: operator-check
description: >-
  dialect が各サイトへ送る検索演算子・URLパラメータの定期動作確認を回すための手順。
  非公式(undocumented)な演算子は予告なく壊れるため、docs/operator-checklist.md を上から
  検証して確認日を更新する。ユーザーが「演算子確認」「定期確認」「operator check」
  「チェックリストを回して」「演算子が壊れてないか見て」「3か月ごとの確認」などを求めたら、
  また特定サイトで「検索が効かない/おかしい」と報告されたら、必ずこのスキルを使うこと。
  冒頭で「コードが送る演算子」と「チェックリストの行」を突き合わせ、未収録の壊れやすい
  演算子がないかも検出する。dialect リポジトリ内の作業限定。
---

# 演算子の定期動作確認（dialect）

dialect は結果を持たず「各サイトの検索ページを演算子付きで開くランチャー」なので、**各サイトの検索URLに演算子が効き続けること**がプロダクト価値の生命線。非公式演算子（min_faves、YouTube sp=、niconico order= 等）は公式フォームから消えたり仕様変更で予告なく死ぬため、定期的に実挙動を確認する。

- **確認対象データ**: [docs/operator-checklist.md](../../../docs/operator-checklist.md)（何を・どのURLで・期待結果・最終確認日）
- **調査の経緯・出典**: [docs/operator-research.md](../../../docs/operator-research.md)
- **頻度**: 3か月ごとが目安。加えて「動かない」報告があったら該当項目を即確認する

以下の4フェーズで回す。**フェーズ0（照合）→ フェーズ1（検証）→ フェーズ2（反映）→ フェーズ3（コミット）**。

---

## フェーズ0: 照合（新しい/未収録の壊れやすい演算子を検出）

**なぜ必要か**: コードに演算子を足したとき、チェックリストへの行追加を忘れると、その演算子だけ定期確認をすり抜ける（実際 2026-07-05 に pixiv「人気の目安」と X `filter:links`/`-from:`、2026-07-06 に niconico `genre=`・pixiv 完全一致/うごく/小説が漏れていた）。毎回の冒頭で「コードが送るもの」と「チェックリストが見るもの」のドリフトを潰す。

**この照合は機械化済み**。まず走らせる:

```
npm run check:operators
```

（[scripts/check-operators.ts](../../../scripts/check-operators.ts)。ネットワーク不要・決定論的で、CIのマージゲートにも入っている）。出力の見方:

- **🟥 チェックリスト未収録**: コードが送るのに operator-checklist.md の該当サイト節に行が無い演算子。フェーズ1で実測 → フェーズ2で行を足す（未検証の期待結果は書かない）。公式で安定な演算子（`sort=新着/人気` など）で意図的に載せない判断をしたものは、スクリプトの `PROBES` で `tracked: false` にして理由を残す（判断に迷えばユーザーに確認）。
- **🟥 自己検証NG**: `buildUrl` の出力が `PROBES` の宣言とズレている（演算子の綴りやパラメータをコードで変えた）。`scripts/check-operators.ts` の該当 probe を実態に合わせる。
- **🟨 未登録の演算子**: `buildUrl` が出しているのに `PROBES` に無いキー。新しい演算子を足したのに probe を書き忘れた合図。probe を1件足す（tracked 既定 true なら未収録として次に挙がる）。

スクリプトが緑なら、コードとチェックリストの「収録漏れ」は無い。**壊れやすさ（非公式か・仕様変更で死ぬか）の判定と、実際に生きているかの確認はフェーズ1以降の仕事**（スクリプトはあくまで収録の有無だけを見る）。

> 予防側の原則: 演算子を新規追加するコミットには、対応するチェックリスト行と `PROBES` の probe を同じコミットで足すのが本来。フェーズ0（＝CIの check:operators）はその漏れを拾う保険。

---

## フェーズ1: 検証（手段を仕分けて実挙動を確認）

全サイトをブラウザで開くのは過剰。サーバーレンダリングのHTML/JSONは `curl`+grep の方が速く、「全スレタイに両語を含む」等を機械的に確定判定できる。SPA/要ログイン/目視判定のサイトだけブラウザに回す。

### 手段の仕分け

- **curl+grep で足りる**（サーバーレンダリング/JSON）: はてブ、ff5ch、find.5ch.io（JSON API）、あにまん `/searchRes/`
- **ブラウザ必須**（SPA/要ログイン/目視判定）: X、Misskey、Instagram、Bluesky、Twitch、YouTube（視聴回数順は目視）、pixiv、Google（要ログインで consent 回避）、あにまん `/search2/`（Cloudflareで503）、そして **note / niconico**（SSRに見えるが検索結果はクライアント描画→curlはガワのみ。要注意）

### ブラウザ群の回し方

サブエージェント（general-purpose）が使えるなら、ブラウザ群を **5前後のグループに分けて並列起動**する。各エージェントへの指示テンプレ:

- ブラウザツールを1回の ToolSearch でまとめ読み（`select:...tabs_context_mcp,navigate,computer,read_page,get_page_text,browser_batch`）
- `tabs_context_mcp{createIfEmpty:true}` → `tabs_create_mcp` で**自分専用タブ**を作り、他タブに触れない
- 各URLを navigate → screenshot / get_page_text で期待と照合 → `対象 | 判定(✅/❌/⚠️) | 根拠1行` の markdown 表で返す
- **安全厳守**: 閲覧のみ。ログイン/送信/フォロー/CAPTCHA は一切しない。ログイン壁/CAPTCHAで不能なら ⚠️ を返す
- ログインが要るのは X・Misskey・Instagram（ブラウザのセッション共有なので、事前に人間がログインしておく）

サブエージェントが使えない環境では、自分で順に navigate → screenshot して同じ表を作る。

### curl 群の回し方

エージェントUAで 403/503 を回避しつつ一括取得 → Grep で判定（保存先はスクラッチパッド）:

```
curl -sS -L --compressed -m40 \
  -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36" \
  -H "Accept-Language: ja" \
  -o out.txt -w "%{http_code}\t%{size_download}\n" "<encoded URL>"
```

判定は Grep で対象語・件数・日付を数える。

### 落とし穴

- **復活チェック行**（YouTube `sp=CAI%3D`、find.5ch.io の公式AND）は「現状の期待＝まだ直っていない」。直っていたら報告し、直っていれば送信再開＋UI注記を戻す。
- **YouTube 視聴回数順（CAM系）は近似ソート**で厳密な全順序ではない（低再生が上位に混じることがある）。「厳密降順」を期待しない。
- **niconico/note はSSRに見えて結果はクライアント描画**。curl はガワしか取れないのでブラウザで見る。
- 検証URLのキーワード（台風・天気など）は時事性がある。結果が少なすぎたら適当な頻出語に読み替えてよい。ユーザー名（`-from:` 等）も同様に読み替え可。

---

## フェーズ2: 反映（チェックリストとコードを実態に合わせる）

1. **チェックリスト更新**: docs/operator-checklist.md の各行の「最終確認」を当日日付に、変化した「結果」列も更新する。フェーズ0で見つけた未収録の演算子は、実測できたものだけ行を追加する（優先度・検証URL・期待結果・最終確認・結果を埋める）。
2. **挙動が変わっていたら実装も直す**:
   - `src/core/platforms/*.ts` の `support` レベル（full/partial/none）と、必要なら `dynamicSupport`
   - `src/i18n/ja.ts` / `en.ts` の注記（noteKey）。ja/en は型で対キー強制されるので両方直す
   - 経緯を docs/operator-research.md に追記
3. **方針判断が要る発見はバックログへ**。「support から削るか注記化するか」など、機能をどう見せるかの判断はユーザーに確認してから（[dialect-backlog] のメモリ経由）。勝手に決めない。1メッセージ1論点で聞く。
4. **チェックリスト末尾の「確認履歴」に1行**、当日やったことを残す。
5. **サイト別ガイド(sites/\*.html)の手書き解説を追従**: 確認したサイトに `src/pages/siteGuides/<platformId>.ts` があれば、記述が現状と一致するか確認し、一致していれば各セクションの `checkedAt` を当日日付に更新する（一致していなければ内容も直す）。ガイドが無いサイトは対象外(段階方式のため未着手のまま)。

---

## フェーズ3: 検証してコミット

コードを触った場合は必ず通す（触っていなければ 3-1 は省略可）:

1. `npm run lint`（oxlint）
2. `npm run build`（`tsc -b` の型チェック込み）
3. `npm run check:urls`（実物 buildUrl の出力URLの到達性。404/400/5xx の構造的な壊れを検知。ログイン/JS サイトの結果表示可否までは分からない＝⚠️は要ブラウザ）

通ったら区切りごとに commit & push（main 直 push 運用。ユーザー確認は不要）。コミットメッセージは日本語で簡潔に。

---

## メモ

- このスキルは非公開メモリ `~/.claude/projects/.../memory/operator-check-flow.md` の運用手順をプロジェクトに移したもの。以後の手順更新はこのファイルを正とする。
- 「対応サイトを増やす」ときの URL 採取は別作業（実地採取が第一）。効く演算子が判明したら、実装と同時にこのチェックリストへ行を足す（フェーズ0の予防側）。
