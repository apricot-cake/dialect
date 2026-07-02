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
| ソート: アップロード日 / 視聴回数 | `CAI%3D` / `CAM%3D` | **中**(2026-01にUIから削除、URL直指定はまだ動作。フォールバック設計推奨) |
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
4. **X `min_faves:`** — ✅ 動作確認(ログイン済みWeb UI)。`台風 min_faves:500 f=live` で確認した全結果が500いいね以上(717/669/828)。※Dialect UIには未実装の概念、将来追加候補
5. **Bluesky `-`除外** — ✅ Web UIで動作確認。`天気 -雨` の結果25件に単語「雨」を含む投稿ゼロ。「梅雨」は別トークンとして残る(単語単位の除外)
6. **Bluesky `tab=latest`** — ✅ 動作確認。「最新」タブが選択された状態で開く
7. **note ANDの厳密性** — ❌ 厳密でないことを確認。`冷蔵庫 富士山` で片方しか含まないとみられる記事が多数混在(関連度ベース)。UI表示(一部制限)は現状のままで正しい

未検証のまま残っているもの: X `filter:blue_verified`(UI未実装のため優先度低)、YouTube Shortsフィルタのsp値(未使用)

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
