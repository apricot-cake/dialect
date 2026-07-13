import { useEffect, useRef } from 'react'

// マウスに追従して浮かび上がる、有機的なドットグリッドの背景。
// バリューノイズで「にじみ」のある濃淡をつくり、機械的な等間隔ドットに見せない

function nhash(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}

function vnoise(x: number, y: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const tl = nhash(xi, yi)
  const tr = nhash(xi + 1, yi)
  const bl = nhash(xi, yi + 1)
  const br = nhash(xi + 1, yi + 1)
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  return (tl * (1 - u) + tr * u) * (1 - v) + (bl * (1 - u) + br * u) * v
}

const SPACING = 32
const RADIUS = 360

export function DotsCanvas({ dark }: { dark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // RAFループを作り直さずにテーマを反映するため、darkはrefで読む
  const darkRef = useRef(dark)
  useEffect(() => {
    darkRef.current = dark
  }, [dark])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const mouse = { x: width / 2, y: height * 0.42, tx: width / 2, ty: height * 0.42 }
    const onMove = (e: PointerEvent) => {
      mouse.tx = e.clientX
      mouse.ty = e.clientY
    }
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onMove, { passive: true })

    let raf = 0
    const draw = (ts: number) => {
      const t = ts * 0.001
      mouse.x += (mouse.tx - mouse.x) * 0.09
      mouse.y += (mouse.ty - mouse.y) * 0.09
      ctx.clearRect(0, 0, width, height)
      const isDark = darkRef.current
      // ダークは明色ドットが地に沈みやすいので、濃さ(不透明度)を持ち上げて
      // ライトと同じくらいドット地が見えるようにする
      const boost = isDark ? 2.2 : 1
      const cap = isDark ? 0.52 : 0.34
      ctx.fillStyle = isDark ? 'rgb(206,213,226)' : 'rgb(40,44,56)'
      for (let x = SPACING / 2; x < width; x += SPACING) {
        for (let y = SPACING / 2; y < height; y += SPACING) {
          const n = nhash(x * 0.11, y * 0.13)
          const dx = x - mouse.x
          const dy = y - mouse.y
          const d = Math.hypot(dx, dy) || 0.001
          const ang = Math.atan2(dy, dx)
          // 角度方向のノイズで、マウス周りの浮かび上がる境界を不揃いにする
          const wobble = vnoise(Math.cos(ang) * 1.7 + 7, Math.sin(ang) * 1.7 + t * 0.05)
          const reach = RADIUS * (0.55 + 0.75 * wobble)
          let influence = Math.max(0, 1 - d / reach)
          influence = influence * influence * (3 - 2 * influence)
          // ゆっくり漂う大きなノイズ場で、ベースの濃淡もアナログにする
          const field = vnoise(x * 0.006 + 3, y * 0.006 + t * 0.015)
          const baseAlpha = (0.013 + 0.03 * n) * (0.3 + 0.95 * field)
          let alpha = (baseAlpha * 0.7 + influence * 0.32) * boost
          if (alpha < 0.011) continue
          if (alpha > cap) alpha = cap
          const radius = (0.82 + n * 0.42) * (1 + influence * 0.65)
          ctx.globalAlpha = alpha
          ctx.beginPath()
          ctx.arc(x, y, radius, 0, 6.2832)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  )
}
