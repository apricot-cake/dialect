import { Globe, Moon, Sun } from 'lucide-react'
import { siGithub } from 'simple-icons'
import { t } from '@/i18n'

// 3×3のドットでDialectの「点をつなぐ」ロゴを描く。アクセント色は1/3/8番目
const LOGO_ACCENT = new Set([1, 3, 8])

const ROUND_BUTTON =
  'inline-flex size-[34px] cursor-pointer items-center justify-center rounded-full border border-border bg-card text-muted'

/** 両画面に共通の固定ヘッダー。左上=ロゴ+説明、右上=言語/テーマ/GitHub */
export function AppHeader({
  dark,
  onToggleDark,
  onToggleLang,
}: {
  dark: boolean
  onToggleDark: () => void
  onToggleLang: () => void
}) {
  return (
    <>
      <div className="fixed top-[18px] left-[22px] z-40 flex max-w-[360px] items-center gap-[13px]">
        <span className="grid size-9 shrink-0 place-content-center gap-[5px] rounded-[10px] border border-border bg-card shadow-[0_1px_2px_oklch(0_0_0_/_0.06)] [grid-template-columns:repeat(3,4px)] [grid-template-rows:repeat(3,4px)]">
          {Array.from({ length: 9 }, (_, i) => (
            <span
              key={i}
              className={`size-1 rounded-full ${
                LOGO_ACCENT.has(i) ? 'bg-accent' : 'bg-faint opacity-50'
              }`}
            />
          ))}
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="dl-tagline text-[11.5px] leading-[1.35] font-medium text-muted">
            {t('app.tagline')}
          </span>
        </span>
      </div>

      <div className="fixed top-[18px] right-5 z-40 flex items-center gap-1.5">
        <button
          type="button"
          onClick={onToggleLang}
          title={t('app.langSwitch')}
          className="inline-flex h-[34px] cursor-pointer items-center gap-1.5 rounded-full border border-border bg-card px-3 text-[13px] font-medium text-muted"
        >
          <Globe className="size-[15px]" />
          {t('app.langSwitch')}
        </button>
        <button
          type="button"
          onClick={onToggleDark}
          title={t('app.themeToggle')}
          aria-label={t('app.themeToggle')}
          className={ROUND_BUTTON}
        >
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
        <a
          href="https://github.com/apricot-cake/dialect"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          title="GitHub"
          className={ROUND_BUTTON}
        >
          <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor" aria-hidden>
            <path d={siGithub.path} />
          </svg>
        </a>
      </div>
    </>
  )
}
