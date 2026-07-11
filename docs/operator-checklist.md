# 演算子の定期動作確認チェックリスト

Dialect が送信する検索演算子・URLパラメータの動作確認手順。非公式(undocumented)な演算子は予告なく死ぬため、定期的にこのリストを上から実行して確認日を更新する。調査の経緯・出典は [operator-research.md](operator-research.md) を参照。

## 運用ルール

- **頻度**: 3か月ごとを目安。加えて「動かない」というユーザー報告があったときは該当項目を即確認する
- **確認方法**: 「検証URL」をブラウザで開き、「期待する結果」と見比べるだけ。API・ツールは不要
- **記録**: 確認したら「最終確認」列の日付を更新する。挙動が変わっていたら ✅→❌ に変え、該当プラットフォームの `src/core/platforms/*.ts` の support レベル・注記(`src/i18n/ja.ts`)を直し、[operator-research.md](operator-research.md) に経緯を追記する
- **優先度**: 表は上ほど壊れやすい(非公式・公式フォーム削除済み・未文書化)。時間がなければ「優先」欄が「高」の行だけでも確認する
- 検証URLのキーワード(台風・天気など)は時事性があるため、結果が少なすぎる場合は適当な頻出語に読み替えてよい
- **確認手段の使い分け**: はてブ・ff5ch・find.5ch.io・あにまんはサーバーレンダリングのHTML/JSONなので `curl`+grep でも確定判定できる(速い)。X・Misskey・Instagram・Bluesky・Twitch・YouTube・pixiv・note・niconico はクライアント描画のSPA(要ログインを含む)で、curlはガワしか取れないためブラウザで開く
- **出所と監査候補**: 各サイトの所見が doc / URL叩き / GUI操作 のどれで得られたか、まだフォーム/フィルタのGUI採取が済んでいない「監査候補」がどれかは [operator-research.md](operator-research.md) の「出所タグ台帳」を参照。旧・監査候補だった Bluesky・note・niconico動画の3件は2026-07-09に全件GUI再点検で解消済み(現時点で監査候補なし)

## X(要ログイン)

