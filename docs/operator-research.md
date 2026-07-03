# Dialect 演算子・ディープリンク調査

調査日: 2026-07-02(Web調査+一部API実測)。X / Bluesky / YouTube / note の4プラットフォームについて、検索結果ページのURL形式と、URLに埋め込んで動作する検索演算子を調査した結果。演算子スキーマ(翻訳辞書)の設計元データ。

## 結論サマリ

- **ディープリンク方式は4プラットフォーム全てで成立する**。検索窓で動く演算子は、いずれもURLのクエリパラメータに埋め込んで同一に動作する
- **ログイン必須はXのみ**。Bluesky / YouTube / note は未ログインで検索結果を閲覧可能
- **noteは演算子がほぼ皆無**(公式対応は `from:@noteID` のみ)。除外・完全一致・期間指定は実測で非対応を確認
- 演算子はXが最も豊富だが**全て非公式(undocumented)**。Blueskyは公式ドキュメントがある唯一のプラットフォーム

## 概念×プラットフォーム対応マトリクス

凡例: ◎=完全対応(緑) / ○=動作するが非公式・注意あり(緑〜黄) / △=近似対応(黄) / ✕=非対応(灰)

| 概念 | X | Bluesky | YouTube | note |
|---|---|---|---|---|
| 複数キーワードAND | ◎ スペース区切り | ◎ スペース区切り | ◎ スペース区切り | △ 絞り込みは効くが厳密AND不明 |
| 完全一致 | ◎ `"..."` | ◎ `"..."` | ○ `"..."`(厳密性低下報告あり、verbatim sp=`QgIIAQ%3D%3D`併用可) | ✕ 引用符は無視される(実測) |
| 除外 | ◎ `-語` | ○ `-語`(実測動作・**未文書化**) | ○ `-語`(信頼度中) | ✕(公式ヘルプが非対応と明言) |
| ユーザー指定 | ◎ `from:user` | ◎ `from:handle` | △ 別URL `youtube.com/@handle/search?query=` | ◎ `from:@noteID`(公式機能) |
| 宛先/メンション | ◎ `to:user` | ◎ `mentions:handle` | ✕ | ✕ |
| 期間指定 | ◎ `since:`/`until:`(YYYY-MM-DD) | ◎ `since:`/`until:`(sortAt基準・until排他) | ○ `before:`/`after:`(非公式・中信頼) or △ sp値で今日/今週/今月/今年に丸め | ✕ |
| ハッシュタグ | ◎ `#tag`(要`%23`) | ◎ `#tag`(要`%23`)+ `/hashtag/`ページ | ○ `/hashtag/`ページ(高)、クエリ内`#`(中) | ◎ `/hashtag/`ページ |
| 言語指定 | ◎ `lang:ja` | ◎ `lang:ja` | ✕(hl/glは不安定) | ✕(日本語サービス) |
| メディア付きのみ | ◎ `filter:media`等 | ✕(q演算子なし。`media=true`パラメータは2026-06追加だがフィーチャーゲート中) | —(種別=動画はsp `EgIQAQ%3D%3D`) | ✕ |
| リンク付き | ◎ `filter:links` | △ `domain:`で代用可 | ✕ | ✕ |
| 最低いいね/RP数 | ○ `min_faves:`/`min_retweets:`(中〜高、公式フォームからは削除済) | ✕ | ✕ | ✕ |
| リプライ除外 | ◎ `-filter:replies` | ✕(`replies=none`はゲート中) | — | — |
| 認証済みのみ | ○ `filter:blue_verified`(中) | ✕ | — | — |
| ソート/タブ指定 | ◎ `f=`(top/live/media/user) | ○ `tab=`(latest/user/feed、未文書化) | ○ sp値(※ソートは2026-01にUI削除、URL直指定はまだ動作) | ◎ `sort=`(popular/hot/new、記事タブのみ) |
| ログイン要件 | **必須** | 不要 | 不要 | 不要 |

## X

### URLテンプレート

```
https://x.com/search?q=<URLエンコード済みクエリ>&f=live
```

| パラメータ | 意味 |
|---|---|
| `q` | クエリ本体。演算子は全てここに平文で埋め込む(`#`→`%23`必須) |
| `f` | タブ。省略=top(話題・アルゴリズム選別)、`live`=最新(時系列)、`media`、`user` |
| `src` | トラッキング用、省略可 |

- `f=top`(既定)はアルゴリズムが大半を隠すため、**既定は`f=live`にすべき**
- 公式の検索ビルダー: `x.com/search-advanced`(同じq=形式のURLを生成)

### ログイン要件

**必須(2026-07現在、信頼度高)**。2023-06のログインウォール導入後、個別ポストは解除されたが検索ページは残存。未ログインで開くとログイン画面へリダイレクト。→ Dialect側で「Xはログインが必要」の注記が必要。

### 演算子

