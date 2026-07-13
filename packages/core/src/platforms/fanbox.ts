import type {
  ConceptId,
  ConceptSupport,
  ParsedSearch,
  PlatformDef,
  QueryState,
  UrlPart,
} from '../types.js'
import { stripHash, words } from '../text.js'
import { lit, part } from '../urlParts.js'
import { hostMatches, leftoverParams, pathSegments } from '../parse.js'

// 出典: 2026-07-08 実機確認(未ログイン、GUI操作)。fanbox.cc の検索欄は「クリエイター・タグを検索」
// のみで、投稿本文の全文キーワード検索は存在しない。/search?type=creator&q= はクリエイター名の
// 部分一致検索(投稿の絞り込みではない)、/search?type=tag&q= はタグ名候補のサジェスト(複数語を
// 入れても「両方を含むタグ名」を探すだけで投稿のAND検索にはならないことを実機確認)。投稿一覧として
// 機能するのは単一タグのページ /tags/{タグ} のみで、並び順・除外・期間・送信者などの絞り込みは
// 一切無い(操作可能な要素は検索ボックスのみ)。タグページ自体は未ログインで閲覧可能(投稿の中身は
// 支援額に応じてロックされるが、これは検索機能とは別のコンテンツ課金)。
function buildParts(state: QueryState): UrlPart[] | null {
  // stripHash後に空文字になる語(例: "#"だけの入力)は実質タグ無しなので除く。
  // 除かずに通すと空タグの /tags/ (末尾スラッシュのみ)を生成し、自分自身のparseUrlが
  // pathSegmentsの空セグメント除去で読み戻せない(2026-07-11 check:props で発見)
  const tagNames = words(state.hashtag).map(stripHash).filter(Boolean)
  if (tagNames.length !== 1) return null
  return [lit('https://www.fanbox.cc/tags/'), part(encodeURIComponent(tagNames[0]), 'hashtag')]
}

// 逆翻訳: fanbox.cc/tags/{タグ}(唯一の投稿一覧ページ)
function parseUrl(url: URL): ParsedSearch | null {
  if (!hostMatches(url, 'fanbox.cc')) return null
  const segs = pathSegments(url)
  if (segs[0] !== 'tags' || !segs[1]) return null
  const patch: Partial<QueryState> = { hashtag: segs[1] }
  const ignored: string[] = []
  leftoverParams(url, new Set(), ignored)
  return { patch, ignored }
}

export const fanbox: PlatformDef = {
  id: 'fanbox',
  name: 'FANBOX',
  group: 'image',
  brandColor: '#0096FA',
  requiresLogin: false,
  support: {
    hashtag: { level: 'partial', noteKey: 'note.fanbox.hashtagOnly' },
  },
  buildParts,
  parseUrl,
  dynamicSupport: (state): Partial<Record<ConceptId, ConceptSupport>> => {
    const tagNames = words(state.hashtag).map(stripHash).filter(Boolean)
    if (tagNames.length !== 1) {
      return { hashtag: { level: 'none', noteKey: 'note.fanbox.hashtagOnly' } }
    }
    return {}
  },
}