全演算子が非公式。min_faves/min_retweets/min_repliesは公式「高度な検索」フォームのエンゲージメント欄に実在(2026-07-08 GUI操作で確認)。blue_verifiedは公式フォームから削除済みで、削除リスクが最も高い。

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 高 | `min_faves:` | 最低いいね数 | [x.com/search?q=台風 min_faves:500&f=live](https://x.com/search?q=%E5%8F%B0%E9%A2%A8%20min_faves%3A500&f=live) | 全結果が500いいね以上。2026-07-08にx.com/search-advancedのGUI操作でも「いいねの最小件数」欄として実在を再確認 | 2026-07-08 | ✅ |
| 高 | `min_retweets:` | 最低リポスト数 | [x.com/search?q=台風 min_retweets:500&f=live](https://x.com/search?q=%E5%8F%B0%E9%A2%A8%20min_retweets%3A500&f=live) | 全結果が500リポスト以上。2026-07-08にx.com/search-advancedのGUI操作でも「リポストの最小件数」欄として実在を再確認 | 2026-07-08 | ✅ |
| 高 | `filter:blue_verified` | 認証済みアカウントだけ | [x.com/search?q=台風 filter:blue_verified&f=live](https://x.com/search?q=%E5%8F%B0%E9%A2%A8%20filter%3Ablue_verified&f=live) | 全結果が認証済み(青バッジ) | 2026-07-04 | ✅ |
| 中 | `since:`/`until:` | 期間 | [x.com/search?q=台風 since:2026-06-01 until:2026-06-08&f=live](https://x.com/search?q=%E5%8F%B0%E9%A2%A8%20since%3A2026-06-01%20until%3A2026-06-08&f=live) | 全結果が期間内(untilの日は含まない。境界はUTC基準なのでJST表示だとuntil当日まで見える) | 2026-07-04 | ✅ |
| 中 | `filter:media` | 画像・動画つきだけ | [x.com/search?q=台風 filter:media&f=live](https://x.com/search?q=%E5%8F%B0%E9%A2%A8%20filter%3Amedia&f=live) | 全結果にメディアつき | 2026-07-04 | ✅ |
| 中 | `-filter:replies` | リプライを除く | [x.com/search?q=台風 -filter:replies&f=live](https://x.com/search?q=%E5%8F%B0%E9%A2%A8%20-filter%3Areplies&f=live) | 結果にリプライが混ざらない(引用ポストは別) | 2026-07-04 | ✅ |
| 低 | `from:` / `to:` / `-語` / `"..."` / `lang:ja` / `f=live` | ユーザー指定・除外ほか | [x.com/search?q="計画運休" -広告 lang:ja&f=live](https://x.com/search?q=%22%E8%A8%88%E7%94%BB%E9%81%8B%E4%BC%91%22%20-%E5%BA%83%E5%91%8A%20lang%3Aja&f=live) | 完全一致・除外・日本語絞りが効き「最新」タブで開く | 2026-07-04 | ✅ |
| 中 | `url:<ドメイン>`(2026-07-04追加) | このサイトへのリンクを含む | [x.com/search?q=台風 url:nhk.or.jp&f=live](https://x.com/search?q=%E5%8F%B0%E9%A2%A8%20url%3Anhk.or.jp&f=live) | 全結果が nhk.or.jp へのリンクを含む。2026-07-04ログイン済みブラウザで実測(結果本文に www2.nhk.or.jp リンク) | 2026-07-04 | ✅ |
| 中 | `filter:links`(リンク付き)(2026-07-05追加) | リンク付きだけ | [x.com/search?q=天気 filter:links&f=live](https://x.com/search?q=%E5%A4%A9%E6%B0%97%20filter%3Alinks&f=live) | 全結果がリンク(URLカード等)を含む。2026-07-05ログイン済みブラウザ実測 | 2026-07-05 | ✅ |
| 低 | `-from:<ユーザー>`(除外ユーザー)(2026-07-05追加) | 除外するユーザー | [x.com/search?q=天気 filter:links -from:zooaqua_5&f=live](https://x.com/search?q=%E5%A4%A9%E6%B0%97%20filter%3Alinks%20-from%3Azooaqua_5&f=live) | 指定ユーザーの投稿が結果から消える(from:の否定。ユーザー名は適宜読み替え)。2026-07-05実測(除外前に先頭だったアカウントが消えた) | 2026-07-05 | ✅ |
| 高 | `min_replies:`(2026-07-06追加) | 最低返信数 | [x.com/search?q=猫 min_replies:200&f=live](https://x.com/search?q=%E7%8C%AB%20min_replies%3A200&f=live) | 全結果が200返信以上。2026-07-06実測(241/739/269/369/2497/209返信) | 2026-07-06 | ✅ |
| 中 | `list:<リストID>`(2026-07-06追加) | Xのリスト内を検索 | [x.com/search?q=list:1215911364234924032 天気&f=live](https://x.com/search?q=list%3A1215911364234924032%20%E5%A4%A9%E6%B0%97&f=live) | そのリスト(公開のおすすめ「京都」)のメンバーの投稿だけ＋キーワードでAND絞り込み。2026-07-06実測(kyoto_np/nhk_kyoto等・全件「天気」を含む)。リストが消えたら別の公開リストIDに差し替え | 2026-07-06 | ✅ |
| 中 | `(@nhk)`(メンション)(2026-07-07追加) | このユーザーへのメンションだけ | [x.com/search?q=(@nhk) 天気&f=live](https://x.com/search?q=%28%40nhk%29%20%E5%A4%A9%E6%B0%97&f=live) | 「@nhk」への言及を含む投稿＋キーワードでAND絞り込み(演算子でなくカッコ付きの素の@テキスト)。2026-07-07にx.com/search-advancedのGUI操作で実測(1件=`(@user)`、複数件=`(@user1 OR @user2)`) | 2026-07-07 | ✅ |
| 中 | `(猫 OR 犬)`(このどれかを含む、2026-07-11追加) | このどれかを含む | [x.com/search?q=手芸 (猫 OR 犬)&f=live](https://x.com/search?q=%E6%89%8B%E8%8A%B8%20%28%E7%8C%AB%20OR%20%E7%8A%AC%29&f=live) | 「手芸」を含み、かつ「猫」か「犬」のどちらかを含む投稿(スコープ限定OR)。2026-07-11にx.com/search-advancedの「次のキーワードのいずれかを含む」欄をGUI操作で実測(issue #26) | 2026-07-11(GUI操作) | ✅ |

## Bluesky(ログイン不要)

演算子は公式ドキュメントがある(唯一)。除外と tab= だけが未文書化。

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 高 | `-語`(未文書化) | 除外するキーワード | [bsky.app/search?q=天気 -雨](https://bsky.app/search?q=%E5%A4%A9%E6%B0%97%20-%E9%9B%A8) | 結果に単語「雨」を含む投稿がない(「梅雨」は別トークンなので残ってよい) | 2026-07-04 | ✅ |
| 高 | `tab=latest`(未文書化) | 並び順=新しい順 | [bsky.app/search?q=天気&tab=latest](https://bsky.app/search?q=%E5%A4%A9%E6%B0%97&tab=latest) | 「最新」タブが選択された状態で開く | 2026-07-04 | ✅ |
| 低 | `from:` / `mentions:` / `domain:` / `since:`/`until:`(公式演算子) | ユーザー指定ほか | [bsky.app/search?q=天気 since:2026-06-01](https://bsky.app/search?q=%E5%A4%A9%E6%B0%97%20since%3A2026-06-01) | 期間内のみに絞られる | 2026-07-04 | ✅ |
| 低 | `&lang=ja`(言語フィルタ、2026-07-09 GUIドロップダウンをフォーム採取) | 言語 | [bsky.app/search?q=猫&lang=ja](https://bsky.app/search?q=%E7%8C%AB&lang=ja) | 検索ページの「すべての言語」ドロップダウンが「日本語」になり日本語投稿に絞られる。旧実装はクエリ内 `lang:` 演算子だったが、実プロダクトが生成する `&lang=` パラメータへ揃えた(UIは `lang:` をクエリ文字扱いする) | 2026-07-09(GUI操作) | ✅ |
| 中 | `&media=true`(未文書化。検索フォームにトグルは無い) | メディア | [bsky.app/search?q=猫&media=true](https://bsky.app/search?q=%E7%8C%AB&media=true) | 結果に文章だけの投稿がなくなり、ユーザー/フィードタブが非表示になる(サーバー側がパラメータを認識している証拠) | 2026-07-09(URL叩き。GUIトグルが無いため未露出のまま機能する挙動の確認) | ✅ |
| 中 | `tab=user`(未文書化。ユーザータブをクリックすると同じ結果になる) | 探す=プロフィール | [bsky.app/search?q=猫&tab=user](https://bsky.app/search?q=%E7%8C%AB&tab=user) | アカウント検索結果(投稿ではなくプロフィール一覧)が表示される。`-語`・引用符など本文演算子は効かない(GUI操作で確認) | 2026-07-09(GUI操作。ユーザータブをクリックして同結果を確認) | ✅ |

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
| 中 | `sp=EgJAAQ%3D%3D`(ライブ、特徴単独)(2026-07-05追加) | ライブ配信だけ | [youtube.com/results?search_query=ニュース&sp=EgJAAQ%3D%3D](https://www.youtube.com/results?search_query=%E3%83%8B%E3%83%A5%E3%83%BC%E3%82%B9&sp=EgJAAQ%3D%3D) | 全結果がライブ配信(配信中・ライブアーカイブ)。YouTubeのフィルタUIが「ライブ」で出す値(filterサブメッセージ field8=1)。Dialectは並び順と合成して送る。2026-07-05ブラウザ実測(【LIVE】ニュース配信が並ぶ) | 2026-07-05 | ✅ |
| 低 | 引用符(効かないことの確認) | 完全一致 | [youtube.com/results?search_query="冷蔵庫で富士山を冷やす"](https://www.youtube.com/results?search_query=%22%E5%86%B7%E8%94%B5%E5%BA%AB%E3%81%A7%E5%AF%8C%E5%A3%AB%E5%B1%B1%E3%82%92%E5%86%B7%E3%82%84%E3%81%99%22) | 存在しないフレーズでも通常検索の結果が返る=引用符は実質無視(UI注記の根拠)。厳密に効くようになったら注記を緩める | 2026-07-04 | ❌(注記済み) |
| 低 | チャンネル内検索URL | このユーザーの投稿だけ | [youtube.com/@NHK/search?query=台風](https://www.youtube.com/@NHK/search?query=%E5%8F%B0%E9%A2%A8) | チャンネル内の検索結果ページが開く | 2026-07-04 | ✅ |
| 中 | `sp=EgJwAQ%3D%3D`(4K、特徴単独)(2026-07-07追加) | 4Kの動画だけ | [youtube.com/results?search_query=風景&sp=EgJwAQ%3D%3D](https://www.youtube.com/results?search_query=%E9%A2%A8%E6%99%AF&sp=EgJwAQ%3D%3D) | 全結果が4K画質(filterサブメッセージ field14=1)。2026-07-07にフィルタUIから実測 | 2026-07-07 | ✅ |
| 中 | `sp=EgIgAQ%3D%3D`(HD、特徴単独)(2026-07-07追加) | HDの動画だけ | [youtube.com/results?search_query=風景&sp=EgIgAQ%3D%3D](https://www.youtube.com/results?search_query=%E9%A2%A8%E6%99%AF&sp=EgIgAQ%3D%3D) | 全結果がHD画質(field4=1)。2026-07-07にフィルタUIから実測 | 2026-07-07 | ✅ |
| 中 | `sp=EgIoAQ%3D%3D`(字幕、特徴単独)(2026-07-07追加) | 字幕つきの動画だけ | [youtube.com/results?search_query=ニュース&sp=EgIoAQ%3D%3D](https://www.youtube.com/results?search_query=%E3%83%8B%E3%83%A5%E3%83%BC%E3%82%B9&sp=EgIoAQ%3D%3D) | 全結果に字幕(クローズドキャプション)がある(field5=1)。2026-07-07にフィルタUIから実測 | 2026-07-07 | ✅ |
| 低 | `sp=EgIwAQ%3D%3D`(クリエイティブ・コモンズ、特徴単独)(2026-07-07追加) | クリエイティブ・コモンズだけ | [youtube.com/results?search_query=素材&sp=EgIwAQ%3D%3D](https://www.youtube.com/results?search_query=%E7%B4%A0%E6%9D%90&sp=EgIwAQ%3D%3D) | 全結果がクリエイティブ・コモンズ・ライセンス(field6=1)。2026-07-07にフィルタUIから実測 | 2026-07-07 | ✅ |
| 低 | `sp=EgJ4AQ%3D%3D`(360°、特徴単独)(2026-07-08追加) | 360°動画だけ | [youtube.com/results?search_query=test&sp=EgJ4AQ%3D%3D](https://www.youtube.com/results?search_query=test&sp=EgJ4AQ%3D%3D) | 結果が360°動画・4K動画に絞られる(field15=1)。2026-07-08にフィルタUIから実測、実機で360°バッジつき動画のみ表示を確認 | 2026-07-08 | ✅ |
| 低 | `sp=EgPQAQE%3D`(VR180、特徴単独)(2026-07-08追加) | VR180の動画だけ | [youtube.com/results?search_query=test&sp=EgPQAQE%3D](https://www.youtube.com/results?search_query=test&sp=EgPQAQE%3D) | 結果がVR180動画に絞られる(field26=1、2バイトvarintタグ)。2026-07-08にフィルタUIから実測、実機でVR180バッジつき動画のみ表示を確認 | 2026-07-08 | ✅ |
| 低 | `sp=EgI4AQ%3D%3D`(3D、特徴単独)(2026-07-08追加) | 3D動画だけ | [youtube.com/results?search_query=test&sp=EgI4AQ%3D%3D](https://www.youtube.com/results?search_query=test&sp=EgI4AQ%3D%3D) | 結果が3D動画に絞られる(field7=1)。2026-07-08にフィルタUIから実測、実機で3Dバッジつき動画のみ表示を確認 | 2026-07-08 | ✅ |
| 低 | `sp=EgPIAQE%3D`(HDR、特徴単独)(2026-07-08追加) | HDRの動画だけ | [youtube.com/results?search_query=test&sp=EgPIAQE%3D](https://www.youtube.com/results?search_query=test&sp=EgPIAQE%3D) | 結果がHDR動画に絞られる(field25=1、2バイトvarintタグ)。2026-07-08にフィルタUIから実測、実機でHDRバッジつき動画のみ表示を確認 | 2026-07-08 | ✅ |
| 低 | `sp=EgO4AQE%3D`(場所、特徴単独)(2026-07-08追加) | 撮影場所つきの動画だけ | [youtube.com/results?search_query=渋谷&sp=EgO4AQE%3D](https://www.youtube.com/results?search_query=%E6%B8%8B%E8%B0%B7&sp=EgO4AQE%3D) | 地名で検索すると実際にその場所で撮影された動画(旅行記・街歩き等)に絞られる(field23=1、2バイトvarintタグ)。地名以外の一般語では0件になる(位置情報タグつき動画自体が少ないため)。2026-07-08にフィルタUIから実測、渋谷の実写動画で確認 | 2026-07-08 | ✅ |
| 低 | `sp=EgJIAQ%3D%3D`(購入済み、特徴単独)(2026-07-08追加) | 購入済みの動画だけ | [youtube.com/results?search_query=test&sp=EgJIAQ%3D%3D](https://www.youtube.com/results?search_query=test&sp=EgJIAQ%3D%3D) | 自分が購入した映画・番組に絞られる(field9=1)。2026-07-08にフィルタUIから値を採取(このアカウントは購入履歴が無く0件表示、絞り込み自体の実動作は未検証) | 2026-07-08 | ✅(値採取のみ) |
| 中 | `%7C`(パイプ区切り、このどれかを含む)(2026-07-11追加) | このどれかを含む | [youtube.com/results?search_query=手芸+猫%7C犬](https://www.youtube.com/results?search_query=%E6%89%8B%E8%8A%B8%20%E7%8C%AB%7C%E7%8A%AC) | 「手芸」の結果に、猫関連・犬関連の動画が両方混ざる(union)。2026-07-11にyoutube.comの検索ボックスでパイプ区切りのキーワードを検索し実機確認(issue #26) | 2026-07-11(GUI操作) | ✅ |

## note(ログイン不要)

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 中 | `from:@noteID`(公式) | このユーザーの投稿だけ | [note.com/search?context=note&q=from:@info&sort=new](https://note.com/search?context=note&q=from%3A%40info&sort=new) | note公式アカウントの記事だけが並ぶ | 2026-07-04 | ✅ |
| 中 | `sort=new` | 並び順=新しい順 | [note.com/search?context=note&q=台風&sort=new](https://note.com/search?context=note&q=%E5%8F%B0%E9%A2%A8&sort=new) | 新着順で並ぶ | 2026-07-04 | ✅ |
| 中 | `sort=hot`(急上昇)(2026-07-04追加) | 並び順=急上昇 | [note.com/search?context=note&q=猫&sort=hot](https://note.com/search?context=note&q=%E7%8C%AB&sort=hot) | 「急上昇」タブが選択され急上昇の記事が並ぶ。2026-07-04ブラウザ実測 | 2026-07-04 | ✅ |
| 中 | `context=note_for_sale`(有料のみ)(2026-07-09追加) | 有料の記事だけ | [note.com/search?context=note_for_sale&q=猫](https://note.com/search?context=note_for_sale&q=%E7%8C%AB) | 「すべての記事」ドロップダウンで「有料の記事」を選ぶとcontextがnote_for_saleに切替。全結果が有料記事(価格表示)に絞られる。2026-07-09 GUI採取(セレクトを実操作) | 2026-07-09(GUI操作) | ✅ |
| 低 | ハッシュタグページ | ハッシュタグ | [note.com/hashtag/読書記録](https://note.com/hashtag/%E8%AA%AD%E6%9B%B8%E8%A8%98%E9%8C%B2) | タグの記事一覧が開く(コンテスト系タグは/contestへ転送されるが記事一覧は表示される) | 2026-07-04 | ✅ |
| 中 | `context=user`(検索結果タブ「クリエイター」、2026-07-09追加) | 探す=プロフィール | [note.com/search?context=user&q=猫](https://note.com/search?context=user&q=%E7%8C%AB) | クリエイター(ユーザー)一覧になる。並び順チップ・`from:`演算子・有料フィルタは無い | 2026-07-09(GUI操作) | ✅ |
| 中 | `context=magazine`(検索結果タブ「マガジン」、2026-07-09追加) | 探す=シリーズ | [note.com/search?context=magazine&q=猫](https://note.com/search?context=magazine&q=%E7%8C%AB) | マガジン(記事をまとめた企画)一覧になる。並び順チップ・`from:`演算子・有料フィルタは無い | 2026-07-09(GUI操作) | ✅ |
| 中 | `context=circle`(検索結果タブ「メンバーシップ」、2026-07-09追加) | 探す=メンバーシップ | [note.com/search?context=circle&q=投資](https://note.com/search?context=circle&q=%E6%8A%95%E8%B3%87) | メンバーシップ(有料コミュニティ)一覧になる。`from:`演算子は0件になり効かない(none)。有料のみは全件がそもそも有料のため意味を持たない(none)。並び順チップは「人気(既定・sort=popular)/新着(sort=new)」の2値のみで急上昇(hot)は無い | 2026-07-09(GUI操作) | ✅ |
| 低 | `sort=popular`(メンバーシップの人気順、2026-07-09追加) | 並び順=人気順 | [note.com/search?context=circle&q=投資&sort=popular](https://note.com/search?context=circle&q=%E6%8A%95%E8%B3%87&sort=popular) | 「人気」チップが選択された状態と同じ結果になる | 2026-07-09(GUI操作) | ✅ |

## niconico(ログイン不要)

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 中 | `start=`/`end=`(任意期間) | 期間 | [nicovideo.jp/search/台風?start=2026-06-01&end=2026-06-30&sort=registeredAt&order=desc](https://www.nicovideo.jp/search/%E5%8F%B0%E9%A2%A8?start=2026-06-01&end=2026-06-30&sort=registeredAt&order=desc) | 全結果が6月の投稿・新着順。任意期間はフィルタモーダルの「日付を指定」で2026-07-09 GUI採取 | 2026-07-09(GUI操作) | ✅ |
| 中 | OR並置文法(括弧なし、このどれかを含む) | このどれかを含む | [nicovideo.jp/search/猫 OR 犬 手芸](https://www.nicovideo.jp/search/%E7%8C%AB%20OR%20%E7%8A%AC%20%E6%89%8B%E8%8A%B8) | (猫 OR 犬) AND 手芸 として絞り込まれる(件数が「猫 手芸」+「犬 手芸」程度)。括弧を使うとリテラル扱いで壊れる。2026-07-11にnicovideo.jpの検索ボックスで`猫 OR 犬`をGUI操作で再確認(issue #26) | 2026-07-11(GUI操作) | ✅ |
| 中 | `sort=registeredAt&order=desc`(新しい順)(2026-07-09 modern形式へ移行) | 並び順=新しい順 | [nicovideo.jp/search/猫?sort=registeredAt&order=desc](https://www.nicovideo.jp/search/%E7%8C%AB?sort=registeredAt&order=desc) | 投稿が新しい順に並ぶ。並び順ドロップダウンが「投稿日時」を示す。2026-07-09 GUI採取(旧 `sort=f&order=d` も有効なエイリアス) | 2026-07-09(GUI操作) | ✅ |
| 中 | `sort=viewCount&order=desc`(人気順=再生数)(2026-07-09 移行。旧 `sort=h`) | 並び順=人気順 | [nicovideo.jp/search/猫?sort=viewCount&order=desc](https://www.nicovideo.jp/search/%E7%8C%AB?sort=viewCount&order=desc) | 再生数の多い順に並ぶ(bilibili top=最多播放と揃えた「動画サイトの人気=再生数」)。ドロップダウンが「再生数」を示す。/tag ページでも有効。2026-07-09 GUI採取 | 2026-07-09(GUI操作) | ✅ |
| 中 | `sort=commentCount&order=desc`(コメント数順)(2026-07-09追加) | 並び順=コメント数順 | [nicovideo.jp/search/猫?sort=commentCount&order=desc](https://www.nicovideo.jp/search/%E7%8C%AB?sort=commentCount&order=desc) | コメント数の多い順に並ぶ。ドロップダウンが「コメント数」を示す。2026-07-09 GUI採取 | 2026-07-09(GUI操作) | ✅ |
| 中 | `sort=likeCount&order=desc`(いいね数順)(2026-07-09追加) | 並び順=いいね数順 | [nicovideo.jp/search/猫?sort=likeCount&order=desc](https://www.nicovideo.jp/search/%E7%8C%AB?sort=likeCount&order=desc) | いいね数の多い順に並ぶ。ドロップダウンが「いいね！数」を示す。2026-07-09 GUI採取 | 2026-07-09(GUI操作) | ✅ |
| 中 | `sort=mylistCount&order=desc`(マイリスト数順)(2026-07-09追加) | 並び順=マイリスト数順 | [nicovideo.jp/search/猫?sort=mylistCount&order=desc](https://www.nicovideo.jp/search/%E7%8C%AB?sort=mylistCount&order=desc) | マイリスト登録数の多い順に並ぶ。ドロップダウンが「マイリスト登録数」を示す。2026-07-09 GUI採取 | 2026-07-09(GUI操作) | ✅ |
| 中 | `sort=lastCommentTime&order=desc`(コメント日時順)(2026-07-09追加) | 並び順=コメント日時順 | [nicovideo.jp/search/猫?sort=lastCommentTime&order=desc](https://www.nicovideo.jp/search/%E7%8C%AB?sort=lastCommentTime&order=desc) | 直近にコメントが付いた順に並ぶ。ドロップダウンが「コメント日時」を示す(コメント数順=commentCountとは別概念)。2026-07-09 GUI採取(並び順ドロップダウンを実操作) | 2026-07-09(GUI操作) | ✅ |
| 中 | `genre=`(ジャンル、2026-07-06追加) | ジャンル | [nicovideo.jp/search/初音ミク?genre=music_sound](https://www.nicovideo.jp/search/%E5%88%9D%E9%9F%B3%E3%83%9F%E3%82%AF?genre=music_sound) | 「音楽・サウンド」ジャンルに絞られる。/search・/tag 両方で有効(件数が段階的に絞られる)。2026-07-06実測(ゲーム2万≪音楽29万<指定なし38万) | 2026-07-06 | ✅ |
| 中 | `genre=`の未収録5値(動物/料理/自然/社会政治時事/例のソレ、2026-07-08追加) | ジャンル | [nicovideo.jp/search/猫?genre=cooking](https://www.nicovideo.jp/search/%E7%8C%AB?genre=cooking) | ログイン済みフィルタモーダルを再操作したところ、当初収録の12値(music_sound/game/entertainment/other/dance/anime/technology_craft/commentary_lecture/sports/radio/vehicle/traveling_outdoor)に加え `animal`(動物)・`cooking`(料理)・`nature`(自然)・`society_politics_news`(社会・政治・時事)・`r18`(例のソレ)の5値が存在すると判明(全17値)。`genre=cooking`を実際に適用し結果ページURLで反映を確認、2,159件・料理関連の猫動画に絞られることも確認。**ログイン要否**: Cookie無しの素のcurlで同じ検索URLを取得したところ、HTML内に`&quot;label&quot;:&quot;料理&quot;,&quot;value&quot;:&quot;cooking&quot;`のようにジャンル全17値がSSRデータとして直接埋め込まれていると確認(animal/nature/r18/game/music_soundも同様)＝ログイン不要と確証を持って確定 | 2026-07-08(GUI操作+URL叩き) | ✅ |
| 中 | `kind=user`/`kind=channel`(動画種別)(2026-07-09追加) | 動画の種別 | [nicovideo.jp/search/猫?kind=user](https://www.nicovideo.jp/search/%E7%8C%AB?kind=user) | 検索フィルタモーダルの「動画種別」でユーザー投稿/公式チャンネルに絞る。2026-07-09 GUI採取(モーダルを実操作) | 2026-07-09(GUI操作) | ✅ |
| 低 | タグページ+除外 | ハッシュタグ・除外 | [nicovideo.jp/tag/ゲーム -実況](https://www.nicovideo.jp/tag/%E3%82%B2%E3%83%BC%E3%83%A0%20-%E5%AE%9F%E6%B3%81) | タグ一致かつ「実況」を除外した一覧(タイトル内の実況は別トークン扱いで残る) | 2026-07-04 | ✅ |
| 低 | `/tag/`ページで並び順・期間・長さ(2026-07-05追加) | ハッシュタグ単独時の並び順・期間・動画の長さ | [nicovideo.jp/tag/ゲーム?sort=h&start=2015-01-01&end=2015-12-31&l_range=2](https://www.nicovideo.jp/tag/%E3%82%B2%E3%83%BC%E3%83%A0?sort=h&start=2015-01-01&end=2015-12-31&l_range=2) | タグ検索でも sort/start/end/l_range が /search/ と同様に効く(「ニコニコで人気」順・全件2015年・全件20分超に絞られる)。2026-07-05ブラウザ実測。個別も確認済: `sort=f&order=d`=投稿日時順で最新先頭・`l_range=1`=5分未満 | 2026-07-05 | ✅ |
| 中 | `/search_shorts/`(検索結果タブ「ショート」、2026-07-09追加) | 探す=ショート | [nicovideo.jp/search_shorts/猫](https://www.nicovideo.jp/search_shorts/%E7%8C%AB) | ショート動画のみの一覧になる。動画本体と同じフィルタパネル・並び順ドロップダウン(`sort=viewCount&order=desc`等)を共有することを確認 | 2026-07-09(GUI操作) | ✅ |
| 中 | `/series_search/`(検索結果タブ「シリーズ」、2026-07-09追加) | 探す=シリーズ | [nicovideo.jp/series_search/猫](https://www.nicovideo.jp/series_search/%E7%8C%AB) | シリーズ(投稿者がまとめた連作)の一覧になる。フィルタパネルは無く、専用の並び順(登録動画数/作成日/動画追加日時)を持つ | 2026-07-09(GUI操作) | ✅ |
| 中 | `/mylist_search/`(検索結果タブ「マイリスト」、2026-07-09追加) | 探す=マイリスト(再生リスト) | [nicovideo.jp/mylist_search/猫](https://www.nicovideo.jp/mylist_search/%E7%8C%AB) | 公開マイリストの一覧になる。フィルタパネルは無く、シリーズと同じ並び順パラメータを共有する | 2026-07-09(GUI操作) | ✅ |
| 中 | `/user_search/`(検索結果タブ「ユーザー」、2026-07-09追加) | 探す=ユーザー(プロフィール) | [nicovideo.jp/user_search/猫](https://www.nicovideo.jp/user_search/%E7%8C%AB) | アカウントの一覧になる。並び順は独自(`sort=followerCount`/`sort=videoCount`/`sort=liveCount`、いずれも`&order=desc`、フォロワー数/投稿動画数/生放送番組数) | 2026-07-09(GUI操作) | ✅ |
| 中 | `sort=startTime&order=desc`(シリーズ/マイリストの並び順=作成日、2026-07-09追加) | 並び順=新しい順(探す=シリーズ/マイリスト時) | [nicovideo.jp/series_search/猫?sort=startTime&order=desc](https://www.nicovideo.jp/series_search/%E7%8C%AB?sort=startTime&order=desc) | シリーズが作成日の新しい順に並ぶ。ドロップダウンが「作成日」を示す。既定「ニコニコで人気」は明示選択でも`sort=_hotTotalScore`という特殊値を送るだけと確認、指定なし(auto)に畳み込み | 2026-07-09(GUI操作) | ✅ |
| 中 | `sort=videoCount&order=desc`(シリーズ/マイリストの並び順=登録動画数、2026-07-09追加) | 並び順=動画数順(探す=シリーズ/マイリスト時) | [nicovideo.jp/series_search/猫?sort=videoCount&order=desc](https://www.nicovideo.jp/series_search/%E7%8C%AB?sort=videoCount&order=desc) | 収録動画数の多い順に並ぶ。ドロップダウンが「登録動画数」を示す。シリーズ・マイリスト共通のパラメータ名と確認 | 2026-07-09(GUI操作) | ✅ |
| 中 | `sort=lastAddedTime&order=desc`(シリーズ/マイリストの並び順=動画追加日時、2026-07-09追加) | 並び順=動画追加日時順(探す=シリーズ/マイリスト時) | [nicovideo.jp/mylist_search/猫?sort=lastAddedTime&order=desc](https://www.nicovideo.jp/mylist_search/%E7%8C%AB?sort=lastAddedTime&order=desc) | 最後に動画が追加された順に並ぶ。ドロップダウンが「動画追加日時」を示す | 2026-07-09(GUI操作) | ✅ |
| 中 | `sort=followerCount&order=desc`(ユーザー検索の並び順=フォロワー数、2026-07-09追加) | 並び順=フォロワー数順(探す=ユーザー時) | [nicovideo.jp/user_search/猫?sort=followerCount&order=desc](https://www.nicovideo.jp/user_search/%E7%8C%AB?sort=followerCount&order=desc) | フォロワー数の多い順に並ぶ | 2026-07-09(GUI操作) | ✅ |
| 中 | `sort=liveCount&order=desc`(ユーザー検索の並び順=生放送番組数、2026-07-09追加) | 並び順=生放送番組数順(探す=ユーザー時) | [nicovideo.jp/user_search/猫?sort=liveCount&order=desc](https://www.nicovideo.jp/user_search/%E7%8C%AB?sort=liveCount&order=desc) | 生放送番組数の多い順に並ぶ。無指定時の既定は`sort=_personalized`(あなたへのおすすめ、ログイン依存)で、未訪問クエリで確認し指定なし(auto)に畳み込み | 2026-07-09(GUI操作) | ✅ |

## ニコニコ静画(ログイン不要)

イラストは `seiga.nicovideo.jp/search/{クエリ}?target=illust`、マンガは `manga.nicovideo.jp/search?q=`(別エンジン。`target=manga` はここへリダイレクトされる)。並び順は非公式で、既定が `comment_created`(コメント新着)のため新着順・人気順は明示が必要。マンガは並び順を送ると結果集合が変わる癖があるため送らない。

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 低 | スペースAND・`-語`除外・`"…"`完全一致 | キーワード・除外・完全一致 | [seiga.nicovideo.jp/search/猫 -犬?target=illust](https://seiga.nicovideo.jp/search/%E7%8C%AB%20-%E7%8A%AC?target=illust) | AND・除外・完全一致が件数で整合(猫73,566 / 猫 犬1,590 / 猫 -犬71,976=差分が一致 / "猫 侍"24<猫 侍75)。2026-07-07実測 | 2026-07-07 | ✅ |
| 中 | `sort=image_created`(新着) | 並び順=新しい順 | [seiga.nicovideo.jp/search/猫?target=illust&sort=image_created](https://seiga.nicovideo.jp/search/%E7%8C%AB?target=illust&sort=image_created) | 投稿が新しい順に並ぶ(既定はコメント新着順のため明示要)。2026-07-07実測(先頭が最新ID) | 2026-07-07 | ✅ |
| 中 | `sort=image_view`(閲覧数) | 並び順=人気順 | [seiga.nicovideo.jp/search/猫?target=illust&sort=image_view](https://seiga.nicovideo.jp/search/%E7%8C%AB?target=illust&sort=image_view) | 閲覧数の多い順に並ぶ(人気の代用)。2026-07-07実測(古い殿堂入り作が先頭) | 2026-07-07 | ✅ |
| 低 | `/tag/`(タグ一致) | ハッシュタグ | [seiga.nicovideo.jp/tag/猫?target=illust](https://seiga.nicovideo.jp/tag/%E7%8C%AB?target=illust) | タグ「猫」一致の一覧。除外・`sort=` も併用可(タグページでも並び替わる)。2026-07-07実測 | 2026-07-07 | ✅ |
| 低 | `manga.nicovideo.jp/search?q=`(マンガ) | 作品の種類=マンガ | [manga.nicovideo.jp/search?q=猫](https://manga.nicovideo.jp/search?q=%E7%8C%AB) | ニコニコ漫画の検索結果(別エンジン)。AND・除外・完全一致が効く(猫2,143 / 猫 犬254 / 猫 -犬1,889 / "猫 侍"1<16)。並び順は送ると件数が変わるため送らない。2026-07-07実測 | 2026-07-07 | ✅ |
| 中 | OR並置文法(括弧禁止、このどれかを含む)(2026-07-11追加) | このどれかを含む | [seiga.nicovideo.jp/search/猫 OR 犬 手芸?target=illust](https://seiga.nicovideo.jp/search/%E7%8C%AB%20OR%20%E7%8A%AC%20%E6%89%8B%E8%8A%B8?target=illust) | (猫 OR 犬) AND 手芸として絞り込まれる(niconico動画と同一の検索基盤・同一文法。括弧を使うとリテラル扱いで壊れる)。2026-07-11にseiga.nicovideo.jpの検索ボックスで`猫 OR 犬`をGUI操作で実測(issue #26) | 2026-07-11(GUI操作) | ✅ |

## Reddit(ログイン不要)

Boolean演算子は公式仕様のため壊れにくい。old.reddit.com は2026年8月からログイン必須化予定だが Dialect は使っていない。

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 中 | `AND` / `NOT (...)` | キーワード・除外 | [reddit.com/search/?q=typhoon AND japan NOT (anime)](https://www.reddit.com/search/?q=typhoon%20AND%20japan%20NOT%20%28anime%29) | 両語を含み anime を含まない | 2026-07-04 | ✅ |
| 中 | `author:` / `subreddit:` | ユーザー指定・コミュニティ | [reddit.com/search/?q=subreddit:japan typhoon](https://www.reddit.com/search/?q=subreddit%3Ajapan%20typhoon) | r/japan 内の結果のみ | 2026-07-04 | ✅ |
| 低 | `sort=new` / `t=week` | 並び順・期間の丸め | [reddit.com/search/?q=typhoon&sort=new&t=week](https://www.reddit.com/search/?q=typhoon&sort=new&t=week) | 新着順・1週間以内 | 2026-07-04 | ✅ |
| 低 | `self:no` **復活チェック**(現状は効かないので送っていない) | リンクを含む投稿だけ | [reddit.com/search/?q=typhoon AND self:yes](https://www.reddit.com/search/?q=typhoon%20AND%20self%3Ayes) | 現状は `self:` が無視される(self:yes でも画像投稿が並び self:no と結果同一。2026-07-04実測)。テキスト投稿だけに絞れるようになったら linksOnly を復活 | 2026-07-04 | ❌(送信しない) |
| 中 | `sort=comments`(2026-07-07追加) | コメント数順 | [reddit.com/search/?q=typhoon&sort=comments](https://www.reddit.com/search/?q=typhoon&sort=comments) | コメント数の多い順に並ぶ | 2026-07-07 | ✅ |
| 中 | `type=posts` / `type=communities` / `type=comments` / `type=media` / `type=people`(2026-07-07追加) | 探すものの種類 | [reddit.com/search/?q=typhoon&type=media](https://www.reddit.com/search/?q=typhoon&type=media) | 「メディア」タブに絞られる(他の値もそれぞれ投稿/コミュニティ/コメント/プロフィールタブに対応)。無指定は「すべて」タブ(投稿+コミュニティ+コメント+メディア+プロフィールが混在)のまま。2026-07-07にreddit.com/searchのタブをGUI操作で実測 | 2026-07-07 | ✅ |
| 中 | `(cats OR dogs)`(このどれかを含む、2026-07-11追加) | このどれかを含む | [reddit.com/search/?q=yarn (cats OR dogs)](https://www.reddit.com/search/?q=yarn%20%28cats%20OR%20dogs%29) | 「yarn」を含み、かつ「cats」か「dogs」のどちらかを含む投稿(スコープ限定OR)。2026-07-11にreddit.comの検索ボックスに`cats OR dogs`を直接入力してGUI操作で実測(issue #26) | 2026-07-11(GUI操作) | ✅ |

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
| 低 | `(猫 OR 犬)`(このどれかを含む) / `-語`(除外)(公式) | このどれかを含む・除外 | [pixiv.net/tags/(猫 OR 犬) -腐向け/artworks](https://www.pixiv.net/tags/(%E7%8C%AB%20OR%20%E7%8A%AC)%20-%E8%85%90%E5%90%91%E3%81%91/artworks) | 猫か犬のタグを含み「腐向け」を除外。2026-07-11にpixiv.netの検索ボックスで`猫 OR 犬`をGUI操作で再確認(issue #26) | 2026-07-11(GUI操作) | ✅ |
| 低 | `s_mode=s_tc`(2026-07-04追加) | タイトルだけで探す | [pixiv.net/tags/猫/artworks?s_mode=s_tc](https://www.pixiv.net/tags/%E7%8C%AB/artworks?s_mode=s_tc) | 「タイトル・キャプション」検索として結果が出る(pixivは内部で s_mode=tc に正規化)。2026-07-04ブラウザ実測 | 2026-07-04 | ✅ |
| 低 | `s_mode=s_tag_full`(タグ完全一致、2026-07-06追加) | タグの完全一致 | [pixiv.net/tags/初音ミク/artworks?s_mode=s_tag_full](https://www.pixiv.net/tags/%E5%88%9D%E9%9F%B3%E3%83%9F%E3%82%AF/artworks?s_mode=s_tag_full) | タグの部分一致でなく完全一致で絞られる(件数が減る)。2026-07-06実測(部分732千→完全724千) | 2026-07-06 | ✅ |
| 中 | `{N}users入り`タグ(擬似人気順、2026-07-05追加) | 人気の目安 | [pixiv.net/tags/風景 10000users入り/artworks](https://www.pixiv.net/tags/%E9%A2%A8%E6%99%AF%2010000users%E5%85%A5%E3%82%8A/artworks) | キーワードと「{N}users入り」タグ(一定ブクマ数でファンが付与)の複合検索で人気作に絞る(プレミアム限定 order=popular_d 不要)。**タグ実在に依存=ファン付与が廃れると機能不全**(漏れも仕様)。2026-07-05ブラウザ実測(#風景#10000users入りで人気作が並ぶ) | 2026-07-05 | ✅ |
| 低 | `mode=safe` / `mode=r18`(年齢制限)(2026-07-05追加) | 年齢制限 | [pixiv.net/tags/初音ミク/artworks?mode=safe](https://www.pixiv.net/tags/%E5%88%9D%E9%9F%B3%E3%83%9F%E3%82%AF/artworks?mode=safe) | safe=全年齢のみ／r18=R18のみに絞られる。`/tags`エンドポイントでも有効・非会員可(R18の表示は要ログイン=注記済み)。2026-07-05 AJAX件数で実測(safe 678,793 + r18 53,163 = 全件 731,956 に一致) | 2026-07-05 | ✅ |
| 低 | `ai_type=1`(AI生成除外)(2026-07-05追加) | AI生成作品を除く | [pixiv.net/tags/初音ミク/artworks?ai_type=1](https://www.pixiv.net/tags/%E5%88%9D%E9%9F%B3%E3%83%9F%E3%82%AF/artworks?ai_type=1) | AI生成作品が結果から外れる。`/tags`でも有効・非会員可(アカウント既定を上書き)。2026-07-05実測(初音ミクで 731,956→670,443、約6.1万件減) | 2026-07-05 | ✅ |
| 中 | `s_mode=tag_tc`(タグ・タイトル・キャプション、2026-07-07追加) | タグ・タイトル・キャプションで探す | [pixiv.net/search?q=猫&s_mode=tag_tc&type=artwork](https://www.pixiv.net/search?q=%E7%8C%AB&s_mode=tag_tc&type=artwork) | タグ部分一致より広い範囲がヒットする(2026-07-07実測、猫の部分一致24万件→tag_tcで112万件超)。**`/tags/{q}/{section}`パスでは「不正なリクエスト」エラーになり、`/search?q=…&type=…`という別エンドポイントが必要**(他のs_modeと違う)。2026-07-07にpixiv.netの検索オプションGUIで実測 | 2026-07-07 | ✅ |

## Misskey.io(要ログイン)

検索URL(`/search?q=...&type=note`)はクエリ欄を埋めるだけで**検索が自動実行されない**(ページ上の「検索」ボタンのクリックが必要)。URL遷移=結果表示にならないため、ディープリンクとしては機能不全。Dialect側の扱いは要検討。タグ単独ページ(`/tags/`)は自動表示されるので影響なし。除外・完全一致は2026-07-08にログイン済みGUI操作で再検証し、確定した(下記参照)。

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 高 | `username=`(非公式) | このユーザーの投稿だけ | [misskey.io/search?q=天気&type=note&username=syuilo](https://misskey.io/search?q=%E5%A4%A9%E6%B0%97&type=note&username=syuilo) | ユーザー入力欄は正しく埋まる(「ユーザー指定」ON)が、検索が自動実行されず結果は出ない(要「検索」クリック) | 2026-07-04 | ⚠️ |
| 中 | 検索URL | キーワード | [misskey.io/search?q=台風&type=note](https://misskey.io/search?q=%E5%8F%B0%E9%A2%A8&type=note) | URL遷移ではクエリ欄が埋まるだけで結果は自動表示されない(要「検索」クリック) | 2026-07-04 | ❌ |
| 低 | タグページ | ハッシュタグ | [misskey.io/tags/天気](https://misskey.io/tags/%E5%A4%A9%E6%B0%97) | タグのノート一覧が開く | 2026-07-04 | ✅ |
| 中 | `-dog`(除外) | 除外するキーワード | [misskey.io/search?q=猫 -犬&type=note](https://misskey.io/search?q=%E7%8C%AB%20-%E7%8A%AC&type=note) | 「検索」ボタン押下後、猫と犬を含む実在の投稿が結果から消える。ログイン済みGUI操作で実際の投稿の増減を確認(2026-07-08) | 2026-07-08 | ✅ |
| 低 | `"..."`(完全一致) **機能しないと確定** | 完全一致で探す | [misskey.io/search?q="そもそもこの猫BSSを好む"&type=note](https://misskey.io/search?q=%22%E3%81%9D%E3%82%82%E3%81%9D%E3%82%82%E3%81%93%E3%81%AE%E7%8C%ABBSS%E3%82%92%E5%A5%BD%E3%82%80%22&type=note) | 実在の投稿本文をそのまま引用符で括っても0件(引用符が文字として扱われクエリを壊す)。さらに`猫 "今日"`のように他のキーワードと組み合わせると検索全体が0件になる実害を確認(2026-07-08ログイン済みGUI操作)。2026-07-10、機能しない条件を語のANDに付け替えて送る旧実装(意味を変える畳み込み)を撤回し、非対応(送らない)へ変更。キーワード欄への手動入力で代替できる | 2026-07-10 | ❌(送信しない・非対応) |

## はてなブックマーク(ログイン不要)

パラメータは公式UIのもの(壊れにくい)。引用符のフレーズ一致だけが未文書化。

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 中 | `-語` / `date_begin`/`date_end` | 除外・期間 | [b.hatena.ne.jp/search/text?q=python -入門&date_begin=2024-01-01&date_end=2024-06-30](https://b.hatena.ne.jp/search/text?q=python%20-%E5%85%A5%E9%96%80&date_begin=2024-01-01&date_end=2024-06-30) | 「入門」を含まず期間内のみ | 2026-07-04 | ✅ |
| 中 | `users=` | 最低いいね数 | [b.hatena.ne.jp/search/text?q=python&users=100](https://b.hatena.ne.jp/search/text?q=python&users=100) | 全結果が100users以上 | 2026-07-04 | ✅ |
| 低 | `"..."`(未文書化) | 完全一致 | [b.hatena.ne.jp/search/text?q="machine learning"](https://b.hatena.ne.jp/search/text?q=%22machine%20learning%22) | 引用符なしより件数が絞られる | 2026-07-04 | ✅ |
| 低 | `/search/title` / `/search/tag` / `sort=recent` | タイトルだけ・ハッシュタグ・並び順 | [b.hatena.ne.jp/search/tag?q=python 機械学習&sort=recent](https://b.hatena.ne.jp/search/tag?q=python%20%E6%A9%9F%E6%A2%B0%E5%AD%A6%E7%BF%92&sort=recent) | 両タグつきが新着順 | 2026-07-04 | ✅ |
| 中 | `safe=off`(セーフサーチ解除、2026-07-09追加) | セーフサーチを解除 | [b.hatena.ne.jp/search/text?q=猫&safe=off](https://b.hatena.ne.jp/search/text?q=%E7%8C%AB&safe=off) | サイドバーの「セーフサーチ」が「オフ」を選んだ状態になる。未ログインでも既定・挙動は同じ(WebFetchで確認) | 2026-07-09 | ✅ |

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

## tumblr(ログイン不要)

`tumblr.com/search/{q}` はコンテンツ検索(既定=人気順)、`/search/{q}/recent` で最新順。単一タグは `/tagged/{タグ}`(人気順のみ。旧 `/chrono` は廃止され `/explore/trending` へ飛ぶ=タグページの並び替えはボタンのみでURL化できない)。詳細検索/フィルタのGUIには `-除外`・`from:`(送信者)・`since:`/`before:`(期間)・`"完全一致"`・複数`#tag`・`postTypes=`(投稿タイプ)がある(2026-07-07にGUI操作で採取・実機確認)。

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 中 | `/search/{q}`(コンテンツ検索) | キーワード | [tumblr.com/search/cat](https://www.tumblr.com/search/cat) | 未ログインでも猫の投稿が並ぶ(既定=人気順)。2026-07-07実測 | 2026-07-07 | ✅ |
| 中 | `/search/{q}/recent`(最新順) | 並び順=新しい順 | [tumblr.com/search/cat/recent](https://www.tumblr.com/search/cat/recent) | 「最新」タブが選択され新着順で並ぶ。2026-07-07実測(aria-selected) | 2026-07-07 | ✅ |
| 中 | `/tagged/{タグ}`(タグページ) | ハッシュタグ | [tumblr.com/tagged/cat](https://www.tumblr.com/tagged/cat) | タグ「cat」の投稿が並ぶ(単一タグのみ・人気順固定)。2026-07-07実測 | 2026-07-07 | ✅ |
| 低 | `/tagged/{タグ}/chrono` **廃止確認** | (タグの最新順) | [tumblr.com/tagged/cat/chrono](https://www.tumblr.com/tagged/cat/chrono) | 現状は `/explore/trending` へリダイレクト=タグページの最新順URLは無い(並び替えはボタンのみ)。復活したらタグページでも並び順を送れる | 2026-07-07 | ❌(送信しない) |
| 中 | `-dog`(除外) | 除外するキーワード | [tumblr.com/search/cat -dog](https://www.tumblr.com/search/cat%20-dog) | 「cat」単独と比べてトップ結果が変わり、dogタグの投稿が上位から外れる。GUI操作で採取・実機確認(2026-07-07) | 2026-07-07 | ✅ |
| 中 | `from:staff`(送信者) | このユーザーの投稿だけ | [tumblr.com/search/from:staff](https://www.tumblr.com/search/from%3Astaff) | staffブログの投稿だけに絞られる。GUI操作で採取・実機確認(2026-07-07) | 2026-07-07 | ✅ |
| 中 | `"golden retriever puppy"`(完全一致) | 完全一致で探す | [tumblr.com/search/%22golden retriever puppy%22](https://www.tumblr.com/search/%22golden%20retriever%20puppy%22) | 語順を入れ替えた `"puppy golden retriever"` と比較するとヒットする投稿が変わり、語順まで見た真の完全一致と確認。無引用符の同じ語順とはトップ結果が一致(=無引用符はゆるい一致)。GUI操作で採取・実機確認(2026-07-07) | 2026-07-07 | ✅ |
| 中 | `#photography #sunset`(複数タグAND) | ハッシュタグ | [tumblr.com/search/#photography #sunset](https://www.tumblr.com/search/%23photography%20%23sunset) | 両方のタグを持つ投稿だけが並ぶ(AND)。GUI操作で採取・実機確認(2026-07-07) | 2026-07-07 | ✅ |
| 中 | `since:`/`before:`(期間) | 期間 | [tumblr.com/search/cat since:2020-01-01](https://www.tumblr.com/search/cat%20since%3A2020-01-01) / [before:2020-01-01](https://www.tumblr.com/search/cat%20before%3A2020-01-01) | 指定日以降/以前の投稿に絞られる。開始・終了どちらか片方だけでも独立して効く(非対称なし)。GUI操作で採取・実機確認(2026-07-07) | 2026-07-07 | ✅ |
| 中 | `?postTypes=photo,gif,video`(投稿タイプ) | 画像・動画つきの投稿だけ | [tumblr.com/search/cat?postTypes=photo](https://www.tumblr.com/search/cat?postTypes=photo) | 画像投稿だけに絞られる(`postTypes=video`だと動画投稿に変わることも確認)。GUI操作で採取・実機確認(2026-07-07) | 2026-07-07 | ✅ |
| 低 | `?postTypes=link`(投稿タイプ) | リンクを含む投稿だけ | [tumblr.com/search/cat?postTypes=link](https://www.tumblr.com/search/cat?postTypes=link) | リンクカード付きの投稿に絞られる。GUI操作で採取・実機確認(2026-07-07) | 2026-07-07 | ✅ |

## Mastodon(要ログイン)

検索ページ(`mastodon.social/search?q=&type=statuses`)はSPAだがURL遷移だけで検索が自動実行される(Misskeyと違い手動ボタン不要、2026-07-08実機確認)。本文検索は未ログインだと"hello"のような一般語でも0件になり実質ログイン必須(検索オプションパネルも「ログイン時のみ利用できます」と表示)。ハッシュタグ単独は`/tags/{tag}`でログアウトでも閲覧可能。演算子は2026-07-08にログイン済みブラウザで実際に投稿の増減を確認して裏取り(GUI操作)。

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 高 | `-語`(除外) | 除外するキーワード | [mastodon.social/search?q=internet -România&type=statuses](https://mastodon.social/search?q=internet%20-Rom%C3%A2nia&type=statuses) | 「internet」単独のトップ結果(România関連の投稿)が消え、別の投稿に変わる。2026-07-08ログイン済みで実測 | 2026-07-08 | ✅ |
| 高 | `"..."`(完全一致) | 完全一致で探す | [mastodon.social/search?q="conectivitate la internet"&type=statuses](https://mastodon.social/search?q=%22conectivitate%20la%20internet%22&type=statuses) | 語順どおりの投稿がヒットするが、語順を入れ替えた`"internet la conectivitate"`は0件になり、真の完全一致と確認 | 2026-07-08 | ✅ |
| 中 | `from:`(送信者。リモートは`from:user@host`) | このユーザーの投稿だけ | [mastodon.social/search?q=internet from:Gargron&type=statuses](https://mastodon.social/search?q=internet%20from%3AGargron&type=statuses) | 指定ユーザーの投稿だけに絞られる(別ユーザーの同キーワード投稿は出ない) | 2026-07-08 | ✅ |
| 中 | `before:`/`after:`(期間) | 期間 | [before:2022-01-01](https://mastodon.social/search?q=internet%20from%3AGargron%20before%3A2022-01-01&type=statuses) / [after:2023-01-01](https://mastodon.social/search?q=internet%20from%3AGargron%20after%3A2023-01-01&type=statuses) | 指定日の前後で異なる投稿に絞られる(2021年の投稿 vs 2024年の投稿) | 2026-07-08 | ✅ |
| 中 | `-is:reply`(返信を除く) | 返信を除外 | [mastodon.social/search?q=internet from:Gargron -is:reply&type=statuses](https://mastodon.social/search?q=internet%20from%3AGargron%20-is%3Areply&type=statuses) | 返信投稿が結果から消え、通常投稿に変わる | 2026-07-08 | ✅ |
| 中 | `language:`(言語) | 言語 | [mastodon.social/search?q=internet language:ro&type=statuses](https://mastodon.social/search?q=internet%20language%3Aro&type=statuses) | 指定言語の投稿だけに絞られる(ルーマニア語の投稿に変わる) | 2026-07-08 | ✅ |
| 中 | `has:media`/`has:link` | メディア・リンク | [has:link](https://mastodon.social/search?q=internet%20from%3AGargron%20before%3A2022-01-01%20has%3Alink&type=statuses) | `has:media`と`has:link`で異なる投稿に絞られる(画像添付 vs リンクカード) | 2026-07-08 | ✅ |
| 低 | `/tags/{tag}`(タグページ) | ハッシュタグ | [mastodon.social/tags/cats](https://mastodon.social/tags/cats) | 未ログインでもタグの投稿一覧が表示される | 2026-07-08 | ✅ |

## Pinterest(ログイン不要)

`pinterest.com/search/pins/?q=` で未ログインでも検索できる。フィルターパネル(調整アイコン)は「すべてのピン/動画/ボード/プロフィール」の4択のみ(期間・並び順・送信者・ハッシュタグは無し)で、選ぶとパスが`/search/{pins|videos|boards|users}/`に切り替わる。検索は関連度ベースのゆるい一致で、公式のBoolean演算子は無い(2026-07-08にGUI操作で実測)。

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 高 | `-語`(除外) **効かない** | 除外するキーワード | [pinterest.com/search/pins/?q=black cat -orange](https://www.pinterest.com/search/pins/?q=black%20cat%20-orange) | Pinterest自身が「"black cat orange"の検索結果です」と表示し、`-`を除外でなく検索語の一部として扱う(除外は機能しない)。2026-07-08実測につきDialectはexclude非対応(none)で実装 | 2026-07-08 | ❌(送信しない) |
| 中 | `/search/videos/`・`/search/boards/`・`/search/users/`(探すもの) | 探すもの | [videos](https://www.pinterest.com/search/videos/?q=cats) / [boards](https://www.pinterest.com/search/boards/?q=cats) / [users](https://www.pinterest.com/search/users/?q=cats) | それぞれ動画ピン・ボード・プロフィールの一覧に絞られる。フィルターパネルの選択で実際にパスが切り替わることを確認 | 2026-07-08 | ✅ |
| 低 | `?q=`(キーワード) | キーワード | [pinterest.com/search/pins/?q=black cat](https://www.pinterest.com/search/pins/?q=black%20cat) | 黒猫の画像がおおむね並ぶ(関連度ベースのため一部語だけの結果も混ざりうる) | 2026-07-08 | ✅ |

## FANBOX(ログイン不要)

検索欄は「クリエイター・タグを検索」のみで、投稿本文の全文キーワード検索は存在しない。`/search?type=creator&q=`はクリエイター名の部分一致検索(投稿の絞り込みではない)、`/search?type=tag&q=`はタグ名候補のサジェストで、複数語を入れても「両方を含むタグ名」を探すだけで投稿のAND検索にはならない(2026-07-08にGUI操作で実測)。投稿一覧として機能するのは単一タグのページ`/tags/{タグ}`のみで、並び順・除外・期間・送信者などの絞り込みは一切無い。タグページ自体は未ログインで閲覧できる(投稿の中身は支援額に応じてロックされるが、これは検索機能とは別のコンテンツ課金)。

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 中 | `/tags/{タグ}`(タグページ) | ハッシュタグ | [fanbox.cc/tags/猫](https://www.fanbox.cc/tags/%E7%8C%AB) | タグ「猫」の投稿一覧が未ログインでも表示される(単一タグのみ) | 2026-07-08 | ✅ |
| 低 | `?type=tag&q=猫 犬`(複数語) **AND検索にならない** | (該当UIなし) | [fanbox.cc/search?type=tag&q=猫 犬](https://www.fanbox.cc/search?type=tag&q=%E7%8C%AB%20%E7%8A%AC) | 「猫」と「犬」の両方の文字を含むタグ名(例:「犬猫」)の候補一覧が出るだけで、投稿のAND検索にはならない。2026-07-08実測につきDialectは複数タグ入力時は検索不可(null)として実装 | 2026-07-08 | ❌(送信しない) |

## bilibili(ログイン不要)

`search.bilibili.com/{タブ}?keyword=` で未ログインでも検索できる(日本からのアクセスで地域ブロックなし)。タブ=综合`/all`・视频`/video`・番剧`/bangumi`・影视`/pgc`・直播`/live`・专栏`/article`・用户`/upuser`。並び順(`order=`)はタブごとに違い、日付範囲(`pubtime_begin_s/pubtime_end_s`=エポック秒)と動画の長さ(`duration=`)は「更多筛选」パネルにある(all/videoのみ)。除外(`-語`)・引用符の完全一致は効かない(2026-07-08にGUI操作+URL叩きで実測)。

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 中 | `order=pubdate`(最新发布) | 並び順=新しい順 | [search.bilibili.com/all?keyword=猫&order=pubdate](https://search.bilibili.com/all?keyword=%E7%8C%AB&order=pubdate) | 「刚刚」「N分钟前」と数分前の投稿が先頭に並ぶ(実測)。「最新发布」ボタンがアクティブになる | 2026-07-08 | ✅ |
| 中 | `order=click`(最多播放/最多点击) | 並び順=人気順 | [search.bilibili.com/video?keyword=猫&order=click](https://search.bilibili.com/video?keyword=%E7%8C%AB&order=click) | 再生数の多い動画が先頭に並ぶ。フィルタUIの実操作でこのパラメータが生成されることを確認 | 2026-07-08 | ✅ |
| 高 | `order=dm`(最多弹幕) | 並び順=弾幕数順 | [search.bilibili.com/video?keyword=猫&order=dm](https://search.bilibili.com/video?keyword=%E7%8C%AB&order=dm) | 弾幕数の多い動画が先頭に並ぶ(GUI操作で採取) | 2026-07-08 | ✅ |
| 高 | `order=stow`(最多收藏) | 並び順=収蔵数順 | [search.bilibili.com/video?keyword=猫&order=stow](https://search.bilibili.com/video?keyword=%E7%8C%AB&order=stow) | 収蔵(お気に入り)数の多い動画が先頭に並ぶ(GUI操作で採取) | 2026-07-08 | ✅ |
| 高 | `order=attention`(最多喜欢) | 並び順=いいね順(コラム) | [search.bilibili.com/article?keyword=猫&order=attention](https://search.bilibili.com/article?keyword=%E7%8C%AB&order=attention) | いいね数の多いコラムが先頭に並ぶ(GUI操作で採取) | 2026-07-08 | ✅ |
| 高 | `order=scores`(最多评论) | 並び順=コメント数順(コラム) | [search.bilibili.com/article?keyword=猫&order=scores](https://search.bilibili.com/article?keyword=%E7%8C%AB&order=scores) | コメント数の多いコラムが先頭に並ぶ(GUI操作で採取) | 2026-07-08 | ✅ |
| 中 | `order=live_time`(最新开播) | 並び順=新しい順(生放送) | [search.bilibili.com/live?keyword=猫&order=live_time](https://search.bilibili.com/live?keyword=%E7%8C%AB&order=live_time) | 配信開始が新しい順に並ぶ(「最新开播」ボタンの実クリックで採取) | 2026-07-08 | ✅ |
| 高 | `pubtime_begin_s`/`pubtime_end_s`(日付範囲) | 期間 | [2026年6月指定](https://search.bilibili.com/all?keyword=%E7%8C%AB&order=pubdate&pubtime_begin_s=1780243200&pubtime_end_s=1782835199) | 新着順の先頭が06-30になり、7月以降の投稿が混ざらない(実測)。値は中国標準時(UTC+8)のエポック秒 | 2026-07-08 | ✅ |
| 中 | `duration=1〜4`(動画の長さ) | 動画の長さ | [duration=4(60分超)](https://search.bilibili.com/all?keyword=%E7%8C%AB&duration=4) | 1時間超の動画が主体になる(duration=1は10分未満、duration=2は10-30分、duration=3は30-60分、duration=4は60分超。「更多筛选」の実操作で採取) | 2026-07-08 | ✅ |
| 中 | タブ切替(`/video`・`/bangumi`・`/pgc`・`/live`・`/article`・`/upuser`) | 探すものの種類 | [video](https://search.bilibili.com/video?keyword=%E7%8C%AB) / [bangumi](https://search.bilibili.com/bangumi?keyword=%E7%8C%AB) / [article](https://search.bilibili.com/article?keyword=%E7%8C%AB) | それぞれ動画・アニメ番組・コラムの一覧に絞られる。タブの実クリックでパスが切り替わることを確認 | 2026-07-08 | ✅ |
| 低 | `-語`(除外) **効かない** | 除外するキーワード | [search.bilibili.com/video?keyword=猫 -狗](https://search.bilibili.com/video?keyword=%E7%8C%AB%20-%E7%8B%97) | `-狗`が文字として検索語に混入し、犬の動画が結果に残る(除外は機能しない)。2026-07-08実測につきDialectはexclude非対応(none)で実装 | 2026-07-08 | ❌(送信しない) |

## Fantia(要ログイン)

検索機能自体がログイン必須(未ログインだとログインページへリダイレクト)。以下はログイン済みブラウザでの実操作採取。

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 高 | `keyword_type=all`(タイトルと本文) | タイトルだけで探す(OFF) | [fantia.jp/posts?brand_type=3&keyword=猫&keyword_type=all](https://fantia.jp/posts?brand_type=3&keyword=%E7%8C%AB&keyword_type=all) | 本文にのみ「猫」を含む投稿もヒットする(タイトルのみのときより件数が増える) | 2026-07-09 | ✅ |
| 中 | `keyword_type=title_only`(タイトルのみ、既定) | タイトルだけで探す(ON) | [fantia.jp/posts?brand_type=3&keyword=猫&keyword_type=title_only](https://fantia.jp/posts?brand_type=3&keyword=%E7%8C%AB&keyword_type=title_only) | タイトルに「猫」を含む投稿だけがヒットする | 2026-07-09 | ✅ |
| 高 | `category=illust`(カテゴリー) | カテゴリー | [fantia.jp/posts?brand_type=3&keyword=猫&category=illust](https://fantia.jp/posts?brand_type=3&keyword=%E7%8C%AB&category=illust) | イラストカテゴリーの投稿だけに絞られる(詳細検索パネルの「イラスト」チップの実クリックで採取したパラメータ名・値) | 2026-07-09 | ✅ |
| 中 | `brand_type=0`(男性向け) | 対象読者=男性向け(R18) | [fantia.jp/posts?brand_type=0&keyword=猫](https://fantia.jp/posts?brand_type=0&keyword=%E7%8C%AB) | 男性向けR18タブの投稿だけに絞られる(タブの実クリックで採取) | 2026-07-09 | ✅ |
| 中 | `brand_type=2`(女性向け) | 対象読者=女性向け(R18) | [fantia.jp/posts?brand_type=2&keyword=猫](https://fantia.jp/posts?brand_type=2&keyword=%E7%8C%AB) | 女性向けR18タブの投稿だけに絞られる(タブの実クリックで採取) | 2026-07-09 | ✅ |
| 中 | `order=newer`(投稿の新しい順) | 並び順=新しい順 | [fantia.jp/posts?brand_type=3&keyword=猫&order=newer](https://fantia.jp/posts?brand_type=3&keyword=%E7%8C%AB&order=newer) | 投稿日時が新しい順に並ぶ(並び順セレクトの実操作で採取) | 2026-07-09 | ✅ |
| 中 | `order=popular`(お気に入り数順) | 並び順=人気順 | [fantia.jp/posts?brand_type=3&keyword=猫&order=popular](https://fantia.jp/posts?brand_type=3&keyword=%E7%8C%AB&order=popular) | お気に入り(★)数の多い投稿が先頭に並ぶ(並び順セレクトの実操作で採取) | 2026-07-09 | ✅ |
| 低 | `-語`(除外) **効かない** | 除外するキーワード | [fantia.jp/posts?brand_type=3&keyword=猫 -犬&keyword_type=all](https://fantia.jp/posts?brand_type=3&keyword=%E7%8C%AB%20-%E7%8A%AC&keyword_type=all) | `-犬`が文字として検索語に混入し0件になる(除外は機能しない)。2026-07-09実測につきDialectはexclude非対応(none)で実装 | 2026-07-09 | ❌(送信しない) |
| 低 | `"..."`(完全一致) **効かない** | 完全一致で探す | [fantia.jp/posts?brand_type=3&keyword="猫耳メイド"&keyword_type=all](https://fantia.jp/posts?brand_type=3&keyword=%22%E7%8C%AB%E8%80%B3%E3%83%A1%E3%82%A4%E3%83%89%22&keyword_type=all) | 引用符ごと文字列として要求され0件になる(引用符なしの同じ語では多数ヒット)。2026-07-09実測につきDialectはexactPhrase非対応(none)で実装 | 2026-07-09 | ❌(送信しない) |

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
| 低 | `/illustrations?type=ugoira`(うごくイラスト、2026-07-06追加) | 作品の種類=うごくイラスト | [pixiv.net/tags/初音ミク/illustrations?type=ugoira](https://www.pixiv.net/tags/%E5%88%9D%E9%9F%B3%E3%83%9F%E3%82%AF/illustrations?type=ugoira) | うごくイラスト(アニメーション)だけに絞られる。専用パスが無いため illustrations に type=ugoira を付ける。2026-07-06実測(全72万→約7千) | 2026-07-06 | ✅ |
| 低 | パス `/novels`(小説、2026-07-06追加) | 作品の種類=小説 | [pixiv.net/tags/初音ミク/novels](https://www.pixiv.net/tags/%E5%88%9D%E9%9F%B3%E3%83%9F%E3%82%AF/novels) | 小説作品だけが並ぶ | 2026-07-06 | ✅ |

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
| 2026-07-07 | **フェーズ0(コードが送る演算子⇄チェックリストの照合)を機械化**: `npm run check:operators`([scripts/check-operators.ts](../scripts/check-operators.ts))を追加しCIのマージゲートに載せた。既存演算子は全て自己検証(buildUrl出力に実在)を通過。**第2次採用(2026-07-06)で行の追加が漏れていた niconico `genre=`・pixiv `s_mode=s_tag_full`(タグ完全一致)・`type=ugoira`(うごくイラスト)・`/novels`(小説) の4件を、実装時の実測値を根拠に遡って追加**(この照合スクリプトが自動検出した) |
