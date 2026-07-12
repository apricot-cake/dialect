import { defaultState } from '@/core/concepts'
import { stateToParams } from '@/core/permalink'
import type { QueryState } from '@/core/types'

/** サイトガイドの examples 用。手書きのURL文字列を直接持たず、パーマリンクの正規経路で組む */
export function exampleLink(patch: Partial<QueryState>): string {
  return `./?${stateToParams({ ...defaultState(), ...patch }).toString()}`
}