| 概念 | 構文 | 信頼度 | 備考 |
|---|---|---|---|
| AND | スペース区切り | 高 | ORは大文字`OR`必須 |
| 完全一致 | `"phrase"` | 高 | スペル自動補正の抑止も兼ねる |
| 除外 | `-語` / `-"フレーズ"` | 高 | |
| ユーザー発 | `from:username` | 高 | コロン後にスペース不可 |
| ユーザー宛 | `to:username` | 高 | |
| 期間 | `since:YYYY-MM-DD until:YYYY-MM-DD` | 高 | sinceは含む/untilは含まない。単独では動かず他条件と併用必須。広すぎる期間は間引かれる |
| ハッシュタグ | `#tag` | 高 | **`%23`エンコード必須** |
| 言語 | `lang:ja` | 高 | 短文の言語判定は不正確 |
| メディア | `filter:media` / `filter:images` / `filter:native_video` / `filter:videos` | 高 | |
| リンク | `filter:links` | 高 | メディアURLも含まれる |
| 最低いいね/RP | `min_faves:N` / `min_retweets:N` / `min_replies:N` | 中〜高 | Web UIで動作継続中。公式フォームからは削除済=将来リスク高め |
| 認証済み | `filter:blue_verified` | 中 | 公式ドキュメントなし |
| リプライ除外 | `-filter:replies` | 高 | `filter:replies`で逆も可 |

### 注意点

- 演算子は全て非公式。特に`min_faves`系・`blue_verified`は削除リスク高め → スキーマに信頼度フラグを持たせ定期確認
- 演算子は1クエリ約22〜23個が上限
- シャドウバン中のアカウントは`from:`でも結果ゼロになりうる(結果空≠構文ミス)

## Bluesky

### URLテンプレート

```
https://bsky.app/search?q=<URLエンコード済みクエリ>[&tab=latest]
```

| パラメータ | 意味 | 状態 |
|---|---|---|
| `q` | クエリ(演算子込み) | 安定 |
| `tab` | `latest`(最新)/`user`/`feed`、省略=Top | 動作するが未文書化(social-appコードで確認) |

- 関連: `bsky.app/hashtag/{tag}`、`bsky.app/profile/{handle}/search?q=`(ユーザー内検索)
- 構造化フィルタパラメータ(`author=`/`media=true`等)が2026-06-26に追加されたが**フィーチャーゲート中のため使用しない**。`q`+q内演算子+`tab=`が最も安全

### ログイン要件

**不要(実測確認済)**。制限: ログアウト表示オプトアウトのアカウントは非表示。`from:me`はログアウト時**黙って無視され全体検索になる**。

### 演算子

| 概念 | 構文 | 信頼度 | 備考 |
|---|---|---|---|
| AND | スペース区切り | 高 | 実測確認 |
| 完全一致 | `"phrase"` | 高 | 公式ドキュメントあり |
| 除外 | `-語` | **中** | **実測で動作するが公式未記載**。仕様変更リスク |
| ユーザー発 | `from:handle.bsky.social` | 高 | 公式。`from:me`は要ログイン |
| メンション | `mentions:handle` / `to:handle` / `@handle` | 高 | 公式。richtext facetのメンションのみ一致 |
| 期間 | `since:YYYY-MM-DD` / `until:YYYY-MM-DD` | 高(構文)/中(挙動) | 公式。sortAt基準・until排他的境界 |
| ハッシュタグ | `#tag` | 高 | **`%23`エンコード必須** |
| 言語 | `lang:ja` | 高 | 公式 |
| ドメイン | `domain:example.com` | 高 | 公式。リンク先ドメインで絞る |
| メディア付き | なし | 高(不在確認) | `filter:media`等は単なる検索語扱い(実測)。`media=true`はゲート中で使用不可 |

### 注意点

- 演算子の公式ドキュメントが存在する唯一のプラットフォーム(bsky.social/about/blog/05-31-2024-search)
- searchPostsV2への移行が進行中(デフォルトが直近投稿ウィンドウになる可能性)→ 将来の挙動変化に注意
- 検索対象はAppViewがインデックスした公開投稿のみ

## YouTube

### URLテンプレート

```
https://www.youtube.com/results?search_query=<URLエンコード済みクエリ>[&sp=<フィルタ値>]
```

| パラメータ | 意味 |
|---|---|
| `search_query` | 検索ボックスと完全等価。演算子埋め込み可 |
| `sp` | フィルタ/並び順(base64エンコードprotobuf)。固定文字列として安全に使える(セッション非依存) |

- チャンネル内検索: `youtube.com/@ハンドル/search?query={キーワード}`(ログイン不要・確実)
- ハッシュタグページ: `youtube.com/hashtag/{tag}`

### ログイン要件

**不要**。EU等では初回にCookie同意画面が挟まる。

### 演算子

