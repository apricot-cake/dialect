# 演算子の定期動作確認チェックリスト

Dialect が送信する検索演算子・URLパラメータの動作確認手順。非公式(undocumented)な演算子は予告なく死ぬため、定期的にこのリストを上から実行して確認日を更新する。調査の経緯・出典は [operator-research.md](operator-research.md) を参照。

## 運用ルール

- **頻度**: 3か月ごとを目安。加えて「動かない」というユーザー報告があったときは該当項目を即確認する
- **確認方法**: 「検証URL」をブラウザで開き、「期待する結果」と見比べるだけ。API・ツールは不要
- **記録**: 確認したら「最終確認」列の日付を更新する。挙動が変わっていたら ✅→❌ に変え、該当プラットフォームの `src/core/platforms/*.ts` の support レベル・注記(`src/i18n/ja.ts`)を直し、[operator-research.md](operator-research.md) に経緯を追記する
- **優先度**: 表は上ほど壊れやすい(非公式・公式フォーム削除済み・未文書化)。時間がなければ「優先」欄が「高」の行だけでも確認する
- 検証URLのキーワード(台風・天気など)は時事性があるため、結果が少なすぎる場合は適当な頻出語に読み替えてよい
- **確認手段の使い分け**: はてブ・ff5ch・find.5ch.io・あにまんはサーバーレンダリングのHTML/JSONなので `curl`+grep でも確定判定できる(速い)。X・Misskey・Instagram・Bluesky・Twitch・YouTube・pixiv・note・niconico はクライアント描画のSPA(要ログインを含む)で、curlはガワしか取れないためブラウザで開く

## X(要ログイン)

