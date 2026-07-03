// SNSまとめて検索の全UI文言。表示は日本語のみだが、将来の多言語化に備えて文言はこの辞書に集約する。
export const ja = {
  // 検索概念(ビルダーの各行)。placeholder は入力例、help はⓘホバーで出す機能説明
  'concept.keywords.label': 'キーワード',
  'concept.keywords.placeholder': '例: 台風',
  'concept.keywords.help':
    '入力した語を含む投稿を探します。複数の語を指定すると、すべての語を含む投稿だけに絞り込みます',
  'concept.terms.removeTerm': 'この語を外す',
  'concept.exactPhrase.label': '完全一致で探す',
  'concept.exactPhrase.placeholder': '例: 計画運休のお知らせ',
  'concept.exactPhrase.help':
    '語順や区切りも含めて、一字一句このままの文を含む投稿だけを探します',
  'concept.exclude.label': '除外するキーワード',
  'concept.exclude.placeholder': '例: 広告',
  'concept.exclude.help': '指定した語を含む投稿を検索結果から除きます',
  'concept.titleOnly.label': 'タイトルだけで探す',
  'concept.titleOnly.help':
    '本文ではなく、タイトルにキーワードを含む投稿だけを探します',
  'concept.fromUser.label': 'このユーザーの投稿だけ',
  'concept.fromUser.placeholder': '例: nhk_news',
  'concept.fromUser.help':
    '指定したユーザーが投稿したものだけを探します。ユーザー名に@はつけません',
  'concept.excludeUser.label': 'このユーザーの投稿を除く',
  'concept.excludeUser.placeholder': '例: nhk_news',
  'concept.excludeUser.help':
    '指定したユーザーの投稿を検索結果から除きます。ユーザー名に@はつけません',
  'concept.toUser.label': 'このユーザー宛ての返信だけ',
  'concept.toUser.placeholder': '例: nhk_news',
  'concept.toUser.help':
    '指定したユーザーに宛てた返信だけを探します。ユーザー名に@はつけません。複数指定すると、どれかのユーザーに宛てた返信を探します',
  'concept.mentionsUser.label': 'このユーザーへのメンションだけ',
  'concept.mentionsUser.placeholder': '例: user.bsky.social',
  'concept.mentionsUser.help':
    '指定したユーザーへのメンションを含む投稿だけを探します',
  'concept.subreddit.label': 'このコミュニティの中だけ',
  'concept.subreddit.placeholder': '例: japan',
  'concept.subreddit.help':
    '指定したコミュニティ(Redditのsubreddit、5ちゃんねるの板)の中の投稿だけを探します。名前にr/はつけません。複数指定すると、どれかのコミュニティの中を探します',
  'concept.domain.label': 'このサイトへのリンクを含む',
  'concept.domain.placeholder': '例: nhk.or.jp',
  'concept.domain.help':
    '指定したサイトへのリンクを含む投稿だけを探します',
  'concept.hashtag.label': 'ハッシュタグ',
  'concept.hashtag.placeholder': '例: 読書記録',
  'concept.hashtag.help':
    '指定したハッシュタグがついた投稿を探します。#はつけません。複数指定すると、すべてのタグがついた投稿だけに絞り込みます',
  'concept.period.label': '期間',
  'concept.period.since': 'この日から',
  'concept.period.until': 'この日の前まで',
  'concept.period.help':
    '投稿された日付で絞り込みます。どちらか片方だけの指定もできます',
  'concept.mediaOnly.label': '画像・動画つきの投稿だけ',
  'concept.mediaOnly.help': '画像または動画がついた投稿だけに絞り込みます',
  'concept.videoLength.label': '動画の長さ',
  'concept.videoLength.none': '指定なし',
  'concept.videoLength.short': '短い (〜4分)',
  'concept.videoLength.medium': 'ふつう (4〜20分)',
  'concept.videoLength.long': '長い (20分〜)',
  'concept.videoLength.help': '動画の再生時間で絞り込みます',
  'concept.linksOnly.label': 'リンクを含む投稿だけ',
  'concept.linksOnly.help': 'リンク(URL)を含む投稿だけに絞り込みます',
  'concept.verifiedOnly.label': '認証済みアカウントだけ',
  'concept.verifiedOnly.help': '認証済みアカウントの投稿だけに絞り込みます',
  'concept.excludeReplies.label': 'リプライを除く',
  'concept.excludeReplies.help': '返信(リプライ)を検索結果から除きます',
  'concept.minLikes.label': '最低いいね数',
  'concept.minLikes.placeholder': '例: 100',
  'concept.minLikes.help':
    'いいね数が指定した数以上の投稿だけに絞り込みます',
  'concept.minReposts.label': '最低リポスト数',
  'concept.minReposts.placeholder': '例: 50',
  'concept.minReposts.help':
    'リポスト数が指定した数以上の投稿だけに絞り込みます',
  'concept.japaneseOnly.label': '日本語の投稿だけ',
  'concept.japaneseOnly.help': '日本語で書かれた投稿だけに絞り込みます',
  'concept.workType.label': '作品の種類',
  'concept.workType.none': '指定なし',
  'concept.workType.illust': 'イラスト',
  'concept.workType.manga': 'マンガ',
  'concept.workType.help':
    'イラストを探すかマンガを探すかを指定します。指定しないときは各サイトの標準の検索対象で探します',
  'concept.resultType.label': '探すもの',
  'concept.resultType.none': '指定なし',
  'concept.resultType.video': '動画',
  'concept.resultType.channel': 'チャンネル',
  'concept.resultType.help':
    '検索結果の種類を指定します。「チャンネル」は動画ではなく投稿者・配信者を探します',
  'concept.sortOrder.label': '並び順',
  'concept.sortOrder.new': '新しい順',
  'concept.sortOrder.top': '人気順',
  'concept.sortOrder.auto': 'おまかせ',
  'concept.sortOrder.help':
    '検索結果の並び順を指定します。「おまかせ」は各サイトの標準の並び順で表示します',

  // ビルダー上部の共通ヒント
  'builder.hint.enter': 'Enterでワードを区切って、1つの項目に複数のワードを指定できます',

  // ビルダーのサイト絞り込み・対応サイト数バッジ
  'builder.filter.label': '条件を使えるサイトで絞る',
  'builder.filter.help':
    '選んだサイトで使える条件だけに、下の一覧の表示を絞ります。検索先のサイトが変わるわけではありません。すでに値を入れた条件は絞り込み中も隠れません',
  'builder.help.iconLabel': 'この条件の説明',
  'builder.filter.active': 'で絞り込み中',
  'builder.filter.all': 'すべて',
  'builder.support.label': '対応',

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
  'note.youtube.resultType': '非公式な指定方法です。ユーザー指定との併用はできません',
  'note.hatebu.minLikes': 'ブックマーク数で絞り込みます。はてブ側の選択肢(1/3/50/100/500)にない数は効かない可能性があります',
  'note.hatebu.fromUser': 'ユーザーのブックマークの中のキーワード検索は、はてなへのログインが必要なため対応していません',
  'note.mastodon.keywords': 'mstdn.jpは検索語入りのURLに対応していません(ハッシュタグのタグページだけ開けます)',
  'note.mastodon.hashtag': 'タグは1つだけ指定できます。キーワードや他のタグとの組み合わせはできません',
  'note.twitch.japaneseOnly': '言語での絞り込みはURLでは指定できません',
  'note.fivech.keywords': 'スレッドのタイトルだけが検索対象です。スレタイ検索サービス(ff5ch.syoboi.jp)を開きます',
  'note.fivech.subreddit': '板のID(例: sony)を1つだけ指定できます。2つ目以降は無視されます',
  'note.animanch.keywords': 'レスの本文を検索します(β機能のため、取りこぼしがあることがあります)',
  'note.animanch.titleOnly': '全期間の過去ログから、スレッドのタイトルだけを検索します',
  'note.seiga.sort': '人気順は閲覧数の多い順で代用します。マンガでは並び順を指定できません',

  // 起動パネルのグループ見出し
  'group.sns': 'SNS',
  'group.video': '動画',
  'group.image': 'イラスト・画像',
  'group.text': 'ブログ・掲示板',

  // 起動パネル
  'launch.search': 'で検索',
  // 検索ボタンのホバー説明。サイト名を前につけて使う(「Xにログインした〜」)
  'launch.loginNote': 'にログインしたブラウザでないと検索結果を見られません',
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
  'share.copyLink': 'リンクをコピー',
  'share.copyLink.tip':
    '今の条件をそのまま開けるURLをコピーします。ブックマークや共有に使えます',
  'share.copied': 'コピーしました',

  // スマホの画面切り替えボタン(右下)。移動先の画面名として使う
  'tab.build': '条件を入力',
  'tab.launch': '検索する',

  // ビルダー操作
  'builder.clear': 'クリア',
  'builder.clear.tip': 'すべての条件を空に戻します',

  // 保存検索・履歴
  'saved.save': '保存',
  'saved.save.tip':
    '今の条件をこのブラウザに保存します。下の「保存した検索」から呼び出せます',
  'saved.title': '保存した検索',
  'saved.delete': '削除',
  'history.title': '最近ひらいた検索',
  'summary.exclude': '除外',

  // フッター
  'footer.disclaimer':
    '検索構文は各SNSの非公式な仕様に基づくため、予告なく動かなくなることがあります。',
  'footer.github': 'GitHub',
} as const
