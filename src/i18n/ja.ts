// Dialect の全UI文言。表示は日本語のみだが、将来の多言語化に備えて文言はこの辞書に集約する。
export const ja = {
  // 検索概念(ビルダーの各行)
  'concept.keywords.label': 'キーワード',
  'concept.keywords.placeholder': '例: 台風 ← 複数の語はすべてを含む',
  'concept.terms.removeTerm': 'この語を外す',
  'concept.exactPhrase.label': '完全一致で探す',
  'concept.exactPhrase.placeholder': '例: 計画運休のお知らせ ← 一字一句このままの文を探す',
  'concept.exclude.label': '除外するキーワード',
  'concept.exclude.placeholder': '例: 広告 ← この語を含む投稿を出さない',
  'concept.titleOnly.label': 'タイトルだけで探す',
  'concept.fromUser.label': 'このユーザーの投稿だけ',
  'concept.fromUser.placeholder': '例: nhk_news ← @はつけない',
  'concept.excludeUser.label': 'このユーザーの投稿を除く',
  'concept.excludeUser.placeholder': '例: nhk_news ← @はつけない',
  'concept.toUser.label': 'このユーザー宛ての返信だけ',
  'concept.toUser.placeholder': '例: nhk_news ← @はつけない。複数書くとどれかに宛てた返信',
  'concept.mentionsUser.label': 'このユーザーへのメンションだけ',
  'concept.mentionsUser.placeholder': '例: user.bsky.social',
  'concept.subreddit.label': 'このコミュニティの中だけ',
  'concept.subreddit.placeholder': '例: japan ← r/はつけない。複数書くとどれかの中',
  'concept.domain.label': 'このサイトへのリンクを含む',
  'concept.domain.placeholder': '例: nhk.or.jp',
  'concept.hashtag.label': 'ハッシュタグ',
  'concept.hashtag.placeholder': '例: 読書記録 ← #はつけない。複数書くとすべてを含む',
  'concept.period.label': '期間',
  'concept.period.since': 'この日から',
  'concept.period.until': 'この日の前まで',
  'concept.mediaOnly.label': '画像・動画つきの投稿だけ',
  'concept.videoLength.label': '動画の長さ',
  'concept.videoLength.none': '指定なし',
  'concept.videoLength.short': '短い (〜4分)',
  'concept.videoLength.medium': 'ふつう (4〜20分)',
  'concept.videoLength.long': '長い (20分〜)',
  'concept.linksOnly.label': 'リンクを含む投稿だけ',
  'concept.verifiedOnly.label': '認証済みアカウントだけ',
  'concept.excludeReplies.label': 'リプライを除く',
  'concept.minLikes.label': '最低いいね数',
  'concept.minLikes.placeholder': '例: 100',
  'concept.minReposts.label': '最低リポスト数',
  'concept.minReposts.placeholder': '例: 50',
  'concept.japaneseOnly.label': '日本語の投稿だけ',
  'concept.sortOrder.label': '並び順',
  'concept.sortOrder.new': '新しい順',
  'concept.sortOrder.top': '人気順',
  'concept.sortOrder.auto': 'おまかせ',

  // ビルダー上部の共通ヒント
  'builder.hint.enter': 'Enterで語を区切って、1つの項目に複数の語を指定できます',

  // ビルダーのサイト絞り込み・対応サイト数バッジ
  'builder.filter.label': '条件を使えるサイトで絞る',
  'builder.filter.active': 'で絞り込み中',
  'builder.filter.all': 'すべて',
  'builder.support.sites': 'サイト',
  'builder.support.full': '対応',
  'builder.support.partial': '一部対応',

  // 複数プラットフォーム共通の注記
  'note.loose.and': 'すべてのキーワードを含む保証はありません',
  'note.loose.exact': '完全一致は効かず、ふつうのキーワードとして検索されます',
  'note.exact.unreliable': '完全一致は効かない場合があります',
  'note.hashtag.askeyword': 'ふつうのキーワードとして検索されます',
  'note.tagPage.combined': '他の条件と組み合わせるときは、ふつうのキーワードとして検索されます',
  'note.nosort': '並び順はURLでは指定できません',
  'note.videoOnly': 'もともと動画だけのサイトなので、この絞り込みは不要です',
  'note.imageOnly': 'もともと画像・イラストだけのサイトなので、この絞り込みは不要です',
  'note.jaOnly.service': '日本語のサービスなので、この絞り込みは不要です',

  // プラットフォーム別の注記
  'note.x.period': '期間だけの検索はできません。キーワードと組み合わせてください',
  'note.x.unofficial': '非公式な機能のため、将来使えなくなる可能性があります',
  'note.unofficial': '非公式な指定方法のため、将来使えなくなる可能性があります',
  'note.niconico.videoLength': '「ふつう(4〜20分)」は指定できず無視されます',
  'note.bluesky.exclude': '公式には案内されていない機能のため、将来使えなくなる可能性があります',
  'note.bluesky.fromUser': 'ユーザー名は「user.bsky.social」の形式です',
  'note.bluesky.mediaOnly': 'Bluesky には画像・動画で絞る機能がありません',
  'note.bluesky.sort': '新しい順は非公式なURL指定のため、将来使えなくなる可能性があります',
  'note.youtube.exactPhrase': '完全一致は効かないことが多くあります',
  'note.youtube.exclude': '除外が効かない場合があります',
  'note.youtube.fromUser': 'チャンネル内検索ページを開きます',
  'note.youtube.hashtag': 'ふつうのキーワードとして検索されます',
  'note.youtube.period': '非公式な指定方法のため、将来使えなくなる可能性があります',
  'note.youtube.mediaOnly': 'YouTube はもともと動画だけなので、この絞り込みは不要です',
  'note.youtube.japaneseOnly': 'YouTube には言語で絞る機能がありません',
  'note.youtube.sort':
    '人気順は視聴回数順で代用します(非公式)。新しい順は現在YouTube側で効かなくなっています。ユーザー指定との併用はできません',
  'note.note.keywords': 'すべてのキーワードを含む保証はありません(近い記事も混ざります)',
  'note.note.exactPhrase': '完全一致は効かず、ふつうのキーワードとして検索されます',
  'note.note.exclude': 'note には除外検索がありません',
  'note.note.fromUser': 'ユーザー名は note ID (@のあとの部分) です',
  'note.note.hashtag': '他の条件と組み合わせるときは、ふつうのキーワードとして検索されます',
  'note.note.period': 'note には期間で絞る機能がありません',
  'note.note.mediaOnly': 'note には画像・動画で絞る機能がありません',
  'note.note.japaneseOnly': 'note は日本語のサービスなので、この絞り込みは不要です',

  // 追加プラットフォーム固有の注記
  'note.reddit.hashtag': 'Redditにはハッシュタグの仕組みがありません',
  'note.reddit.period': '「1日以内/1週間/1か月/1年以内」への丸めになります',
  'note.threads.fromUser': 'キーワードと組み合わせたときの動作は不安定なことがあります',
  'note.instagram.hashtag': 'タグページは人気投稿だけが表示されます(最新順はありません)',
  'note.pixiv.keywords': 'タグの部分一致で検索されます(タグにない語は本文にあってもヒットしません)',
  'note.pixiv.fromUser': 'pixivの検索にはユーザー指定がありません',
  'note.pixiv.sort': '人気順はpixivプレミアム会員のみ有効です',
  'note.misskey.keywords': '本文の部分一致で検索されます。まれな語は結果が出ないことがあります',
  'note.misskey.exclude': 'Misskeyには除外検索がありません',
  'note.misskey.fromUser': 'キーワードとの組み合わせが必要です。非公式なURL指定のため、将来使えなくなる可能性があります',

  // 起動パネルのグループ見出し
  'group.sns': 'SNS',
  'group.video': '動画',
  'group.image': 'イラスト・画像',
  'group.text': 'ブログ・掲示板',

  // 起動パネル
  'launch.search': 'で検索',
  'launch.loginRequired': '要ログイン',
  'launch.loginNote': 'ログインしているブラウザでのみ検索結果を表示できます',
  'launch.conditions': '条件',
  'launch.applied': 'を適用',
  'launch.approxHeading': '一部だけ効く',
  'launch.droppedHeading': '使えない',
  'launch.urlPreview': '開くURL',

  // Googleフォールバック(site:検索)
  'google.recovered.suffix': 'は、Googleでこのサイトの中だけを探せば使えます',
  'google.lost.suffix': 'はGoogleには引き継げません',
  'google.launch.prefix': 'Googleで',
  'google.launch.suffix': 'の中を検索',

  // 共有
  'share.copyLink': 'この検索条件のリンクをコピー',
  'share.copied': 'コピーしました',

  // 画面上部のタブ(スマホ)
  'tab.build': '条件を入力',
  'tab.launch': '検索する',

  // ビルダー操作
  'builder.clear': '条件をクリア',

  // 保存検索・履歴
  'saved.save': 'この条件を保存',
  'saved.title': '保存した検索',
  'saved.delete': '削除',
  'history.title': '最近ひらいた検索',
  'summary.exclude': '除外',

  // フッター
  'footer.disclaimer':
    '検索構文は各SNSの非公式な仕様に基づくため、予告なく動かなくなることがあります。',
  'footer.github': 'GitHub',
} as const
