import { useEffect, useState } from 'react'

/**
 * タッチ主体の端末か(マウスでホバーできない)。CSSの `@media (hover: none)` と同じ判定基準。
 * ピルの案内切替(スクロール/タップ)や、ホバーポップの代わりに出す起動カードの
 * コピーボタン(issue #30)など、ホバー不可な端末だけに出す UI の出し分けに使う
 */
export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(
    () => typeof matchMedia !== 'undefined' && matchMedia('(hover: none)').matches,
  )
  useEffect(() => {
    if (typeof matchMedia === 'undefined') return
    const mq = matchMedia('(hover: none)')
    const onChange = () => setCoarse(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return coarse
}
