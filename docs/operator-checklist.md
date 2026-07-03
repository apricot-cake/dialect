# 演算子の定期動作確認チェックリスト

Dialect が送信する検索演算子・URLパラメータの動作確認手順。非公式(undocumented)な演算子は予告なく死ぬため、定期的にこのリストを上から実行して確認日を更新する。調査の経緯・出典は [operator-research.md](operator-research.md) を参照。

## 運用ルール

- **頻度**: 3か月ごとを目安。加えて「動かない」というユーザー報告があったときは該当項目を即確認する
- **確認方法**: 「検証URL」をブラウザで開き、「期待する結果」と見比べるだけ。API・ツールは不要
- **記録**: 確認したら「最終確認」列の日付を更新する。挙動が変わっていたら ✅→❌ に変え、該当プラットフォームの `src/core/platforms/*.ts` の support レベル・注記(`src/i18n/ja.ts`)を直し、[operator-research.md](operator-research.md) に経緯を追記する
- **優先度**: 表は上ほど壊れやすい(非公式・公式フォーム削除済み・未文書化)。時間がなければ「優先」欄が「高」の行だけでも確認する
- 検証URLのキーワード(台風・天気など)は時事性があるため、結果が少なすぎる場合は適当な頻出語に読み替えてよい

## X(要ログイン)

