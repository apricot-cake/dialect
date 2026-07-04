import { useEffect, useRef } from 'react'

export type AreaId = 'conditions' | 'links'

// ホイール/タッチの「スクロールしたい意図」を蓄積して、閾値を超えたら画面を切り替える。
// 各画面の内部スクロールが端に達しているときだけ蓄積する(端でなければ通常スクロール)
const THRESHOLD = 150
// トラックの移動(780ms)より少し長いロックで、勢い余った連続切り替えを防ぐ
const LOCK_MS = 820

export function useSnapAreas(
  area: AreaId,
  disabled: boolean,
  onSnap: (area: AreaId) => void,
): void {
  const areaRef = useRef(area)
  const disabledRef = useRef(disabled)
  const onSnapRef = useRef(onSnap)
  useEffect(() => {
    areaRef.current = area
  }, [area])
  useEffect(() => {
    disabledRef.current = disabled
  }, [disabled])
  useEffect(() => {
    onSnapRef.current = onSnap
  }, [onSnap])

  useEffect(() => {
    let accum = 0
    let locked = false
    let lockTimer: ReturnType<typeof setTimeout> | undefined
    let touchY: number | null = null

    const snapTo = (next: AreaId) => {
      if (areaRef.current === next) return
      locked = true
      accum = 0
      onSnapRef.current(next)
      clearTimeout(lockTimer)
      lockTimer = setTimeout(() => {
        locked = false
      }, LOCK_MS)
    }

    const intent = (dy: number) => {
      if (locked || disabledRef.current) {
        accum = 0
        return
      }
      if (areaRef.current === 'conditions') {
        const el = document.querySelector('[data-bars-scroll]')
        const atBottom = !el || el.scrollTop + el.clientHeight >= el.scrollHeight - 2
        if (dy > 0 && atBottom) {
          accum += dy
          if (accum > THRESHOLD) snapTo('links')
        } else if (dy < 0) {
          accum = 0
        }
      } else {
        const el = document.querySelector('[data-links-scroll]')
        const atTop = !el || el.scrollTop <= 2
        if (dy < 0 && atTop) {
          accum += dy
          if (accum < -THRESHOLD) snapTo('conditions')
        } else if (dy > 0) {
          accum = 0
        }
      }
    }

    const onWheel = (e: WheelEvent) => intent(e.deltaY)
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY
      accum = 0
    }
    const onTouchMove = (e: TouchEvent) => {
      if (touchY == null) return
      const dy = touchY - e.touches[0].clientY
      touchY = e.touches[0].clientY
      // 指の移動はホイールより距離が出にくいので増幅する
      intent(dy * 2.2)
    }
    const onTouchEnd = () => {
      touchY = null
      accum = 0
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      clearTimeout(lockTimer)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [])
}
