import type { PlatformId } from '@/core/types'

/** 出所タグ。docs/operator-research.md の記録ルールを引き継ぐ(表層で止めないルール参照) */
export type GuideSource = 'doc' | 'url' | 'gui'

export interface SiteGuideSection {
  title: { ja: string; en: string }
  body: { ja: string; en: string }
  /** YYYY-MM-DD。この記述をいつ確認したか(ページにも「最終確認」として表示) */
  checkedAt: string
  source: GuideSource
}

export interface SiteGuideExample {
  label: { ja: string; en: string }
  /** stateToParams() で組んだパーマリンク文字列。手書きのURL文字列を直接ハードコードしない */
  permalink: string
}

export interface SiteGuide {
  sections: SiteGuideSection[]
  examples?: SiteGuideExample[]
}

/**
 * サイト別ガイド(#45)の手書き部。ガイドが無いサイトは自動生成部(対応条件の一覧表)のみで
 * 成立する(段階方式)。主要サイトから順次追加していく
 */
export type SiteGuideRegistry = Partial<Record<PlatformId, SiteGuide>>
