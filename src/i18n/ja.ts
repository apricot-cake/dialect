// SNSまとめて検索の全UI文言。表示は日本語のみだが、将来の多言語化に備えて文言はこの辞書に集約する。
export const ja = {
  // 言語切替ボタンのラベルは切替先の言語名(英語表示なら「日本語」)
  'app.langSwitch': 'English',
  'app.themeToggle': 'テーマを切り替え',
  // タイトル下の機能説明(キャッチコピーではなく画面の流れの説明)
  'app.tagline': '条件を組み立てて、各プラットフォームで検索',

  // 検索概念(ビルダーの各行)。placeholder は入力例、help はⓘホバーで出す機能説明
  'concept.keywords.label': 'キーワード',
  'concept.keywords.placeholder': '検索したいことばを入力',
  'concept.keywords.help': '入力した語を含む投稿を探します',
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
    '指定したユーザーに宛てた返信だけを探します。ユーザー名に@はつけません',
  'concept.mentionsUser.label': 'このユーザーへのメンションだけ',
  'concept.mentionsUser.placeholder': '例: user.bsky.social',
  'concept.mentionsUser.help':
    '指定したユーザーへのメンションを含む投稿だけを探します',
  'concept.subreddit.label': 'このコミュニティの中だけ',
  'concept.subreddit.placeholder': '例: japan',
  'concept.subreddit.help':
    '指定したコミュニティ(Redditのsubreddit、5ちゃんねるの板)の中の投稿だけを探します。名前にr/はつけません',
  'concept.domain.label': 'このサイトへのリンクを含む',
  'concept.domain.placeholder': '例: nhk.or.jp',
  'concept.domain.help':
    '指定したサイトへのリンクを含む投稿だけを探します',
  'concept.hashtag.label': 'ハッシュタグ',
  'concept.hashtag.placeholder': '例: 読書記録',
  'concept.hashtag.help':
    '指定したハッシュタグがついた投稿を探します。#はつけません',
  'concept.period.label': '期間',
  'concept.period.help':
    '投稿された日付で絞り込みます。どちらか片方だけの指定もできます',
  'concept.mediaOnly.label': '画像・動画つきの投稿だけ',
  'concept.mediaOnly.help': '画像または動画がついた投稿だけに絞り込みます',
  'concept.liveOnly.label': 'ライブ配信だけ',
  'concept.liveOnly.help': 'YouTubeで、ライブ配信（生放送・アーカイブ）だけに絞り込みます',
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
  'concept.language.label': '投稿の言語',
  'concept.language.none': '指定なし',
  'concept.language.ja': '日本語',
  'concept.language.en': '英語',
  'concept.language.help':
    '投稿が書かれている言語で絞り込みます（X・Blueskyのみ対応）',
  'concept.workType.label': '作品の種類',
  'concept.workType.none': '指定なし',
  'concept.workType.illust': 'イラスト',
  'concept.workType.manga': 'マンガ',
  'concept.workType.help': 'イラストを探すかマンガを探すかを指定します',
  'concept.resultType.label': '動画・チャンネルの種類',
  'concept.resultType.none': '指定なし',
  'concept.resultType.video': '動画',
  'concept.resultType.short': 'ショート',
  'concept.resultType.channel': 'チャンネル',
  'concept.resultType.playlist': '再生リスト',
  'concept.resultType.help':
    '動画サイト（YouTube・Twitch）で、動画・チャンネルなど探す種類を指定します。ショート・再生リストはYouTubeだけで使えます',
  'concept.sortOrder.label': '並び順',
  'concept.sortOrder.new': '新しい順',
  'concept.sortOrder.top': '人気順',
  'concept.sortOrder.hot': '急上昇',
  'concept.sortOrder.auto': 'おまかせ',
  'concept.sortOrder.help': '検索結果の並び順を指定します',
  'concept.pixivPopular.label': '人気の目安',
  'concept.pixivPopular.none': '指定なし',
  'concept.pixivPopular.100': '100users以上',
  'concept.pixivPopular.1000': '1000users以上',
  'concept.pixivPopular.10000': '10000users以上',
  'concept.pixivPopular.help':
    'pixivで、一定のブックマーク数に達した人気作だけを探します。プレミアム会員でなくても擬似的に人気順になります（「◯◯users入り」タグを利用）',
  'concept.ageRating.label': '年齢制限',
  'concept.ageRating.none': '指定なし',
  'concept.ageRating.safe': '全年齢のみ',
  'concept.ageRating.r18': 'R18のみ',
  'concept.ageRating.help': 'pixivで、全年齢の作品だけ、またはR18の作品だけに絞り込みます',
  'concept.excludeAi.label': 'AI生成作品を除く',
  'concept.excludeAi.help': 'pixivで、AI生成作品を検索結果から除きます',

  // 条件追加モーダルのサイト絞り込みと、バーの対応サイト数ラベル
  'builder.filter.label': 'サイトで使える条件だけ表示',
  'builder.filter.help':
    '選んだサイトで使える条件だけを一覧に表示します。表示が変わるだけで、検索先のサイトは変わりません',
  'builder.filter.all': 'すべて',
  'builder.support.label': '対応',

  // 複数プラットフォーム共通の注記
  'note.loose.and': 'すべてのキーワードを含む保証はありません',
  'note.loose.exact': '完全一致は効かず、ふつうのキーワードとして検索されます',
  'note.exact.unreliable': '完全一致は効かない場合があります',
  'note.tagPage.combined': '他の条件と組み合わせるときは、ふつうのキーワードとして検索されます',
  'note.nosort': '並び順はURLでは指定できません',
  'note.videoOnly': 'もともと動画だけのサイトなので、この絞り込みは不要です',
  'note.imageOnly': 'もともと画像・イラストだけのサイトなので、この絞り込みは不要です',

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
  'note.youtube.sort':
    '人気順は視聴回数順で代用します(非公式)。新しい順は現在YouTube側で効かなくなっています',
  'note.youtube.channelConflict':
    'ユーザー指定(チャンネル内検索)と組み合わせると、この絞り込みは効きません',
  'note.note.keywords': 'すべてのキーワードを含む保証はありません(近い記事も混ざります)',
  'note.note.exactPhrase': '完全一致は効かず、ふつうのキーワードとして検索されます',
  'note.note.exclude': 'note には除外検索がありません',
  'note.note.fromUser': 'ユーザー名は note ID (@のあとの部分) です',
  'note.note.hashtag': '他の条件と組み合わせるときは、ふつうのキーワードとして検索されます',
  'note.note.period': 'note には期間で絞る機能がありません',
  'note.note.mediaOnly': 'note には画像・動画で絞る機能がありません',

  // 追加プラットフォーム固有の注記
  'note.reddit.hashtag': 'Redditにはハッシュタグの仕組みがありません',
  'note.reddit.period': '「1日以内/1週間/1か月/1年以内」への丸めになります',
  'note.reddit.untilOnly': 'Redditは「いつまで」だけの期間を指定できません(「いつから」が必要です)',
  'note.instagram.hashtag': 'タグページは人気投稿だけが表示されます(最新順はありません)',
  'note.instagram.multiTag':
    'ハッシュタグを2つ以上指定すると、タグページではなくゆるいキーワード検索になり、すべてのタグを含む保証はありません',
  'note.pixiv.keywords': 'タグの部分一致で検索されます(タグにない語は本文にあってもヒットしません)',
  'note.pixiv.titleOnly': 'タグではなく、タイトルとキャプション(説明文)から探します',
  'note.pixiv.fromUser': 'pixivの検索にはユーザー指定がありません',
  'note.pixiv.sort': '人気順はpixivプレミアム会員のみ有効です',
  'note.pixiv.popular': '「◯◯users入り」タグで擬似的に人気作を絞り込みます。ファンが手動で付けるタグのため、付いていない人気作は漏れることがあります',
  'note.pixiv.r18Login': 'R18作品の表示にはpixivへのログインが必要です（未ログインだと結果に出ません）',
  'note.misskey.keywords': '語ごとに部分一致でAND検索されます(まれな語は結果が出ないことも)。遷移後、検索ページで「検索」ボタンを押すと結果が表示されます',
  'note.misskey.exclude': '先頭に - をつけて除外します(非公式のため、効かない場合があります)',
  'note.misskey.fromUser': 'キーワードとの組み合わせが必要です。非公式なURL指定のため、将来使えなくなる可能性があります',
  'note.youtube.resultType': '非公式な指定方法です。ユーザー指定との併用はできません',
  'note.hatebu.minLikes': 'ここで指定した数は、最低ブックマーク数として絞り込みます',
  'note.hatebu.titleTagConflict': 'ハッシュタグだけで検索するときは、タイトルだけの絞り込みは効きません',
  'note.hatebu.fromUser': 'ユーザーのブックマークの中のキーワード検索は、はてなへのログインが必要なため対応していません',
  'note.twitch.resultType': 'Twitchで探せるのは動画とチャンネルだけです',
  'note.sortOrder.otherSite': 'この並び順は、このサイトでは指定できません',
  'note.fivech.keywords': 'スレッドのタイトルだけが検索対象です。スレタイ検索サービス(ff5ch.syoboi.jp)を開きます',
  'note.fivech.titleOnly': '5ちゃんねる検索はもともとスレッドのタイトルだけが対象です(このトグルに関わらず常にタイトルを検索します)',
  'note.fivech.subreddit': '板のID(例: sony)で絞り込みます。複数指定するといずれかの板(OR)になります',
  'note.animanch.keywords': 'レスの本文を検索します(β機能のため、取りこぼしがあることがあります)',
  'note.animanch.titleOnly': '全期間の過去ログから、スレッドのタイトルだけを検索します',

  // 起動パネル。{name} にサイト名が入る
  'launch.search': '{name}で検索',
  'launch.bgHint': 'ホイールクリック、または Ctrl / ⌘ ＋ クリックで、複数サイトを背面タブに連続で開けます',
  'launch.approxHeading': '一部だけ効く',
  'launch.droppedHeading': '使えない',

  // 起動画面のサイトのグループ見出し
  'group.sns': 'SNS',
  'group.video': '動画',
  'group.image': 'イラスト・画像',
  'group.text': 'ブログ・掲示板',

  // 2画面スナップ構成の操作まわり
  'ui.addCondition': '条件を追加',
  'ui.clearConditions': 'すべてクリア',
  'ui.removeCondition': 'この条件を外す',
  'ui.scrollToLinks': 'スクロールで検索を開く',
  'ui.scrollToConditions': 'スクロールで条件へ戻る',
  // チップ入力のEnterヒント(<kbd>Enter</kbd> の後ろに続ける)
  'ui.enterToAdd': 'で区切る',
  'ui.loginRequired': '要ログイン',
  'ui.notSearchable': 'この条件では検索できません',
  'support.full': '完全対応',
  'support.partial': '一部対応',
  'picker.title': '条件を追加',
  'cal.clear': 'クリア',
  'cal.pickDate': '日付を選択',

  // フッター
  'footer.disclaimer':
    '一部の絞り込みは非公式な仕組みのため、動かなくなることがあります。',
  'footer.privacy':
    '入力した条件がサーバーへ送信されることはありません。検索URLの組み立てはすべてブラウザ内で行われます。',
} as const
