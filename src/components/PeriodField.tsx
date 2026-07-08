import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Popover } from '@base-ui/react/popover'
import { getLang, t } from '@/i18n'
import { FILLED_INK } from './widgets'

// 期間(この日から/この日の前まで)の2つの日付ボタン。ネイティブの date input は
// 使わず、デザインの自作カレンダー(日/月/年グリッド)をポップオーバーで出す

const MONTHS_JA = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DOWS_JA = ['日', '月', '火', '水', '木', '金', '土']
const DOWS_EN = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function toDateStr(y: number, m: number, d: number): string {
  return `${y}-${pad2(m + 1)}-${pad2(d)}`
}

// 狭幅では日付ボタン2つを横並びのまま収めるため、漢字表記より詰まる数字表記にする
function fmtDisplay(value: string, ja: boolean, compact: boolean): string {
  if (!value) return t('cal.pickDate')
  const d = new Date(`${value}T00:00:00`)
  if (compact) {
    if (ja) return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' })
  }
  if (ja) return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// CSSの @media (max-width:560px) と同じ基準。日付ボタンの表記幅をこれに合わせて切り替える
function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(
    () => typeof matchMedia !== 'undefined' && matchMedia('(max-width: 560px)').matches,
  )
  useEffect(() => {
    if (typeof matchMedia === 'undefined') return
    const mq = matchMedia('(max-width: 560px)')
    const onChange = () => setNarrow(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return narrow
}

type CalMode = 'days' | 'months' | 'years'

const CELL_BASE =
  'flex cursor-pointer items-center justify-center rounded-lg border-none text-[13px]'

/** セルの塗り分け: 選択中=アクセント、今日/表示中=淡いグレー、他=素のテキスト */
function cellTone(selected: boolean, current: boolean): {
  className: string
  style?: React.CSSProperties
} {
  if (selected) return { className: 'bg-accent font-semibold text-white' }
  if (current) return { className: 'bg-secondary font-semibold text-fg' }
  return { className: 'bg-transparent font-medium', style: { color: FILLED_INK } }
}

function Calendar({
  value,
  onPick,
  onClear,
}: {
  value: string
  onPick: (value: string) => void
  onClear: () => void
}) {
  const ja = getLang() === 'ja'
  const [view, setView] = useState(() => {
    const d = value ? new Date(`${value}T00:00:00`) : new Date()
    return { y: d.getFullYear(), m: d.getMonth() }
  })
  const [mode, setMode] = useState<CalMode>('days')

  const curY = value ? Number(value.slice(0, 4)) : null
  const curM = value ? Number(value.slice(5, 7)) - 1 : null

  let headerLabel: string
  let onHeader: (() => void) | undefined
  let shift: (dir: 1 | -1) => void
  let body: React.ReactNode

  if (mode === 'months') {
    headerLabel = ja ? `${view.y}年` : String(view.y)
    onHeader = () => setMode('years')
    shift = (dir) => setView((v) => ({ y: v.y + dir, m: v.m }))
    const names = ja ? MONTHS_JA : MONTHS_EN
    body = (
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: '40px' }}>
        {names.map((name, i) => {
          const tone = cellTone(curY === view.y && curM === i, i === view.m)
          return (
            <button
              key={name}
              type="button"
              data-noscale
              className={`${CELL_BASE} ${tone.className}`}
              style={tone.style}
              onClick={() => {
                setView((v) => ({ y: v.y, m: i }))
                setMode('days')
              }}
            >
              {name}
            </button>
          )
        })}
      </div>
    )
  } else if (mode === 'years') {
    const startY = Math.floor(view.y / 12) * 12
    headerLabel = `${startY} – ${startY + 11}`
    shift = (dir) => setView((v) => ({ y: v.y + dir * 12, m: v.m }))
    body = (
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: '40px' }}>
        {Array.from({ length: 12 }, (_, i) => {
          const year = startY + i
          const tone = cellTone(curY === year, year === view.y)
          return (
            <button
              key={year}
              type="button"
              data-noscale
              className={`${CELL_BASE} ${tone.className}`}
              style={tone.style}
              onClick={() => {
                setView((v) => ({ y: year, m: v.m }))
                setMode('months')
              }}
            >
              {year}
            </button>
          )
        })}
      </div>
    )
  } else {
    headerLabel = ja
      ? `${view.y}年 ${view.m + 1}月`
      : new Date(view.y, view.m, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    onHeader = () => setMode('months')
    shift = (dir) =>
      setView((v) => {
        let m = v.m + dir
        let y = v.y
        if (m < 0) {
          m = 11
          y--
        } else if (m > 11) {
          m = 0
          y++
        }
        return { y, m }
      })
    const startDow = new Date(view.y, view.m, 1).getDay()
    const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()
    const today = new Date()
    const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate())
    const cells: React.ReactNode[] = []
    for (let i = 0; i < startDow; i++) cells.push(<span key={`b${i}`} />)
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = toDateStr(view.y, view.m, d)
      const tone = cellTone(dateStr === value, dateStr === todayStr)
      cells.push(
        <button
          key={dateStr}
          type="button"
          data-noscale
          className={`${CELL_BASE} h-[34px] ${tone.className}`}
          style={tone.style}
          onClick={() => onPick(dateStr)}
        >
          {d}
        </button>,
      )
    }
    // 月の長さに関わらず6週分の高さを保ち、月送りでポップオーバーが伸縮しないようにする
    while (cells.length < 42) cells.push(<span key={`e${cells.length}`} />)
    body = (
      <>
        <div className="grid justify-center gap-px" style={{ gridTemplateColumns: 'repeat(7, 34px)' }}>
          {(ja ? DOWS_JA : DOWS_EN).map((dow, i) => (
            <span key={i} className="flex h-[26px] items-center justify-center text-[11px] font-semibold text-faint">
              {dow}
            </span>
          ))}
        </div>
        <div
          className="grid justify-center gap-[3px]"
          style={{ gridTemplateColumns: 'repeat(7, 34px)', gridAutoRows: '34px' }}
        >
          {cells}
        </div>
      </>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="prev"
          className="inline-flex size-[30px] cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-muted"
          onClick={() => shift(-1)}
        >
          <ChevronLeft className="size-[17px]" />
        </button>
        <button
          type="button"
          data-noscale
          className="dl-calhead cursor-pointer rounded-lg border-none bg-transparent px-2.5 py-1 text-[13.5px] font-semibold text-fg"
          onClick={onHeader}
        >
          {headerLabel}
        </button>
        <button
          type="button"
          aria-label="next"
          className="inline-flex size-[30px] cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-muted"
          onClick={() => shift(1)}
        >
          <ChevronRight className="size-[17px]" />
        </button>
      </div>
      {body}
      {value !== '' && (
        <button
          type="button"
          className="mt-0.5 h-7 cursor-pointer self-start rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-muted"
          onClick={onClear}
        >
          {t('cal.clear')}
        </button>
      )}
    </>
  )
}