| 概念 | 構文 | 信頼度 | 備考 |
|---|---|---|---|
| AND | スペース区切り | 高 | |
| OR | `A | B`(`%7C`) | 高 | Data API公式に記載 |
| 完全一致 | `"phrase"` | 中 | 厳密性低下の報告あり。verbatim sp `QgIIAQ%3D%3D` 併用が緩和策 |
| 除外 | `-語` | 中 | 「効かなくなった」報告も一部あり |
| 期間 | `before:YYYY-MM-DD` / `after:YYYY-MM-DD` | 中〜高 | 非公式だが2026年時点で動作確認あり。任意日付範囲の唯一の手段 |
| チャンネル | クエリ内`@handle`(低)→ 別URLのチャンネル内検索を推奨 | 低〜中 | |
| タイトルのみ | `intitle:` | 中 | 非公式 |
| ハッシュタグ | `/hashtag/`ページ(高)、クエリ内`#`(中) | | |

### sp値(主要なもの)

| フィルタ | sp値 | 信頼度 |
|---|---|---|
| 今日 / 今週 / 今月 / 今年 | `EgIIAg%3D%3D` / `EgIIAw%3D%3D` / `EgIIBA%3D%3D` / `EgIIBQ%3D%3D` | 高 |
| 種別: 動画 / チャンネル / 再生リスト | `EgIQAQ%3D%3D` / `EgIQAg%3D%3D` / `EgIQAw%3D%3D` | 高 |
| 時間: 4分未満 / 4〜20分 / 20分超 | `EgIYAQ%3D%3D` / `EgIYAw%3D%3D` / `EgIYAg%3D%3D` | 高 |
| ソート: アップロード日 / 視聴回数 | `CAI%3D` / `CAM%3D` | アップロード日=**✕効かない**(2026-07-03実測、下記) / 視聴回数=高(実測) |
| ソート+動画の長さの合成 | 視聴回数+短/中/長: `CAMSAhgB`/`CAMSAhgD`/`CAMSAhgC`、アップロード日+同: `CAISAhgB`/`CAISAhgD`/`CAISAhgC` | 視聴回数系=高(実測でソート・長さとも適用)、アップロード日系=長さのみ適用 |
| 完全一致(verbatim) | `QgIIAQ%3D%3D` | 中 |
| 組み合わせ例: 今日+動画のみ | `EgQIAhAB` | 高 |

- **sp値の連結は不可**。複数フィルタは1つのprotobufに合成が必要。任意の組み合わせは実機でフィルタ選択→URLコピーで取得可能
- 2026-01-09の検索フィルタ再編: アップロード日順ソート・評価順・「1時間以内」がUIから削除。Shortsフィルタ追加(sp値未確認)

### 注意点

- 検索結果は非ログインでもCookie/IPでパーソナライズされる(フィルタ自体は同一に適用)
- モバイルではアプリが横取りし、`&sp=`がアプリ内で尊重されるか未確認(PC優先方針なので容認)

## note

### URLテンプレート

```
https://note.com/search?context=note&q=<URLエンコード済みクエリ>&sort=new
```

| パラメータ | 値 | 信頼度 |
|---|---|---|
| `q` | キーワード(`from:@noteID`もここ) | 高(実測) |
| `context` | `note`(記事)/`magazine`/`user`/`circle`(メンバーシップ) | 高(実測) |
| `sort` | `popular`(既定)/`hot`(急上昇)/`new`(新着)。記事タブのみ有効 | 高(実測) |
| `size` | 表示件数(UIは10) | 中 |
| `mode` | `mode=search`(省略可・意味不明) | — |

