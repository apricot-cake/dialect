// Dialect の全UI文言。表示は日本語のみだが、将来の多言語化に備えて文言はこの辞書に集約する。
export const ja = {
  'app.description':
    '条件を日本語で組み立てると、Dialect が各SNSの検索構文に翻訳して検索ページを開きます。',

  // 検索概念(ビルダーの各行)
  'concept.keywords.label': 'すべて含むことば',
  'concept.keywords.placeholder': '例: 台風 休校 (スペース区切りで複数)',
  'concept.exactPhrase.label': '完全一致で探す',
  'concept.exactPhrase.placeholder': '例: 計画運休のお知らせ (この語順のまま探します)',
  'concept.exclude.label': '除外することば',
  'concept.exclude.placeholder': '例: 広告 PR (スペース区切りで複数)',
  'concept.fromUser.label': 'このユーザーの投稿だけ',
  'concept.fromUser.placeholder': '例: nhk_news (@は不要)',
  'concept.hashtag.label': 'ハッシュタグ',
  'concept.hashtag.placeholder': '例: 読書記録 (#は不要)',
  'concept.period.label': '期間',
  'concept.period.since': 'この日から',
  'concept.period.until': 'この日の前まで',
  'concept.mediaOnly.label': '画像・動画つきの投稿だけ',
  'concept.japaneseOnly.label': '日本語の投稿だけ',
  'concept.newestFirst.label': '新しい順に表示',

  // 対応状況(制限がある場合のみ、入力欄の下に表示)
  'hint.unsupported': 'では使えません',
  'hint.limited': 'では一部制限があります',
  'hint.only.suffix': 'で使えます',
  'hint.only.partial': 'は一部制限',

  // 複数プラットフォーム共通の注記
  'note.loose.and': 'すべてのことばを含む保証はありません',
  'note.loose.exact': '完全一致は効かず、ふつうのキーワードとして検索されます',
  'note.exact.unreliable': '完全一致は効かない場合があります',
  'note.hashtag.askeyword': 'ふつうのキーワードとして検索されます',
  'note.tagPage.combined': '他の条件と組み合わせるときは、ふつうのキーワードとして検索されます',
  'note.nosort': '新しい順はURLでは指定できません',
  'note.videoOnly': 'もともと動画だけのサイトなので、この絞り込みは不要です',
  'note.jaOnly.service': '日本語のサービスなので、この絞り込みは不要です',

  // プラットフォーム別の注記
  'note.x.period': '期間だけの検索はできません。ことばと組み合わせてください',
  'note.bluesky.exclude': '公式には案内されていない機能のため、将来使えなくなる可能性があります',
  'note.bluesky.fromUser': 'ユーザー名は「user.bsky.social」の形式です',
  'note.bluesky.mediaOnly': 'Bluesky には画像・動画で絞る機能がありません',
  'note.bluesky.newestFirst': '非公式なURL指定のため、将来使えなくなる可能性があります',
  'note.youtube.exactPhrase': '完全一致は効かないことが多くあります',
  'note.youtube.exclude': '除外が効かない場合があります',
  'note.youtube.fromUser': 'チャンネル内検索ページを開きます',
  'note.youtube.hashtag': 'ふつうのキーワードとして検索されます',
  'note.youtube.period': '非公式な指定方法のため、将来使えなくなる可能性があります',
  'note.youtube.mediaOnly': 'YouTube はもともと動画だけなので、この絞り込みは不要です',
  'note.youtube.japaneseOnly': 'YouTube には言語で絞る機能がありません',
  'note.youtube.newestFirst':
    '非公式な指定方法のため、将来使えなくなる可能性があります。ユーザー指定との併用はできません',
  'note.note.keywords': 'すべてのことばを含む保証はありません(近い記事も混ざります)',
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
  'note.threads.fromUser': 'ことばと組み合わせたときの動作は不安定なことがあります',
  'note.instagram.hashtag': 'タグページは人気投稿だけが表示されます(最新順はありません)',

  // 起動パネルのグループ見出し
  'group.sns': 'SNS',
  'group.video': '動画',
  'group.text': 'ブログ・掲示板',

  // 起動パネル
  'launch.search': 'で検索',
  'launch.loginRequired': '要ログイン',
  'launch.loginNote': 'X の検索はログインしているブラウザでのみ表示できます',
  'launch.conditions': '条件',
  'launch.applied': 'を適用',
  'launch.approxHeading': '一部だけ効く条件',
  'launch.droppedHeading': 'このSNSでは使えない条件',
  'launch.noQuery': 'ことば・ユーザー・ハッシュタグのどれかを入れてください',
  'launch.urlPreview': '開くURL',

  // 共有
  'share.copyLink': 'この検索条件のリンクをコピー',
  'share.copied': 'コピーしました',

  // テンプレート
  'template.heading': 'よく使う型:',
  'template.reputation': '評判・口コミを調べる',
  'template.live': 'いま起きていることを追う',
  'template.media': '写真・動画を探す',
  'template.clear': '条件をクリア',

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