全演算子が非公式。特に min_faves 系と blue_verified は公式の検索フォームから削除済みで、削除リスクが最も高い。

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 高 | `min_faves:` | 最低いいね数 | [x.com/search?q=台風 min_faves:500&f=live](https://x.com/search?q=%E5%8F%B0%E9%A2%A8%20min_faves%3A500&f=live) | 全結果が500いいね以上 | 2026-07-02 | ✅ |
| 高 | `min_retweets:` | 最低リポスト数 | [x.com/search?q=台風 min_retweets:500&f=live](https://x.com/search?q=%E5%8F%B0%E9%A2%A8%20min_retweets%3A500&f=live) | 全結果が500リポスト以上 | 未検証 | — |
| 高 | `filter:blue_verified` | 認証済みアカウントだけ | [x.com/search?q=台風 filter:blue_verified&f=live](https://x.com/search?q=%E5%8F%B0%E9%A2%A8%20filter%3Ablue_verified&f=live) | 全結果が認証済み(青バッジ) | 未検証 | — |
| 中 | `since:`/`until:` | 期間 | [x.com/search?q=台風 since:2026-06-01 until:2026-06-08&f=live](https://x.com/search?q=%E5%8F%B0%E9%A2%A8%20since%3A2026-06-01%20until%3A2026-06-08&f=live) | 全結果が期間内(untilの日は含まない) | 2026-07-02(調査) | ✅ |
| 中 | `filter:media` | 画像・動画つきだけ | [x.com/search?q=台風 filter:media&f=live](https://x.com/search?q=%E5%8F%B0%E9%A2%A8%20filter%3Amedia&f=live) | 全結果にメディアつき | 2026-07-02(調査) | ✅ |
| 中 | `-filter:replies` | リプライを除く | [x.com/search?q=台風 -filter:replies&f=live](https://x.com/search?q=%E5%8F%B0%E9%A2%A8%20-filter%3Areplies&f=live) | 結果にリプライが混ざらない | 2026-07-02(調査) | ✅ |
| 低 | `from:` / `to:` / `-語` / `"..."` / `lang:ja` / `f=live` | ユーザー指定・除外ほか | [x.com/search?q="計画運休" -広告 lang:ja&f=live](https://x.com/search?q=%22%E8%A8%88%E7%94%BB%E9%81%8B%E4%BC%91%22%20-%E5%BA%83%E5%91%8A%20lang%3Aja&f=live) | 完全一致・除外・日本語絞りが効き「最新」タブで開く | 2026-07-02(調査) | ✅ |

※「(調査)」= Web上の情報・公式リファレンスベースの確認。ブラウザ実測は日付のみ表記。

## Bluesky(ログイン不要)

演算子は公式ドキュメントがある(唯一)。除外と tab= だけが未文書化。

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 高 | `-語`(未文書化) | 除外するキーワード | [bsky.app/search?q=天気 -雨](https://bsky.app/search?q=%E5%A4%A9%E6%B0%97%20-%E9%9B%A8) | 結果に単語「雨」を含む投稿がない(「梅雨」は別トークンなので残ってよい) | 2026-07-02 | ✅ |
| 高 | `tab=latest`(未文書化) | 並び順=新しい順 | [bsky.app/search?q=天気&tab=latest](https://bsky.app/search?q=%E5%A4%A9%E6%B0%97&tab=latest) | 「最新」タブが選択された状態で開く | 2026-07-02 | ✅ |
| 低 | `from:` / `mentions:` / `domain:` / `since:`/`until:` / `lang:`(公式) | ユーザー指定ほか | [bsky.app/search?q=天気 lang:ja since:2026-06-01](https://bsky.app/search?q=%E5%A4%A9%E6%B0%97%20lang%3Aja%20since%3A2026-06-01) | 日本語のみ・期間内のみ | 2026-07-02(調査) | ✅ |

## YouTube(ログイン不要)

sp= はprotobufの計算値。2026-01の検索フィルタ再編以降、値が個別に無効化されることがある(CAI系で実例あり)。

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 高 | `after:` / `before:` | 期間 | [youtube.com/results?search_query=紫陽花 after:2026-06-25](https://www.youtube.com/results?search_query=%E7%B4%AB%E9%99%BD%E8%8A%B1%20after%3A2026-06-25) | 全結果が指定日以降の投稿 | 2026-07-02 | ✅ |
| 高 | `sp=CAM%3D`(視聴回数順) | 並び順=人気順 | [youtube.com/results?search_query=紫陽花&sp=CAM%3D](https://www.youtube.com/results?search_query=%E7%B4%AB%E9%99%BD%E8%8A%B1&sp=CAM%3D) | 視聴回数の厳密な降順 | 2026-07-03 | ✅ |
| 高 | `sp=CAMSAhgB`(視聴回数順+4分未満) | 人気順+動画の長さ | [youtube.com/results?search_query=猫&sp=CAMSAhgB](https://www.youtube.com/results?search_query=%E7%8C%AB&sp=CAMSAhgB) | 視聴回数降順かつ全結果が4分未満 | 2026-07-03 | ✅ |
| 高 | `sp=CAI%3D`(アップロード日順)**復活チェック** | 並び順=新しい順 | [youtube.com/results?search_query=台風&sp=CAI%3D](https://www.youtube.com/results?search_query=%E5%8F%B0%E9%A2%A8&sp=CAI%3D) | 現状は**効かない**(関連度のまま)。時系列に並ぶようになったら復活→UI注記 `note.youtube.sort` を修正 | 2026-07-03 | ❌(送信は継続) |
| 中 | `-語` | 除外するキーワード | [youtube.com/results?search_query=猫 -犬](https://www.youtube.com/results?search_query=%E7%8C%AB%20-%E7%8A%AC) | タイトル・概要に「犬」を含む動画が上位に出ない(もともと信頼度中) | 未検証 | — |
| 中 | `intitle:` | タイトルだけで探す | [youtube.com/results?search_query=intitle:紫陽花](https://www.youtube.com/results?search_query=intitle%3A%E7%B4%AB%E9%99%BD%E8%8A%B1) | 全結果のタイトルに「紫陽花」を含む | 未検証 | — |
| 中 | `sp=EgIYAQ%3D%3D`(4分未満、長さ単独) | 動画の長さ | [youtube.com/results?search_query=猫&sp=EgIYAQ%3D%3D](https://www.youtube.com/results?search_query=%E7%8C%AB&sp=EgIYAQ%3D%3D) | 全結果が4分未満 | 2026-07-02(調査) | ✅ |
| 低 | 引用符(効かないことの確認) | 完全一致 | [youtube.com/results?search_query="冷蔵庫で富士山を冷やす"](https://www.youtube.com/results?search_query=%22%E5%86%B7%E8%94%B5%E5%BA%AB%E3%81%A7%E5%AF%8C%E5%A3%AB%E5%B1%B1%E3%82%92%E5%86%B7%E3%82%84%E3%81%99%22) | 存在しないフレーズでも通常検索の結果が返る=引用符は実質無視(UI注記の根拠)。厳密に効くようになったら注記を緩める | 2026-07-02 | ❌(注記済み) |
| 低 | チャンネル内検索URL | このユーザーの投稿だけ | [youtube.com/@NHK/search?query=台風](https://www.youtube.com/@NHK/search?query=%E5%8F%B0%E9%A2%A8) | チャンネル内の検索結果ページが開く | 2026-07-02(調査) | ✅ |

## note(ログイン不要)

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 中 | `from:@noteID`(公式) | このユーザーの投稿だけ | [note.com/search?context=note&q=from:@info&sort=new](https://note.com/search?context=note&q=from%3A%40info&sort=new) | note公式アカウントの記事だけが並ぶ | 2026-07-02 | ✅ |
| 中 | `sort=new` | 並び順=新しい順 | [note.com/search?context=note&q=台風&sort=new](https://note.com/search?context=note&q=%E5%8F%B0%E9%A2%A8&sort=new) | 新着順で並ぶ | 2026-07-02 | ✅ |
| 低 | ハッシュタグページ | ハッシュタグ | [note.com/hashtag/読書記録](https://note.com/hashtag/%E8%AA%AD%E6%9B%B8%E8%A8%98%E9%8C%B2) | タグの記事一覧が開く | 2026-07-02(調査) | ✅ |

## niconico(ログイン不要)

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 中 | `start=`/`end=`(任意期間) | 期間 | [nicovideo.jp/search/台風?start=2026-06-01&end=2026-06-30&sort=f&order=d](https://www.nicovideo.jp/search/%E5%8F%B0%E9%A2%A8?start=2026-06-01&end=2026-06-30&sort=f&order=d) | 全結果が6月の投稿・新着順 | 2026-07-02 | ✅ |
| 中 | OR並置文法(括弧なし) | どれかを含む指定 | [nicovideo.jp/search/猫 OR 犬 手芸](https://www.nicovideo.jp/search/%E7%8C%AB%20OR%20%E7%8A%AC%20%E6%89%8B%E8%8A%B8) | (猫 OR 犬) AND 手芸 として絞り込まれる(件数が「猫 手芸」+「犬 手芸」程度) | 2026-07-02 | ✅ |
| 中 | `sort=h`(人気順) | 並び順=人気順 | [nicovideo.jp/search/台風?sort=h](https://www.nicovideo.jp/search/%E5%8F%B0%E9%A2%A8?sort=h) | 注目度順で並ぶ | 2026-07-02 | ✅ |
| 低 | タグページ+除外 | ハッシュタグ・除外 | [nicovideo.jp/tag/ゲーム -実況](https://www.nicovideo.jp/tag/%E3%82%B2%E3%83%BC%E3%83%A0%20-%E5%AE%9F%E6%B3%81) | タグ一致かつ「実況」を除外した一覧 | 2026-07-02 | ✅ |

## Reddit(ログイン不要)

Boolean演算子は公式仕様のため壊れにくい。old.reddit.com は2026年8月からログイン必須化予定だが Dialect は使っていない。

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 中 | `AND` / `NOT (...)` | キーワード・除外 | [reddit.com/search/?q=typhoon AND japan NOT (anime)](https://www.reddit.com/search/?q=typhoon%20AND%20japan%20NOT%20%28anime%29) | 両語を含み anime を含まない | 2026-07-02(調査) | ✅ |
| 中 | `author:` / `subreddit:` | ユーザー指定・コミュニティ | [reddit.com/search/?q=subreddit:japan typhoon](https://www.reddit.com/search/?q=subreddit%3Ajapan%20typhoon) | r/japan 内の結果のみ | 2026-07-02(調査) | ✅ |
| 低 | `sort=new` / `t=week` | 並び順・期間の丸め | [reddit.com/search/?q=typhoon&sort=new&t=week](https://www.reddit.com/search/?q=typhoon&sort=new&t=week) | 新着順・1週間以内 | 2026-07-02(調査) | ✅ |

## Threads(要ログイン)

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 高 | `filter=recent` | 並び順=新しい順 | [threads.com/search?q=台風&filter=recent](https://www.threads.com/search?q=%E5%8F%B0%E9%A2%A8&filter=recent) | 新着順の結果が開く | 2026-07-02(調査) | ✅ |
| 高 | `from_author=` | このユーザーの投稿だけ | [threads.com/search?q=news&from_author=zuck](https://www.threads.com/search?q=news&from_author=zuck) | 指定ユーザーの投稿のみ(キーワード併用時は不安定なことあり=注記済み) | 2026-07-02(調査) | ✅ |
| 低 | タグページ | ハッシュタグ | [threads.com/tag/読書記録](https://www.threads.com/tag/%E8%AA%AD%E6%9B%B8%E8%A8%98%E9%8C%B2) | タグの投稿一覧(ログアウトでも一部表示) | 2026-07-02(調査) | ✅ |

## TikTok / Instagram / Facebook(URL存続チェックのみ)

演算子がほぼないため、検索URL自体が生きているかだけ確認する。

| 優先 | 対象 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|
| 中 | TikTok 検索URL | [tiktok.com/search?q=台風](https://www.tiktok.com/search?q=%E5%8F%B0%E9%A2%A8) | 検索結果が表示される(ログインモーダルは閉じられる) | 2026-07-02(調査) | ✅ |
| 中 | Instagram 検索URL | [instagram.com/explore/search/keyword/?q=台風](https://www.instagram.com/explore/search/keyword/?q=%E5%8F%B0%E9%A2%A8) | ログイン済みなら検索結果へ(未ログインはログイン画面=仕様) | 2026-07-02(調査) | ✅ |
| 中 | Facebook 検索URL | [facebook.com/search/top/?q=台風](https://www.facebook.com/search/top/?q=%E5%8F%B0%E9%A2%A8) | ログイン済みなら検索結果へ | 2026-07-02(調査) | ✅ |

## pixiv(ログイン不要)

OR・除外は公式ヘルプ記載のため壊れにくい。期間(scd=/ecd=)だけが非公式で未実測。

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 高 | `scd=`/`ecd=`(任意期間) | 期間 | [pixiv.net/tags/猫/artworks?scd=2026-06-01&ecd=2026-06-30&order=date_d](https://www.pixiv.net/tags/%E7%8C%AB/artworks?scd=2026-06-01&ecd=2026-06-30&order=date_d) | 全結果が6月の投稿 | 未検証 | — |
| 中 | `order=popular_d`(人気順) | 並び順=人気順 | [pixiv.net/tags/猫/artworks?order=popular_d](https://www.pixiv.net/tags/%E7%8C%AB/artworks?order=popular_d) | プレミアム会員なら人気順(非会員は新着のまま=注記済み) | 2026-07-03(調査) | ✅ |
| 低 | `OR` / `-語`(公式) | どれかを含む・除外 | [pixiv.net/tags/(猫 OR 犬) -腐向け/artworks](https://www.pixiv.net/tags/(%E7%8C%AB%20OR%20%E7%8A%AC)%20-%E8%85%90%E5%90%91%E3%81%91/artworks) | 猫か犬のタグを含み「腐向け」を除外 | 2026-07-03(調査) | ✅ |

## Misskey.io(要ログイン)

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 高 | `username=`(非公式) | このユーザーの投稿だけ | [misskey.io/search?q=天気&type=note&username=syuilo](https://misskey.io/search?q=%E5%A4%A9%E6%B0%97&type=note&username=syuilo) | ユーザー入力欄が埋まった状態で該当ユーザーのノートのみ | 未検証 | — |
| 中 | 検索URL | キーワード | [misskey.io/search?q=台風&type=note](https://misskey.io/search?q=%E5%8F%B0%E9%A2%A8&type=note) | ログイン済みならノート検索結果が表示される | 2026-07-03(調査) | ✅ |
| 低 | タグページ | ハッシュタグ | [misskey.io/tags/天気](https://misskey.io/tags/%E5%A4%A9%E6%B0%97) | タグのノート一覧が開く | 2026-07-03(調査) | ✅ |

## はてなブックマーク(ログイン不要)

パラメータは公式UIのもの(壊れにくい)。引用符のフレーズ一致だけが未文書化。

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 中 | `-語` / `date_begin`/`date_end` | 除外・期間 | [b.hatena.ne.jp/search/text?q=python -入門&date_begin=2024-01-01&date_end=2024-06-30](https://b.hatena.ne.jp/search/text?q=python%20-%E5%85%A5%E9%96%80&date_begin=2024-01-01&date_end=2024-06-30) | 「入門」を含まず期間内のみ | 2026-07-03 | ✅ |
| 中 | `users=` | 最低いいね数 | [b.hatena.ne.jp/search/text?q=python&users=100](https://b.hatena.ne.jp/search/text?q=python&users=100) | 全結果が100users以上 | 2026-07-03 | ✅ |
| 低 | `"..."`(未文書化) | 完全一致 | [b.hatena.ne.jp/search/text?q="machine learning"](https://b.hatena.ne.jp/search/text?q=%22machine%20learning%22) | 引用符なしより件数が絞られる | 2026-07-03 | ✅ |
| 低 | `/search/title` / `/search/tag` / `sort=recent` | タイトルだけ・ハッシュタグ・並び順 | [b.hatena.ne.jp/search/tag?q=python 機械学習&sort=recent](https://b.hatena.ne.jp/search/tag?q=python%20%E6%A9%9F%E6%A2%B0%E5%AD%A6%E7%BF%92&sort=recent) | 両タグつきが新着順 | 2026-07-03 | ✅ |

## Mastodon mstdn.jp(タグページのみ)

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 中 | タグページ | ハッシュタグ | [mstdn.jp/tags/猫](https://mstdn.jp/tags/%E7%8C%AB) | 未ログインでタグの投稿一覧 | 2026-07-03 | ✅ |
| 中 | `?q=` **対応チェック** | (キーワード) | [mstdn.jp/search?q=天気](https://mstdn.jp/search?q=%E5%A4%A9%E6%B0%97) | 現状は検索欄が空のまま(v4.3系)。**mstdn.jpがv4.4系に更新されたら検索欄に入るようになる**→キーワード対応を実装 | 2026-07-03 | ❌(v4.4待ち) |

## Twitch(ログイン不要)

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 中 | `type=videos` / `type=channels` | 探すもの | [twitch.tv/search?term=minecraft&type=videos](https://www.twitch.tv/search?term=minecraft&type=videos) | 「過去のビデオ」だけの結果 | 2026-07-03 | ✅ |
| 低 | 検索URL | キーワード | [twitch.tv/search?term=ポケモン](https://www.twitch.tv/search?term=%E3%83%9D%E3%82%B1%E3%83%A2%E3%83%B3) | 検索結果が表示される | 2026-07-03 | ✅ |

## 5ちゃんねる(ff5ch.syoboi.jp、ログイン不要)

外部のスレタイ検索サービスのため、サービス自体の存続を最優先で確認する。

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 高 | サービス存続+AND | キーワード | [ff5ch.syoboi.jp/?q=テスト 書き込み](https://ff5ch.syoboi.jp/?q=%E3%83%86%E3%82%B9%E3%83%88%20%E6%9B%B8%E3%81%8D%E8%BE%BC%E3%81%BF) | 全結果のスレタイに両語を含む | 2026-07-03 | ✅ |
| 中 | `-語` / `@板ID` | 除外・コミュニティ | [ff5ch.syoboi.jp/?q=テスト -書き込み @sony](https://ff5ch.syoboi.jp/?q=%E3%83%86%E3%82%B9%E3%83%88%20-%E6%9B%B8%E3%81%8D%E8%BE%BC%E3%81%BF%20%40sony) | sony板のみ・除外語を含まない | 2026-07-03 | ✅ |
| 低 | 公式find.5ch.ioのAND **復活チェック** | (キーワード) | [find.5ch.io/search?q=Python 初心者](https://find.5ch.io/search?q=Python%20%E5%88%9D%E5%BF%83%E8%80%85) | 現状は片方の語だけの結果が混ざる(関連度ベース)。ANDになったら公式への切替を検討 | 2026-07-03 | ❌(ff5chを継続) |

## あにまん掲示板(ログイン不要)

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 中 | `/searchRes/`(レス本文β) | キーワード | [bbs.animanch.com/searchRes/アニメ 映画](https://bbs.animanch.com/searchRes/%E3%82%A2%E3%83%8B%E3%83%A1%20%E6%98%A0%E7%94%BB) | 本文に両語を含むスレ一覧 | 2026-07-03 | ✅ |
| 中 | `/search2/`(過去ログタイトル) | タイトルだけで探す | [bbs.animanch.com/search2/アニメ 映画](https://bbs.animanch.com/search2/%E3%82%A2%E3%83%8B%E3%83%A1%20%E6%98%A0%E7%94%BB) | タイトルに両語を含む全期間の一覧 | 2026-07-03 | ✅ |

## ニコニコ静画(ログイン不要)

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 中 | AND+`-語` | キーワード・除外 | [seiga.nicovideo.jp/search/初音ミク -ネギ?target=illust_all](https://seiga.nicovideo.jp/search/%E5%88%9D%E9%9F%B3%E3%83%9F%E3%82%AF%20-%E3%83%8D%E3%82%AE?target=illust_all) | 「ネギ」を含む作品が出ない(除外の件数整合は2026-07-03実測済み) | 2026-07-03 | ✅ |
| 中 | `sort=image_created` / `image_view` | 並び順 | [seiga.nicovideo.jp/search/初音ミク?target=illust_all&sort=image_created](https://seiga.nicovideo.jp/search/%E5%88%9D%E9%9F%B3%E3%83%9F%E3%82%AF?target=illust_all&sort=image_created) | 投稿の新しい順で並ぶ | 2026-07-03 | ✅ |
| 低 | タグページ / マンガ検索 | ハッシュタグ・作品の種類 | [seiga.nicovideo.jp/tag/初音ミク](https://seiga.nicovideo.jp/tag/%E5%88%9D%E9%9F%B3%E3%83%9F%E3%82%AF) / [manga.nicovideo.jp/search?q=料理](https://manga.nicovideo.jp/search?q=%E6%96%99%E7%90%86) | タグ一覧/マンガの検索結果 | 2026-07-03 | ✅ |

## YouTube 追加分(探すもの)

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 中 | `sp=EgIQAg%3D%3D`(種別チャンネル) | 探すもの=チャンネル | [youtube.com/results?search_query=料理&sp=EgIQAg%3D%3D](https://www.youtube.com/results?search_query=%E6%96%99%E7%90%86&sp=EgIQAg%3D%3D) | チャンネルだけが並ぶ | 2026-07-02(調査) | ✅ |
| 中 | `sp=CAMSBBABGAE%3D`(人気順+動画+短い、合成値) | 探すもの+並び順+長さ | [youtube.com/results?search_query=猫&sp=CAMSBBABGAE%3D](https://www.youtube.com/results?search_query=%E7%8C%AB&sp=CAMSBBABGAE%3D) | 視聴回数降順・動画のみ・4分未満 | 未検証(計算値) | — |

## pixiv 追加分(作品の種類)

| 優先 | 対象 | DialectのUI名 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|---|
| 低 | パス `/illustrations` / `/manga` | 作品の種類 | [pixiv.net/tags/猫/manga](https://www.pixiv.net/tags/%E7%8C%AB/manga) | マンガ作品だけが並ぶ | 2026-07-03(調査) | ✅ |

## Googleフォールバック(site:検索)

すべてGoogleの公式構文のため壊れにくい。低頻度でよい。

| 優先 | 対象 | 検証URL | 期待する結果 | 最終確認 | 結果 |
|---|---|---|---|---|---|
| 低 | `site:` + 除外 + 期間 | [google.com/search?q=site:note.com 台風 -広告 after:2026-06-01](https://www.google.com/search?q=site%3Anote.com%20%E5%8F%B0%E9%A2%A8%20-%E5%BA%83%E5%91%8A%20after%3A2026-06-01) | note.com のみ・除外と期間が有効 | 2026-07-03 | ✅ |
| 低 | `(a OR b)` | [google.com/search?q=site:note.com (台風 OR 大雨)](https://www.google.com/search?q=site%3Anote.com%20%28%E5%8F%B0%E9%A2%A8%20OR%20%E5%A4%A7%E9%9B%A8%29) | OR指定が有効 | 2026-07-03 | ✅ |

## 確認履歴

| 日付 | 実施内容 |
|---|---|
| 2026-07-02 | 初回調査+信頼度中以下の項目をブラウザ実測(operator-research.md参照) |
| 2026-07-03 | YouTube ソートsp値を実測。CAI系(アップロード日順)の無効化を発見しUI注記を追加 |
| 2026-07-03 | Googleフォールバックの site:/OR/除外/期間を実測 |
| 2026-07-03 | pixiv・Misskey.io を追加(Web調査ベース)。pixiv期間指定とMisskey username= が未実測 |
| 2026-07-03 | はてブ・Mastodon・Twitch・5ch・あにまん・ニコニコ静画を追加(未ログインHTTP実測ベース)。5chは公式検索がANDにならずff5chを採用。mstdn.jpの?q=はv4.4待ち |