- ハッシュタグページ: `note.com/hashtag/{タグ}`(#不要・要エンコード)

### ログイン要件

**不要(2026-07-02実測)**。

### 演算子

| 概念 | 対応 | 備考 |
|---|---|---|
| AND | △ | 絞り込み効果はあるが厳密ANDか関連度かは不明(実測) |
| 完全一致 | ✕ | 引用符は無視される(実測: 件数・上位が完全同一) |
| 除外 | ✕ | 公式ヘルプが非対応を明言、「Googleの`site:note.com kw -除外`を推奨」 |
| ユーザー指定 | ◎ `from:@noteID` | **公式機能**(2021-04リリース)。実測確認済 |
| 期間 | ✕ | `since:`等も効かない(検証記事あり) |
| ハッシュタグ | ◎ `/hashtag/`ページ | 厳密一致。検索(`context=hashtag`)は部分一致 |
| 有料/無料 | ✕(URL不可) | UIトグルはあるが`paid_only=true`等のURLパラメータは無効(実測)。クライアントサイド実装 |

### 注意点

- 件数表示は「約10,000件」で頭打ち
- `/hashtag/`ページのソートタブ・有料トグルはクライアントサイド切替でURL固定不可。ソートをURLで指定できるのは`/search`の`sort=`のみ
- 高度な絞り込みのフォールバックとして`site:note.com`のGoogle検索をnote公式自身が案内(→ v2のGoogleフォールバック機能の正当性根拠)

## 実機確認の結果(2026-07-02、ブラウザで検証)

信頼度が中以下だった項目をブラウザで検証した結果:

1. **YouTube `after:`** — ✅ 動作確認。`紫陽花 after:2026-06-25` で全結果が2〜5日前(7/2時点)に収まった
2. **YouTube `before:`** — ✅ 動作確認。`紫陽花 before:2015-01-01` で全結果が12〜17年前
3. **YouTube 引用符** — ❌ 厳密には効かない。存在しないフレーズ `"冷蔵庫で富士山を冷やす"` が通常のキーワード検索のような結果を返した(引用符は実質無視)。UI表示は「効かないことが多い」に強化済み
4. **X `min_faves:`** — ✅ 動作確認(ログイン済みWeb UI)。`台風 min_faves:500 f=live` で確認した全結果が500いいね以上(717/669/828)。※現在は「最低いいね数」「最低リポスト数」としてUI実装済み(min_retweets:の実測は未実施)
5. **Bluesky `-`除外** — ✅ Web UIで動作確認。`天気 -雨` の結果25件に単語「雨」を含む投稿ゼロ。「梅雨」は別トークンとして残る(単語単位の除外)
6. **Bluesky `tab=latest`** — ✅ 動作確認。「最新」タブが選択された状態で開く
7. **note ANDの厳密性** — ❌ 厳密でないことを確認。`冷蔵庫 富士山` で片方しか含まないとみられる記事が多数混在(関連度ベース)。UI表示(一部制限)は現状のままで正しい

未検証のまま残っているもの: X `filter:blue_verified`(UIには「認証済みアカウントだけ」として実装済み・実測は未実施)、X `min_retweets:`(同族のmin_faves:のみ実測済み)、YouTube Shortsフィルタのsp値(未使用)

継続的な動作確認の手順・記録は [operator-checklist.md](operator-checklist.md) に移した。以降の確認結果はそちらに記録する。

### 追加実機確認(2026-07-03、ブラウザで検証)

並び順の三択化に伴い、YouTubeのソートsp値(protobuf計算値)を検証した:

1. **YouTube `CAM%3D`(視聴回数順)** — ✅ 動作確認。`紫陽花` で 593万→499万→455万→393万 と厳密な降順
2. **YouTube `CAMSAhgB`(視聴回数順+4分未満の合成)** — ✅ ソート・長さとも適用を確認。`猫` で 4.8億→5846万→4119万 の降順、かつ単独`CAM%3D`では2位に入る4分超の楽曲動画(2.3億回)が除外された
3. **YouTube `CAI%3D`(アップロード日順)** — ❌ **効かなくなっている**。`紫陽花` で1年前のMVが先頭(関連度と同じ並び)、`台風` でも 10時間前→1時間前→19時間前 と時系列にならない。2026-01のUI削除に続きURL直指定も無効化されたとみられる(上の2026-07-02調査時点の「まだ動作」はWeb情報ベースで、実測で覆った)。`CAISAhgB` 等の合成値も長さフィルタだけが適用される
   → Dialectは「新しい順」でもCAI系を送信し続ける(害はなく、復活すれば効く)が、UI注記で「新しい順は現在効かない」と明示する

## スキーマ設計への示唆

- 演算子定義には **信頼度フラグ**(公式/非公式・実測済/未確認)と **確認日** を持たせる。非公式演算子は予告なく死ぬため、定期的な動作確認を前提にする
- `#`の`%23`エンコード漏れが最頻出のバグ要因(X・Bluesky共通)。シリアライザで必ず`encodeURIComponent`を通すこと
- 期間指定は「任意日付(X/Bluesky/YouTube before・after)」と「プリセット丸め(YouTube sp)」の2形態がある → UIは任意日付で受け、YouTubeはbefore/afterを第一候補、spプリセットを近似フォールバックとする
- Xのみログイン必須 → Xボタンに「ログインが必要です」の常時注記
- ソート/タブ指定(X `f=live`、Bluesky `tab=latest`、note `sort=new`)は概念「新着順」として共通化できる

## 主要ソース

- X: [igorbrigadir/twitter-advanced-search](https://github.com/igorbrigadir/twitter-advanced-search)(事実上の標準リファレンス)、sorsa.io・keep.md・jesusiniesta.es の2026年ガイド、TechCrunch(2023ログインウォール)
- Bluesky: [公式検索ブログ](https://bsky.social/about/blog/05-31-2024-search)(唯一の公式演算子ドキュメント)、atproto lexicons(searchPosts/V2)、social-appソースコード、無認証API実測(2026-07-02)
- YouTube: [公式ヘルプ(検索フィルタ)](https://support.google.com/youtube/answer/111997)、Data API公式、ktsk.xyz(spのprotobuf解析)、SerpApi、ppc.land(2026-01フィルタ再編)、control-panel-for-youtube
- note: note.com実測フェッチ(2026-07-02)、[公式リリース(from:@)](https://note.com/info/n/n216550eab71e)、公式ヘルプ(除外非対応の明言)、karupoimou検索フォーム調査

---

# 追加調査: 6プラットフォーム(2026-07-02)

プロダクト原則「キーワード入りの検索URLが開ければ追加する」に基づく拡張調査。6サイト全てで検索URLの存在を確認し、全て追加した。

## 追加サイトの概要

| | 検索URL | ログイン | 演算子の濃さ |
|---|---|---|---|
| niconico | `nicovideo.jp/search/{query}` | 不要 | **豊富**(AND/完全一致/除外/任意期間/ソート全てURL可・実測27パターン) |
| Reddit | `reddit.com/search/?q=` | 不要(デスクトップ) | **豊富**(AND/NOT/author:/title:は公式仕様。期間はt=プリセットのみ) |
| Threads | `threads.com/search?q=` | **必要** | 薄い(filter=recent と from_author= のみ。q内演算子なし) |
| TikTok | `tiktok.com/search?q=` | 不要(モーダルは閉じられる) | 薄い(引用符が一部効く程度。ソート・期間はURL不可) |
| Instagram | `instagram.com/explore/search/keyword/?q=` | **必要**(即ログインウォール) | ほぼゼロ(タグページは人気投稿のみ・Recent廃止) |
| Facebook | `facebook.com/search/top/?q=` | **必要** | ほぼゼロ(引用符が中信頼で効く。filters=base64は非公開仕様で不採用) |

## シリアライザの要点

- **niconico**: `sort=f&order=d`(新着)/`sort=h`(人気)。デフォルトソートはABテスト依存のため常に明示。任意期間は `start=YYYY-MM-DD&end=YYYY-MM-DD`(実測済)。タグ単独→`/tag/{tag}`、併用時はキーワードに畳み込み。除外`-語`はタグページでも有効。ユーザー指定の演算子は存在しない
- **Reddit**: スペース区切りは緩い一致のため、キーワードを ` AND ` で明示結合して厳密化。除外は公式構文 `NOT (a OR b)`。ユーザーは `author:`。ソートは `sort=new`。期間は `t=day|week|month|year|all` への丸め(sinceから自動選択)。old.reddit.comは2026年8月からログイン必須化予定のため使わない
- **Threads**: `filter=recent`(新着)と `from_author={user}`(2026-04実URL確認)。threads.net→threads.comに301(クエリ保持)。タグ単独→`/tag/{tag}`(ログアウトでも一部表示される唯一の経路)。期間はUIフィルタのみでURL不可
- **TikTok**: `search?q=` のみ。タグ単独→`/tag/{tag}`。除外・期間・ソートは内部APIパラメータでURL非公開。`from:`相当なし
- **Instagram**: `explore/search/keyword/?q=`(スクレイパー各社が常用する事実上の標準)。タグ単独→`/explore/tags/{tag}/`(**人気投稿のみ**)。演算子ゼロ。未ログインは検索・タグとも即リダイレクト(実測)
- **Facebook**: `search/top/?q=` が最安全(`search/posts` はUIから削除済みで将来リスク)。`filters=`(base64の内部仕様)による最新順・日付は キー名の変遷歴があり不採用。引用符はある程度効く(中信頼)

## OR グループの結合規則(2026-07-02、検索ページの件数比較で実測)

「いずれかを含む」行の複数化(GUI での論理の組み立て)に伴い、niconico の OR の結合規則を実測した:

1. **括弧は使えない** — `(猫 OR 犬)` は 11,077件(`猫 OR 犬` は 542,332件)。括弧がリテラル扱いになり検索が壊れる
2. **OR はスペースの AND より強く結合する** — `猫 OR 犬 手芸` = 391件 ≈ `猫 手芸`(253件)+`犬 手芸`(161件)。`猫 OR (犬 手芸)` の解釈なら38万件超になるはずで、実際は `(猫 OR 犬) AND 手芸`
3. **OR 連鎖の並置で複数グループが成立する** — `猫 OR 犬 編み物 OR 手芸` = 412件 ≈ 4つの AND ペアの和(488件)−重複。語順を入れ替えても412件で一致し、文法は「OR 連鎖の AND 結合」で安定

→ niconico のシリアライザは括弧なしの並置(`a OR b c OR d`)で複数 OR グループを表現する。なお snapshot API は同日時点で件数が異常に小さく(`猫`=2件)、検証には使えなかった。

他プラットフォームの複数 OR グループ: X は標準リファレンス(igorbrigadir)に `()` グループ化の記載あり、Reddit は Boolean 演算子+括弧が公式仕様、YouTube は `|` が Data API 公式(括弧は従来実装を踏襲)。

## 参考ソース(抜粋)

- niconico: [スナップショット検索v2 APIガイド](https://site.nicovideo.jp/search-api-docs/snapshot)(AND/OR/-/フレーズの公式仕様)、非ログインcurl実測27パターン(2026-07-02)、ニコニコ大百科(マイナス検索)
- Reddit: [公式ヘルプ Available search features](https://support.reddithelp.com/hc/en-us/articles/19696541895316)(Boolean/フィールド演算子)、Slashdot/Softonic(old.reddit ログイン必須化 2026-07-01発表)
- Threads: TechCrunch(threads.com移行 2025-04)、Raycast quicklinks・自動化プロジェクト(URL形式)、実測(301リダイレクト・ログアウト挙動)
- TikTok: ScrapFly 2026(URL形式・anti-bot)、team5pm(演算子)、tokportal/droid4x(非ログイン閲覧の実態)
- Instagram: axiom.ai/Apify(keyword SERPのURL形式・Cookie必須)、実測(未ログイン即リダイレクト 2026-07-02)、Later/SMT(Recentタブ廃止)
- Facebook: PiunikaWeb(Postsフィルタ削除 2025-09)、Plessas Facebook Matrix(URLテンプレート)、nem.ec(filters= JSON仕様)

# 追加調査: pixiv / Misskey.io(2026-07-03)

## pixiv

### URLテンプレート

```
https://www.pixiv.net/tags/<URLエンコード済みクエリ>/artworks[?order=...&scd=...&ecd=...]
```

| パラメータ | 意味 | 信頼度 |
|---|---|---|
| パス `/tags/{query}/artworks` | イラスト・マンガの検索。クエリに演算子を埋め込む | 高(サイト標準) |
| `s_mode` | 省略=`s_tag`(タグ部分一致)。`s_tag_full`=タグ完全一致、`s_tc`=タイトル・キャプション | 高 |
| `order` | `date_d`=新着(既定)/`date`=古い順/`popular_d`=人気(**プレミアム会員限定**) | 高 |
| `scd` / `ecd` | 期間の開始日/終了日(YYYY-MM-DD) | 中(非公式・未実測) |

- 小説は `/tags/{query}/novels` だが Dialect は artworks(イラスト・マンガ)のみ対象
- ユーザー検索は別URL(`/search_user?nick=`)で、作品検索とキーワード併用できないため非対応

### ログイン要件

**不要**。ただし「ログインユーザーに公開」設定の作品とR-18は未ログインでは結果に出ない。原寸表示など閲覧側の機能制限もあるが検索結果一覧は閲覧可能。

### 演算子([公式ヘルプ](https://www.pixiv.help/hc/en-us/articles/235646387)に記載あり)

| 概念 | 構文 | 信頼度 | 備考 |
|---|---|---|---|
| AND | スペース区切り | 高 | タグの部分一致で照合(既定の s_mode=s_tag) |
| OR | `A OR B` / `A (B OR C)` | 高 | **公式ヘルプ記載**。括弧グループ可 |
| 除外 | `-語` | 高 | **公式ヘルプ記載** |
| 完全一致 | ✕ 引用符なし | 高(不在) | タグ完全一致(s_tag_full)はあるが語句の完全一致とは別物 → キーワード近似 |
| ハッシュタグ | タグ語として畳み込み | 高 | pixivのタグ=ハッシュタグそのもの。#を外してクエリへ |
| 期間 | `scd=`/`ecd=` | 中 | 非公式URLパラメータ。**未実測**(チェックリストで要確認) |
| 並び順 | `order=date_d`/`popular_d` | 高/高 | popular_d はプレミアム限定(非会員は新着のまま) |

## Misskey.io

### URLテンプレート

```
https://misskey.io/search?q=<URLエンコード済みクエリ>&type=note[&username=ユーザー名]
```

| パラメータ | 意味 | 信頼度 |
|---|---|---|
| `q` | 検索語。演算子はなく本文の部分一致 | 高(ルーター定義で確認) |
| `type` | `note`(ノート検索)/`user` | 高(同上) |
| `username` / `host` | ユーザーで絞り込み(フロントエンドが users/show で解決) | 中(非公式・ルーター定義とsearch.note.vueの実装で確認) |

- タグページ: `misskey.io/tags/{タグ}`(#不要・要エンコード)
- ルート定義の出典: misskey-dev/misskey `packages/frontend/src/router.definition.ts`(q/userId/username/host/channel/type/origin を search ページの props にマッピング)

### ログイン要件

**必要**。misskey.io のノート検索はログインユーザー向け機能(Misskey本体がロールで検索可否を制御する設計)。タグページは未ログインでも一部閲覧可。

### 演算子

| 概念 | 対応 | 備考 |
|---|---|---|
| AND | △ スペース区切り | 本文の部分一致の組み合わせ。misskey.io公式サポートが「まれな語は結果が出ないことがある」と案内しており安定性は中 |
| OR / 除外 / 完全一致 / 期間 | ✕ | q内の演算子は存在しない → Googleフォールバック対象 |
| ユーザー指定 | ○ `&username=` | URLパラメータ(非公式)。**検索語との併用が必須**(qが空だと検索が実行されない) |
| ハッシュタグ | ◎ `/tags/`ページ | 単独時。併用時は本文に「#タグ」が含まれる部分一致検索へ畳み込み(ノート本文にタグ文字列が残るため成立) |
| 並び順 | ✕ | 検索結果は新着順固定。URL指定不可 |

# 追加調査: はてなブックマーク / Mastodon / Twitch / 5ちゃんねる / あにまん掲示板 / ニコニコ静画(2026-07-03)

6サイトすべてWeb調査+未ログインでのHTTP実測(curl、ブラウザUA)。Twitchのみ実ブラウザでも検証。

## 概要

| | 検索URL | ログイン | 演算子の濃さ |
|---|---|---|---|
| はてなブックマーク | `b.hatena.ne.jp/search/text?q=` | 不要 | **豊富**(AND/除外/任意期間/並び順/最低ブクマ数が全てURL可・実測) |
| Mastodon(mstdn.jp) | **キーワード検索URLなし**(タグページのみ) | タグページは不要 | — |
| Twitch | `twitch.tv/search?term=` | 不要 | 薄い(演算子ゼロ。type=で対象切替のみ) |
| 5ちゃんねる | `ff5ch.syoboi.jp/?q=`(スレタイ検索) | 不要 | 中(AND/除外/@板が実測で有効) |
| あにまん掲示板 | `bbs.animanch.com/searchRes/{query}` | 不要 | 薄い(スペースANDのみ。実測) |
| ニコニコ静画 | `seiga.nicovideo.jp/search/{query}` | 不要 | 中〜豊富(AND/除外/OR/並び順が実測で有効) |

## はてなブックマーク

- 検索対象は**パスで指定**: `/search/text`(本文)・`/search/title`(タイトル)・`/search/tag`(タグ)。`target=`パラメータは実効なし
- パラメータ(全て実測・高信頼): `q`(スペース区切りAND、`-語`除外)、`sort=recent|popular`(既定popular)、`date_begin`/`date_end`(YYYY-MM-DD)、`users=N`(最低ブクマ数。UI選択肢は1/3/50/100/500)、`page=N`
- 引用符 `"..."` は絞り込み効果を実測したが公式ヘルプに記載なし(中信頼)
- **落とし穴**: 期間を指定しないと、はてブ側の標準で「直近5年・users=3」に絞られる(date_begin明示で全期間になる)。サイト上で普通に検索しても同じ挙動のため、Dialectは site の既定に任せる
- ユーザーのブックマーク内キーワード検索(`/{user}/search?q=`)は**要ログイン**(302でログインへ)→ fromUser 非対応

## Mastodon(mstdn.jp)

- mstdn.jp は **Mastodon v4.3.22**(API実測)。検索ページの `?q=` をWeb UIが読む機能は **v4.4.0 で初実装**(PR mastodon/mastodon#32949)のため、**検索語入りURLが組めない**(開いても検索欄は空)
- 全文検索は要ログインのうえ、対象は検索許可をオプトインしたユーザーの公開投稿のみ(4.2以降の仕様)
- 未ログインで機能する公開URLは**タグページ `/tags/{タグ}` のみ**(裏の公開API・RSSも実測で確認)→ ハッシュタグ専用+Googleフォールバックとして採用
- mstdn.jp が4.4系に上がったら `?q=` 対応を再調査(チェックリストに記載)

## Twitch

- `twitch.tv/search?term=`(実ブラウザ実測)。ログイン不要
- 演算子は**一切効かない**(引用符・`-`除外とも実測で無効。あいまい一致)
- `type=channels|categories|videos` で対象切替(実測)。「配信中のみ」のtypeは存在しない
- 言語絞り込み(日本語のみ)は**URL不可**(`?lang=ja`は無視。UIの言語フィルタはURLに反映されないクライアント内部状態)

## 5ちゃんねる

- **2026-03にドメインが5ch.net→5ch.ioへ移行**(レジストラ剥奪)。公式スレタイ検索は find.5ch.io(旧find.5ch.netは301転送)
- 公式(find.5ch.io、検索エンジンv3)は**スペース区切りがANDにならない**(関連度ベース。実測で片方の語のみの結果が上位に混在)。除外・引用符も無効 → 「足す=絞る」を満たさず不採用
- **ff5ch.syoboi.jp(スレタイ検索)を採用**: `?q=` でAND(実測)・`-語`除外(実測)・`@板ID`板指定(実測)が全て有効。部分文字列マッチ型・スレ作成の新しい順固定・ログイン不要・5ch.io移行済みインデックス
- dig.5ch.net は死亡(522)。板指定は既存概念「このコミュニティの中だけ」(subreddit)に相乗り(先頭の1つだけ)

## あにまん掲示板

- 検索はパス埋め込み: `/search/{query}`(現行スレ・直近約2か月)・`/search2/{query}`(全期間の過去ログ)・`/searchRes/{query}`(レス本文・β)。いずれもスレタイトル検索(searchResのみ本文)
- スペース区切りANDは実測で有効。除外・引用符・並び順・期間のパラメータは**なし**(検索フォームの実パラメータはflagとqのみ)
- Dialectの翻訳: 既定=レス本文(`searchRes`、βのため取りこぼし注記)、「タイトルだけで探す」ON=全期間過去ログ(`search2`)
- Cloudflare配下でボット的UAは403(ブラウザで開く分には問題ない)

## ニコニコ静画

- サービスは**稼働中**(2024年攻撃後も継続。終了したのは成人向けコーナーのみ)
- イラスト: `/search/{query}?target=illust_all`(キーワード)・`/tag/{タグ}`(タグ一致)。ログイン不要
- 演算子は件数比較で実測: スペースAND・`-語`除外(件数が完全に整合)・OR。引用符は無害だが効果未確定
- 並び順 `sort=`(検索・タグ共通): `image_created`(新着)/`image_view`(閲覧数=人気の代用)。サイト既定は`comment_created`(コメント新着順)のため、新着順は必ず明示する
- マンガは別ドメイン `manga.nicovideo.jp/search?q=`(実測で稼働)。並び順パラメータ未確認のため送らない → 概念「作品の種類」で切替

## 新概念「作品の種類」「探すもの」(2026-07-03)

URLで指定できる条件はすべて概念化する方針(対応1サイトでも追加してよい。ビルダーは対応サイト数順ソート+サイト絞り込みで吸収できる)。

- **作品の種類(workType)**: イラスト/マンガ。pixiv(パス `/illustrations`・`/manga`、未指定は`/artworks`)とニコニコ静画(静画検索⇔ニコニコ漫画検索)が対応
- **探すもの(resultType)**: 動画/チャンネル。YouTube(sp種別 type=1/2)とTwitch(`type=videos|channels`)が対応
- YouTubeのsp値はソート×長さ×種別の組み合わせが必要になったため、固定テーブルをやめ**protobufバイト列からの組み立て**に変更(実測済みの CAM%3D・EgIYAQ%3D%3D・CAMSAhgB・EgIQAQ%3D%3D の再現をnode検算で確認)

## 参考ソース(抜粋)

- はてブ: 実測フェッチ多数(2026-07-03)、[公式ヘルプ 検索機能](https://b.hatena.ne.jp/help/entry/search)
- Mastodon: mstdn.jp API実測(version/検索/タグタイムライン)、[公式ドキュメント user/network](https://docs.joinmastodon.org/user/network/)、[PR #32949(?q=対応、4.4.0)](https://github.com/mastodon/mastodon/pull/32949)
- Twitch: 実ブラウザ実測(2026-07-03)、[公式ヘルプ How does search work](https://help.twitch.tv/s/article/how-does-search-work)
- 5ch: find.5ch.io・ff5ch.syoboi.jp実測(2026-07-03)、[GIGAZINE(ドメイン剥奪)](https://gigazine.net/gsc_news/en/20260306-5ch-domain/)、JDim Issue #60(dig停止)
- あにまん: bbs.animanch.com実測(フォーム定義・3種の検索。2026-07-03)
- 静画: seiga.nicovideo.jp実測(件数比較27パターン相当。2026-07-03)、ニコニコインフォ(春画終了)

# Googleフォールバック(site:検索、2026-07-03実装)

本体サイトの検索で外れる条件を、Googleの `site:` 検索(サイト内検索)で補う機能。note公式ヘルプ自身が除外検索の代替として `site:note.com kw -除外` のGoogle検索を案内していることが着想の根拠(上記noteの節を参照)。

## 使う演算子(すべてGoogleの公式・文書化済み構文のみ)

| 概念 | Google構文 | 備考 |
| --- | --- | --- |
| キーワード | スペース並置(AND) | |
| どれかを含む | `(a OR b)` | 括弧+大文字OR |
| 完全一致 | `"..."` | |
| 除外 | `-語` | |
| 期間 | `after:YYYY-MM-DD` / `before:YYYY-MM-DD` | 2019年に公式化(Danny Sullivan発表) |
| 日本語のみ | URLパラメータ `lr=lang_ja` | |

上記以外の概念(ユーザー指定・ハッシュタグ・メディア等)はGoogleへ翻訳できないため引き継がない。UI上は「◯◯はGoogleには引き継げません」と注記する。

## 提示ルール(src/core/google.ts)

- トリガー: ネイティブ検索で**外れた(dropped)**条件のうち、どれかを含む/完全一致/除外/期間 のいずれかがあるときだけGoogleボタンを出す(近似=partialは本体側で一応動くため対象外。ノイズ回避)
- Googleへ渡せる正の条件(キーワード・OR・完全一致)がなければ出さない(site:単独ではサイト全ページが対象になるため)
- 各サイトのドメインは PlatformDef.googleSite(x.com / bsky.app / youtube.com / note.com / nicovideo.jp / threads.com / instagram.com / tiktok.com / facebook.com / reddit.com / pixiv.net / misskey.io)

## 実機確認(2026-07-03、ブラウザで検証)

- `site:note.com 台風 -広告` → note.comの記事のみが並び、除外が有効
- `site:note.com 台風 -広告 after:2026-06-01` → 期間指定つきで動作
- `site:note.com (台風 OR 大雨)` → OR指定で動作(ネイティブ側が起動不能なOR専用ケースの救済)

## 限界(注記済み・許容)

- Googleのインデックス反映には時間差があり、直近の投稿はヒットしない(リアルタイム性はネイティブ検索が上)
- ログインウォールのあるサイト(Instagram・Facebook等)はインデックス範囲が部分的
