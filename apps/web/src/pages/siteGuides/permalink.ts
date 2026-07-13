import { defaultState, stateToParams, type QueryState } from '@apricot-cake/dialect-core'

/** サイトガイドの examples 用。手書きのURL文字列を直接持たず、パーマリンクの正規経路で組む */
export function exampleLink(patch: Partial<QueryState>): string {
  return `./?${stateToParams({ ...defaultState(), ...patch }).toString()}`
}
