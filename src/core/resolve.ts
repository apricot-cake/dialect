import type { PlatformCtx, PlatformDef, QueryState, Resolution } from './types'
import { NO_SUPPORT } from './types'
import { activeConcepts } from './concepts'
import { joinParts } from './urlParts'

/** ユーザーの条件セットをプラットフォームへ翻訳し、適用/近似/非対応に仕分けする */
export function resolve(platform: PlatformDef, state: QueryState, ctx?: PlatformCtx): Resolution {
  // 静的 support に、入力次第の上書き(dynamicSupport)をかぶせて実態に合わせる
  const support = platform.dynamicSupport
    ? { ...platform.support, ...platform.dynamicSupport(state) }
    : platform.support

  const parts = platform.buildParts(state, ctx)
  const resolution: Resolution = {
    url: parts ? joinParts(parts) : null,
    parts,
    applied: [],
    approximated: [],
    dropped: [],
  }

  for (const concept of activeConcepts(state)) {
    const s = support[concept] ?? NO_SUPPORT
    if (s.level === 'full') {
      resolution.applied.push(concept)
    } else if (s.level === 'partial') {
      resolution.approximated.push({ concept, noteKey: s.noteKey })
    } else {
      resolution.dropped.push({ concept, noteKey: s.noteKey })
    }
  }

  return resolution
}
