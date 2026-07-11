import type { InstanceHosts, PlatformDef, QueryState } from './types'
import { PLATFORMS } from './platforms'
import { activeConcepts, defaultState } from './concepts'
import { paramsToQuery } from './permalink'

/** 検索URLの逆翻訳結果。platform が null のときは Dialect 自身の共有URL */
export interface ReverseResult {
  platform: PlatformDef | null
  state: QueryState
  ignored: string[]
}

/**
 * 貼り付けられた文字列を検索URLとして解釈し、Dialectの条件へ逆翻訳する。
 * 各サイトの parseUrl(buildUrlの逆方向)を順に試し、どれにも当たらなければ
 * Dialect自身の共有URL(パーマリンク)として読めるかを試す。読めなければ null。
 * instanceHosts はmastodon/misskeyの設定済みインスタンスホスト(未設定なら既定ホストのみ試す)
 */
export function parseSearchUrl(input: string, instanceHosts?: InstanceHosts): ReverseResult | null {
  const raw = input.trim()
  if (!raw) return null
  // スキーム無しの「x.com/search?q=…」も受ける
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`
  let url: URL
  try {
    url = new URL(withScheme)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null

  for (const platform of PLATFORMS) {
    const parsed = platform.parseUrl(url, { instanceHost: instanceHosts?.[platform.id] })
    if (!parsed) continue
    const state: QueryState = { ...defaultState(), ...parsed.patch }
    // ホストは合うが条件を1つも読み取れなかった(検索URLとして中身が無い)
    if (activeConcepts(state).length === 0) return null
    return { platform, state, ignored: parsed.ignored }
  }

  // Dialect自身の共有URL。既存のパーマリンク読取(旧バージョン互換込み)をそのまま使う。
  // 誤爆防止: 他サイトの ?q= や YouTube の watch?v=<動画ID> を拾わないよう、
  // フォーマットバージョン(v=1桁の数字。現行4)を持つURLだけを対象にする。
  // permalink.ts の VERSION を2桁に上げることがあればここも見直す
  const version = url.searchParams.get('v')
  if (version && /^[1-9]$/.test(version)) {
    const state = paramsToQuery(url.searchParams)
    if (activeConcepts(state).length > 0) return { platform: null, state, ignored: [] }
  }
  return null
}
