import type { PlatformDef, QueryState, Resolution } from './types'
import { activeConcepts } from './concepts'

/** ユーザーの条件セットをプラットフォームへ翻訳し、適用/近似/非対応に仕分けする */
export function resolve(platform: PlatformDef, state: QueryState): Resolution {
  const resolution: Resolution = {
    url: platform.buildUrl(state),
    applied: [],
    approximated: [],
    dropped: [],
  }

  for (const concept of activeConcepts(state)) {
    const support = platform.support[concept]
    if (support.level === 'full') {
      resolution.applied.push(concept)
    } else if (support.level === 'partial') {
      resolution.approximated.push({ concept, noteKey: support.noteKey })
    } else {
      resolution.dropped.push({ concept, noteKey: support.noteKey })
    }
  }

  return resolution
}