function DateButton({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ja = getLang() === 'ja'
  const narrow = useNarrow()
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        data-noscale
        className="dl-date-btn inline-flex h-[34px] min-w-0 cursor-pointer items-center gap-[7px] rounded-[9px] border border-border bg-card px-3 text-sm font-medium whitespace-nowrap"
        style={{ color: value ? FILLED_INK : 'var(--muted)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
        </svg>
        <span className="min-w-0 truncate">{fmtDisplay(value, ja, narrow)}</span>
      </Popover.Trigger>
      <Popover.Portal>
        {/* 画面下端で開くときは Positioner が自動で上側にフリップする */}
        <Popover.Positioner side="bottom" align="start" sideOffset={6} collisionPadding={12} className="z-50">
          <Popover.Popup className="dl-glass dl-drop-in flex w-[268px] flex-col gap-1.5 rounded-[14px] p-3">
            <Calendar
              value={value}
              onPick={(v) => {
                onChange(v)
                setOpen(false)
              }}
              onClear={() => {
                onChange('')
                setOpen(false)
              }}
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

export function PeriodField({
  since,
  until,
  onChange,
}: {
  since: string
  until: string
  onChange: (patch: { since?: string; until?: string }) => void
}) {
  return (
    <div className="dl-period-row flex flex-wrap items-center gap-2">
      <DateButton value={since} onChange={(v) => onChange({ since: v })} />
      <span className="shrink-0 text-faint">–</span>
      <DateButton value={until} onChange={(v) => onChange({ until: v })} />
    </div>
  )
}