全演算子が非公式。特に min_faves 系と blue_verified は公式の検索フォームから削除済みで、削除リスクが最も高い。

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 高 | `min_faves:` | 最低いいね数 | [x.com/search?q=台風 min_faves:500&f=live](https://x.com/search?q=%E5%8F%B0%E9%A2%A8%20min_faves%3A500&f=live) | 全結果が500いいね以上 | 2026-07-04 | ✅ |
| 高 | `min_retweets:` | 最低リポスト数 | [x.com/search?q=台風 min_retweets:500&f=live](https://x.com/search?q=%E5%8F%B0%E9%A2%A8%20min_retweets%3A500&f=live) | 全結果が500リポスト以上 | 2026-07-04 | ✅ |
| 高 | `filter:blue_verified` | 認証済みアカウントだけ | [x.com/search?q=台風 filter:blue_verified&f=live](https://x.com/search?q=%E5%8F%B0%E9%A2%A8%20filter%3Ablue_verified&f=live) | 全結果が認証済み(青バッジ) | 2026-07-04 | ✅ |
| 中 | `since:`/`until:` | 期間 | [x.com/search?q=台風 since:2026-06-01 until:2026-06-08&f=live](https://x.com/search?q=%E5%8F%B0%E9%A2%A8%20since%3A2026-06-01%20until%3A2026-06-08&f=live) | 全結果が期間内(untilの日は含まない。境界はUTC基準なのでJST表示だとuntil当日まで見える) | 2026-07-04 | ✅ |
| 中 | `filter:media` | 画像・動画つきだけ | [x.com/search?q=台風 filter:media&f=live](https://x.com/search?q=%E5%8F%B0%E9%A2%A8%20filter%3Amedia&f=live) | 全結果にメディアつき | 2026-07-04 | ✅ |
| 中 | `-filter:replies` | リプライを除く | [x.com/search?q=台風 -filter:replies&f=live](https://x.com/search?q=%E5%8F%B0%E9%A2%A8%20-filter%3Areplies&f=live) | 結果にリプライが混ざらない(引用ポストは別) | 2026-07-04 | ✅ |
| 低 | `from:` / `to:` / `-語` / `"..."` / `lang:ja` / `f=live` | ユーザー指定・除外ほか | [x.com/search?q="計画運休" -広告 lang:ja&f=live](https://x.com/search?q=%22%E8%A8%88%E7%94%BB%E9%81%8B%E4%BC%91%22%20-%E5%BA%83%E5%91%8A%20lang%3Aja&f=live) | 完全一致・除外・日本語絞りが効き「最新」タブで開く | 2026-07-04 | ✅ |
| 中 | `url:<ドメイン>`(2026-07-04追加) | このサイトへのリンクを含む | [x.com/search?q=台風 url:nhk.or.jp&f=live](https://x.com/search?q=%E5%8F%B0%E9%A2%A8%20url%3Anhk.or.jp&f=live) | 全結果が nhk.or.jp へのリンクを含む。2026-07-04ログイン済みブラウザで実測(結果本文に www2.nhk.or.jp リンク) | 2026-07-04 | ✅ |
| 中 | `filter:links`(リンク付き)(2026-07-05追加) | リンク付きだけ | [x.com/search?q=天気 filter:links&f=live](https://x.com/search?q=%E5%A4%A9%E6%B0%97%20filter%3Alinks&f=live) | 全結果がリンク(URLカード等)を含む。2026-07-05ログイン済みブラウザ実測 | 2026-07-05 | ✅ |
| 低 | `-from:<ユーザー>`(除外ユーザー)(2026-07-05追加) | 除外するユーザー | [x.com/search?q=天気 filter:links -from:zooaqua_5&f=live](https://x.com/search?q=%E5%A4%A9%E6%B0%97%20filter%3Alinks%20-from%3Azooaqua_5&f=live) | 指定ユーザーの投稿が結果から消える(from:の否定。ユーザー名は適宜読み替え)。2026-07-05実測(除外前に先頭だったアカウントが消えた) | 2026-07-05 | ✅ |

## Bluesky(ログイン不要)

演算子は公式ドキュメントがある(唯一)。除外と tab= だけが未文書化。

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 高 | `-語`(未文書化) | 除外するキーワード | [bsky.app/search?q=天気 -雨](https://bsky.app/search?q=%E5%A4%A9%E6%B0%97%20-%E9%9B%A8) | 結果に単語「雨」を含む投稿がない(「梅雨」は別トークンなので残ってよい) | 2026-07-04 | ✅ |
| 高 | `tab=latest`(未文書化) | 並び順=新しい順 | [bsky.app/search?q=天気&tab=latest](https://bsky.app/search?q=%E5%A4%A9%E6%B0%97&tab=latest) | 「最新」タブが選択された状態で開く | 2026-07-04 | ✅ |
| 低 | `from:` / `mentions:` / `domain:` / `since:`/`until:` / `lang:`(公式) | ユーザー指定ほか | [bsky.app/search?q=天気 lang:ja since:2026-06-01](https://bsky.app/search?q=%E5%A4%A9%E6%B0%97%20lang%3Aja%20since%3A2026-06-01) | 日本語のみ・期間内のみ | 2026-07-04 | ✅ |

## YouTube(ログイン不要)

sp= はprotobufの計算値。2026-01の検索フィルタ再編以降、値が個別に無効化されることがある(CAI系で実例あり)。視聴回数順(CAM系)は近似ソートで、厳密な全順序は保証されない。

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 高 | `after:` / `before:` | 期間 | [youtube.com/results?search_query=紫陽花 after:2026-06-25](https://www.youtube.com/results?search_query=%E7%B4%AB%E9%99%BD%E8%8A%B1%20after%3A2026-06-25) | 全結果が指定日以降の投稿 | 2026-07-04 | ✅ |
| 高 | `sp=CAM%3D`(視聴回数順) | 並び順=人気順 | [youtube.com/results?search_query=紫陽花&sp=CAM%3D](https://www.youtube.com/results?search_query=%E7%B4%AB%E9%99%BD%E8%8A%B1&sp=CAM%3D) | 視聴回数のおおむね降順(近似ソート。厳密な全順序ではなく低再生の動画が上位に混じることがある) | 2026-07-04 | ✅ |
| 高 | `sp=CAMSAhgB`(視聴回数順+4分未満) | 人気順+動画の長さ | [youtube.com/results?search_query=猫&sp=CAMSAhgB](https://www.youtube.com/results?search_query=%E7%8C%AB&sp=CAMSAhgB) | 全結果が4分未満、かつおおむね視聴回数降順(近似) | 2026-07-04 | ✅ |
| 高 | `sp=CAI%3D`(アップロード日順)**復活チェック** | 並び順=新しい順 | [youtube.com/results?search_query=台風&sp=CAI%3D](https://www.youtube.com/results?search_query=%E5%8F%B0%E9%A2%A8&sp=CAI%3D) | 現状は**効かない**(関連度に古い投稿が混在)。時系列に並ぶようになったら復活→UI注記 `note.youtube.sort` を修正 | 2026-07-04 | ❌(送信は継続) |
| 中 | `-語` | 除外するキーワード | [youtube.com/results?search_query=猫 -犬](https://www.youtube.com/results?search_query=%E7%8C%AB%20-%E7%8A%AC) | タイトル・概要にリテラル「犬」を含む動画が上位に出ない(もともと信頼度中。「ハスキー」等の犬関連語は残る) | 2026-07-04 | ✅ |
| 中 | `intitle:` | タイトルだけで探す | [youtube.com/results?search_query=intitle:紫陽花](https://www.youtube.com/results?search_query=intitle%3A%E7%B4%AB%E9%99%BD%E8%8A%B1) | 全結果のタイトルに「紫陽花」を含む | 2026-07-04 | ✅ |
| 中 | `sp=EgIYAQ%3D%3D`(4分未満、長さ単独) | 動画の長さ | [youtube.com/results?search_query=猫&sp=EgIYAQ%3D%3D](https://www.youtube.com/results?search_query=%E7%8C%AB&sp=EgIYAQ%3D%3D) | 全結果が4分未満 | 2026-07-04 | ✅ |
| 低 | 引用符(効かないことの確認) | 完全一致 | [youtube.com/results?search_query="冷蔵庫で富士山を冷やす"](https://www.youtube.com/results?search_query=%22%E5%86%B7%E8%94%B5%E5%BA%AB%E3%81%A7%E5%AF%8C%E5%A3%AB%E5%B1%B1%E3%82%92%E5%86%B7%E3%82%84%E3%81%99%22) | 存在しないフレーズでも通常検索の結果が返る=引用符は実質無視(UI注記の根拠)。厳密に効くようになったら注記を緩める | 2026-07-04 | ❌(注記済み) |
| 低 | チャンネル内検索URL | このユーザーの投稿だけ | [youtube.com/@NHK/search?query=台風](https://www.youtube.com/@NHK/search?query=%E5%8F%B0%E9%A2%A8) | チャンネル内の検索結果ページが開く | 2026-07-04 | ✅ |

## note(ログイン不要)

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 中 | `from:@noteID`(公式) | このユーザーの投稿だけ | [note.com/search?context=note&q=from:@info&sort=new](https://note.com/search?context=note&q=from%3A%40info&sort=new) | note公式アカウントの記事だけが並ぶ | 2026-07-04 | ✅ |
| 中 | `sort=new` | 並び順=新しい順 | [note.com/search?context=note&q=台風&sort=new](https://note.com/search?context=note&q=%E5%8F%B0%E9%A2%A8&sort=new) | 新着順で並ぶ | 2026-07-04 | ✅ |
| 中 | `sort=hot`(急上昇)(2026-07-04追加) | 並び順=急上昇 | [note.com/search?context=note&q=猫&sort=hot](https://note.com/search?context=note&q=%E7%8C%AB&sort=hot) | 「急上昇」タブが選択され急上昇の記事が並ぶ。2026-07-04ブラウザ実測 | 2026-07-04 | ✅ |
| 低 | ハッシュタグページ | ハッシュタグ | [note.com/hashtag/読書記録](https://note.com/hashtag/%E8%AA%AD%E6%9B%B8%E8%A8%98%E9%8C%B2) | タグの記事一覧が開く(コンテスト系タグは/contestへ転送されるが記事一覧は表示される) | 2026-07-04 | ✅ |

## niconico(ログイン不要)

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 中 | `start=`/`end=`(任意期間) | 期間 | [nicovideo.jp/search/台風?start=2026-06-01&end=2026-06-30&sort=f&order=d](https://www.nicovideo.jp/search/%E5%8F%B0%E9%A2%A8?start=2026-06-01&end=2026-06-30&sort=f&order=d) | 全結果が6月の投稿・新着順 | 2026-07-04 | ✅ |
| 中 | OR並置文法(括弧なし) | どれかを含む指定 | [nicovideo.jp/search/猫 OR 犬 手芸](https://www.nicovideo.jp/search/%E7%8C%AB%20OR%20%E7%8A%AC%20%E6%89%8B%E8%8A%B8) | (猫 OR 犬) AND 手芸 として絞り込まれる(件数が「猫 手芸」+「犬 手芸」程度) | 2026-07-04 | ✅ |
| 中 | `sort=h`(人気順) | 並び順=人気順 | [nicovideo.jp/search/台風?sort=h](https://www.nicovideo.jp/search/%E5%8F%B0%E9%A2%A8?sort=h) | 注目度順で並ぶ | 2026-07-04 | ✅ |
| 低 | タグページ+除外 | ハッシュタグ・除外 | [nicovideo.jp/tag/ゲーム -実況](https://www.nicovideo.jp/tag/%E3%82%B2%E3%83%BC%E3%83%A0%20-%E5%AE%9F%E6%B3%81) | タグ一致かつ「実況」を除外した一覧(タイトル内の実況は別トークン扱いで残る) | 2026-07-04 | ✅ |
| 低 | `/tag/`ページで並び順・期間・長さ(2026-07-05追加) | ハッシュタグ単独時の並び順・期間・動画の長さ | [nicovideo.jp/tag/ゲーム?sort=h&start=2015-01-01&end=2015-12-31&l_range=2](https://www.nicovideo.jp/tag/%E3%82%B2%E3%83%BC%E3%83%A0?sort=h&start=2015-01-01&end=2015-12-31&l_range=2) | タグ検索でも sort/start/end/l_range が /search/ と同様に効く(「ニコニコで人気」順・全件2015年・全件20分超に絞られる)。2026-07-05ブラウザ実測。個別も確認済: `sort=f&order=d`=投稿日時順で最新先頭・`l_range=1`=5分未満 | 2026-07-05 | ✅ |

## Reddit(ログイン不要)

Boolean演算子は公式仕様のため壊れにくい。old.reddit.com は2026年8月からログイン必須化予定だが Dialect は使っていない。

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 中 | `AND` / `NOT (...)` | キーワード・除外 | [reddit.com/search/?q=typhoon AND japan NOT (anime)](https://www.reddit.com/search/?q=typhoon%20AND%20japan%20NOT%20%28anime%29) | 両語を含み anime を含まない | 2026-07-04 | ✅ |
| 中 | `author:` / `subreddit:` | ユーザー指定・コミュニティ | [reddit.com/search/?q=subreddit:japan typhoon](https://www.reddit.com/search/?q=subreddit%3Ajapan%20typhoon) | r/japan 内の結果のみ | 2026-07-04 | ✅ |
| 低 | `sort=new` / `t=week` | 並び順・期間の丸め | [reddit.com/search/?q=typhoon&sort=new&t=week](https://www.reddit.com/search/?q=typhoon&sort=new&t=week) | 新着順・1週間以内 | 2026-07-04 | ✅ |
| 低 | `self:no` **復活チェック**(現状は効かないので送っていない) | リンクを含む投稿だけ | [reddit.com/search/?q=typhoon AND self:yes](https://www.reddit.com/search/?q=typhoon%20AND%20self%3Ayes) | 現状は `self:` が無視される(self:yes でも画像投稿が並び self:no と結果同一。2026-07-04実測)。テキスト投稿だけに絞れるようになったら linksOnly を復活 | 2026-07-04 | ❌(送信しない) |

## Instagram(URL存続チェックのみ)

演算子がほぼないため、検索URL自体が生きているかだけ確認する。

| 優先 | 対象 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|
| 中 | Instagram 検索URL | [instagram.com/explore/search/keyword/?q=台風](https://www.instagram.com/explore/search/keyword/?q=%E5%8F%B0%E9%A2%A8) | ログイン済みなら検索結果へ(未ログインはログイン画面=仕様) | 2026-07-04 | ✅ |

## pixiv(ログイン不要)

OR・除外は公式ヘルプ記載のため壊れにくい。期間(scd=/ecd=)は非公式。`order=date_d`(新着=既定)を scd=/ecd= と併用するとpixivがエラーページを返すため、Dialectは新着時に order を送らない(2026-07-04修正、[pixiv.ts](../src/core/platforms/pixiv.ts))。

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 高 | `scd=`/`ecd=`(任意期間) | 期間 | [pixiv.net/tags/猫/artworks?scd=2026-06-01&ecd=2026-06-30](https://www.pixiv.net/tags/%E7%8C%AB/artworks?scd=2026-06-01&ecd=2026-06-30) | 全結果が6月の投稿(scd/ecd単体は有効・1,243件。`order=date_d`併用はエラーになるため送信しない) | 2026-07-04 | ✅ |
| 中 | `order=popular_d`(人気順) | 並び順=人気順 | [pixiv.net/tags/猫/artworks?order=popular_d](https://www.pixiv.net/tags/%E7%8C%AB/artworks?order=popular_d) | プレミアム会員なら人気順(非会員は新着のまま=注記済み) | 2026-07-04 | ✅ |
| 低 | `OR` / `-語`(公式) | どれかを含む・除外 | [pixiv.net/tags/(猫 OR 犬) -腐向け/artworks](https://www.pixiv.net/tags/(%E7%8C%AB%20OR%20%E7%8A%AC)%20-%E8%85%90%E5%90%91%E3%81%91/artworks) | 猫か犬のタグを含み「腐向け」を除外 | 2026-07-04 | ✅ |
| 低 | `s_mode=s_tc`(2026-07-04追加) | タイトルだけで探す | [pixiv.net/tags/猫/artworks?s_mode=s_tc](https://www.pixiv.net/tags/%E7%8C%AB/artworks?s_mode=s_tc) | 「タイトル・キャプション」検索として結果が出る(pixivは内部で s_mode=tc に正規化)。2026-07-04ブラウザ実測 | 2026-07-04 | ✅ |
| 中 | `{N}users入り`タグ(擬似人気順、2026-07-05追加) | 人気の目安 | [pixiv.net/tags/風景 10000users入り/artworks](https://www.pixiv.net/tags/%E9%A2%A8%E6%99%AF%2010000users%E5%85%A5%E3%82%8A/artworks) | キーワードと「{N}users入り」タグ(一定ブクマ数でファンが付与)の複合検索で人気作に絞る(プレミアム限定 order=popular_d 不要)。**タグ実在に依存=ファン付与が廃れると機能不全**(漏れも仕様)。2026-07-05ブラウザ実測(#風景#10000users入りで人気作が並ぶ) | 2026-07-05 | ✅ |

## Misskey.io(要ログイン)

検索URL(`/search?q=...&type=note`)はクエリ欄を埋めるだけで**検索が自動実行されない**(ページ上の「検索」ボタンのクリックが必要)。URL遷移=結果表示にならないため、ディープリンクとしては機能不全。Dialect側の扱いは要検討。タグ単独ページ(`/tags/`)は自動表示されるので影響なし。

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 高 | `username=`(非公式) | このユーザーの投稿だけ | [misskey.io/search?q=天気&type=note&username=syuilo](https://misskey.io/search?q=%E5%A4%A9%E6%B0%97&type=note&username=syuilo) | ユーザー入力欄は正しく埋まる(「ユーザー指定」ON)が、検索が自動実行されず結果は出ない(要「検索」クリック) | 2026-07-04 | ⚠️ |
| 中 | 検索URL | キーワード | [misskey.io/search?q=台風&type=note](https://misskey.io/search?q=%E5%8F%B0%E9%A2%A8&type=note) | URL遷移ではクエリ欄が埋まるだけで結果は自動表示されない(要「検索」クリック) | 2026-07-04 | ❌ |
| 低 | タグページ | ハッシュタグ | [misskey.io/tags/天気](https://misskey.io/tags/%E5%A4%A9%E6%B0%97) | タグのノート一覧が開く | 2026-07-04 | ✅ |
| 中 | `-語`除外 / `"..."`フレーズ(2026-07-04追加) | 除外・完全一致 | [misskey.io/search?q=猫 -犬&type=note](https://misskey.io/search?q=%E7%8C%AB%20-%E7%8A%AC&type=note) | 「検索」ボタン押下後、猫を含み犬を含まない結果。2026-07-04ログイン済みブラウザで暫定確認(q欄に反映・実行→猫のみ・犬なし。厳密な対比は次回) | 2026-07-04 | ⚠️ |

## はてなブックマーク(ログイン不要)

パラメータは公式UIのもの(壊れにくい)。引用符のフレーズ一致だけが未文書化。

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 中 | `-語` / `date_begin`/`date_end` | 除外・期間 | [b.hatena.ne.jp/search/text?q=python -入門&date_begin=2024-01-01&date_end=2024-06-30](https://b.hatena.ne.jp/search/text?q=python%20-%E5%85%A5%E9%96%80&date_begin=2024-01-01&date_end=2024-06-30) | 「入門」を含まず期間内のみ | 2026-07-04 | ✅ |
| 中 | `users=` | 最低いいね数 | [b.hatena.ne.jp/search/text?q=python&users=100](https://b.hatena.ne.jp/search/text?q=python&users=100) | 全結果が100users以上 | 2026-07-04 | ✅ |
| 低 | `"..."`(未文書化) | 完全一致 | [b.hatena.ne.jp/search/text?q="machine learning"](https://b.hatena.ne.jp/search/text?q=%22machine%20learning%22) | 引用符なしより件数が絞られる | 2026-07-04 | ✅ |
| 低 | `/search/title` / `/search/tag` / `sort=recent` | タイトルだけ・ハッシュタグ・並び順 | [b.hatena.ne.jp/search/tag?q=python 機械学習&sort=recent](https://b.hatena.ne.jp/search/tag?q=python%20%E6%A9%9F%E6%A2%B0%E5%AD%A6%E7%BF%92&sort=recent) | 両タグつきが新着順 | 2026-07-04 | ✅ |

## Twitch(ログイン不要)

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 中 | `type=videos` / `type=channels` | 探すもの | [twitch.tv/search?term=minecraft&type=videos](https://www.twitch.tv/search?term=minecraft&type=videos) | 「過去のビデオ」だけの結果 | 2026-07-04 | ✅ |
| 低 | 検索URL | キーワード | [twitch.tv/search?term=ポケモン](https://www.twitch.tv/search?term=%E3%83%9D%E3%82%B1%E3%83%A2%E3%83%B3) | 検索結果が表示される | 2026-07-04 | ✅ |

## 5ちゃんねる(ff5ch.syoboi.jp、ログイン不要)

外部のスレタイ検索サービスのため、サービス自体の存続を最優先で確認する。

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 高 | サービス存続+AND | キーワード | [ff5ch.syoboi.jp/?q=テスト 書き込み](https://ff5ch.syoboi.jp/?q=%E3%83%86%E3%82%B9%E3%83%88%20%E6%9B%B8%E3%81%8D%E8%BE%BC%E3%81%BF) | 全結果のスレタイに両語を含む | 2026-07-04 | ✅ |
| 中 | `-語` / `@板ID` | 除外・コミュニティ | [ff5ch.syoboi.jp/?q=テスト -書き込み @sony](https://ff5ch.syoboi.jp/?q=%E3%83%86%E3%82%B9%E3%83%88%20-%E6%9B%B8%E3%81%8D%E8%BE%BC%E3%81%BF%20%40sony) | sony板のみ・除外語を含まない | 2026-07-04 | ✅ |
| 中 | 複数 `@板ID`(OR、先頭のみ→全部送信に変更) | コミュニティ(複数) | [ff5ch.syoboi.jp/?q=テスト @sony @news4plus](https://ff5ch.syoboi.jp/?q=%E3%83%86%E3%82%B9%E3%83%88%20%40sony%20%40news4plus) | sony板とnews4plus板の和集合(いずれかの板)。2026-07-04実測で確認済 | 2026-07-04 | ✅ |
| 低 | 公式find.5ch.ioのAND **復活チェック** | (キーワード) | [find.5ch.io/search?q=Python 初心者](https://find.5ch.io/search?q=Python%20%E5%88%9D%E5%BF%83%E8%80%85) | 現状は片方の語だけの結果が混ざる(関連度ベース)。ANDになったら公式への切替を検討 | 2026-07-04 | ❌(ff5chを継続) |

## あにまん掲示板(ログイン不要)

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 中 | `/searchRes/`(レス本文β) | キーワード | [bbs.animanch.com/searchRes/アニメ 映画](https://bbs.animanch.com/searchRes/%E3%82%A2%E3%83%8B%E3%83%A1%20%E6%98%A0%E7%94%BB) | 本文に両語を含むスレ一覧 | 2026-07-04 | ✅ |
| 中 | `/search2/`(過去ログタイトル) | タイトルだけで探す | [bbs.animanch.com/search2/アニメ 映画](https://bbs.animanch.com/search2/%E3%82%A2%E3%83%8B%E3%83%A1%20%E6%98%A0%E7%94%BB) | タイトルに両語を含む全期間の一覧 | 2026-07-04 | ✅ |

## YouTube 追加分(探すもの)

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 中 | `sp=EgIQAg%3D%3D`(種別チャンネル) | 探すもの=チャンネル | [youtube.com/results?search_query=料理&sp=EgIQAg%3D%3D](https://www.youtube.com/results?search_query=%E6%96%99%E7%90%86&sp=EgIQAg%3D%3D) | チャンネルだけが並ぶ | 2026-07-04 | ✅ |
| 中 | `sp=EgIQCQ%3D%3D`(種別ショート、type=9)(2026-07-04追加) | 探すもの=ショート | [youtube.com/results?search_query=猫&sp=EgIQCQ%3D%3D](https://www.youtube.com/results?search_query=%E7%8C%AB&sp=EgIQCQ%3D%3D) | ショート動画だけが並ぶ。sp値はフィルタUIから実測採取 | 2026-07-04 | ✅ |
| 低 | `sp=EgIQAw%3D%3D`(種別再生リスト、type=3)(2026-07-04追加) | 探すもの=再生リスト | [youtube.com/results?search_query=猫&sp=EgIQAw%3D%3D](https://www.youtube.com/results?search_query=%E7%8C%AB&sp=EgIQAw%3D%3D) | 再生リストだけが並ぶ | 2026-07-04 | ✅ |
| 中 | `sp=CAMSBBABGAE%3D`(人気順+動画+短い、合成値) | 探すもの+並び順+長さ | [youtube.com/results?search_query=猫&sp=CAMSBBABGAE%3D](https://www.youtube.com/results?search_query=%E7%8C%AB&sp=CAMSBBABGAE%3D) | 動画のみ・4分未満、かつおおむね視聴回数降順(近似) | 2026-07-04 | ✅ |

## pixiv 追加分(作品の種類)

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 低 | パス `/illustrations` / `/manga` | 作品の種類 | [pixiv.net/tags/猫/manga](https://www.pixiv.net/tags/%E7%8C%AB/manga) | マンガ作品だけが並ぶ | 2026-07-04 | ✅ |

## Googleフォールバック(site:検索)

すべてGoogleの公式構文のため壊れにくい。低頻度でよい。

| 優先 | 対象 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|
| 低 | `site:` + 除外 + 期間 | [google.com/search?q=site:note.com 台風 -広告 after:2026-06-01](https://www.google.com/search?q=site%3Anote.com%20%E5%8F%B0%E9%A2%A8%20-%E5%BA%83%E5%91%8A%20after%3A2026-06-01) | note.com のみ・除外と期間が有効 | 2026-07-04 | ✅ |
| 低 | `(a OR b)` | [google.com/search?q=site:note.com (台風 OR 大雨)](https://www.google.com/search?q=site%3Anote.com%20%28%E5%8F%B0%E9%A2%A8%20OR%20%E5%A4%A7%E9%9B%A8%29) | OR指定が有効 | 2026-07-04 | ✅ |

## 確認履歴

| 日付 | 実施内容 |
|---|---|
| 2026-07-02 | 初回調査+信頼度中以下の項目をブラウザ実測(operator-research.md参照) |
| 2026-07-03 | YouTube ソートsp値を実測。CAI系(アップロード日順)の無効化を発見しUI注記を追加 |
| 2026-07-03 | Googleフォールバックの site:/OR/除外/期間を実測 |
| 2026-07-03 | pixiv・Misskey.io を追加(Web調査ベース)。pixiv期間指定とMisskey username= が未実測 |
| 2026-07-03 | はてブ・Mastodon・Twitch・5ch・あにまん・ニコニコ静画を追加(未ログインHTTP実測ベース)。5chは公式検索がANDにならずff5chを採用。mstdn.jpの?q=はv4.4待ち |
| 2026-07-04 | 全項目を並列で通し確認(ブラウザ+curl併用)。**発見**: (1) Misskey検索URLは自動実行されず結果ゼロ→❌(要ボタン、ディープリンク機能不全) (2) pixiv `order=date_d`+scd/ecd がエラーページを返す→pixiv.tsで新着時のorder送信を廃止 (3) YouTube視聴回数順(CAM系)は近似ソートで厳密でない点を明記。**✅化**: X min_retweets/blue_verified、YouTube -語/intitle/CAMSBBABGAE を実測確認 |
| 2026-07-04 | フィールド網羅・文法監査(ultracode)を実施し修正を実装(operator-research.md 末尾の節参照)。新演算子を実機裏取り: X `url:`✅・5ch 複数 `@板` OR✅(curl)・pixiv `s_mode=s_tc`✅・Misskey `-語`/`"..."`⚠️(暫定)。**Reddit `self:no` は現行検索が `self:` を無視するため❌→送信を撤回**。pixiv titleOnly(s_tc)を新規追加 |
| 2026-07-04 | 共通概念を拡張。resultTypeに**ショート(sp種別=9、フィルタUIから実測✅)**・再生リスト(=3)、sortOrderに**急上昇(note `sort=hot`、実測✅)**を追加。他サイトは dynamicSupport(`limitSort`)で非対応の並び順を落とす。note `sort=like`・YouTube映画・Twitchカテゴリは見送り |
| 2026-07-05 | バグ/リファクタ監査(ultracode)の残件を実装(niconico除外only・sort=auto・Reddit until単独・5ch titleOnly)。**niconico `/tag/` ページで sort/期間/l_range が /search/ と同様に効くことをブラウザ実測**(監査のuncertain項目をクローズ・変更不要)。チェックリストにniconico /tag/行を追加。加えて**pixiv「人気の目安」(`{N}users入り`タグ、2026-07-05実装分)がチェックリスト未収録だったため実測して追加**。全13サイトの送信パラメータとチェックリストを突合し、非公式で未収録だった **X `filter:links`・`-from:`** も実測して追加(公式・安定なsort系等は簡潔さ優先で見送り) |
