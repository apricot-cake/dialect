import { Globe, Moon, Sun } from 'lucide-react'
import { siGithub } from 'simple-icons'
import { t } from '@/i18n'
import { pt, type PageCopyKey } from '@/i18n/pageCopy'
import type { Lang } from '@/i18n'

const ROUND_BUTTON =
  'inline-flex size-[34px] cursor-pointer items-center justify-center rounded-full border border-border bg-card text-muted'

/**
 * Header shared by the standalone reference pages (health.html / matrix.html).
 * Mirrors AppHeader's look (same round-button chrome, lang/theme/GitHub controls)
 * but replaces the app tagline with a plain-text "back to the app" link and takes
 * a titleKey so each page can show its own heading.
 */
export function StandalonePageHeader({
  titleKey,
  lang,
  dark,
  onToggleDark,
  onToggleLang,
}: {
  titleKey: PageCopyKey
  lang: Lang
  dark: boolean
  onToggleDark: () => void
  onToggleLang: () => void
}) {
  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-3 px-5 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <a
          href="./"
          className="text-[13px] font-medium text-muted no-underline hover:text-fg"
        >
          {pt(lang, 'page.backToApp')}
        </a>
        <div className="flex items-center gap-1.5">
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
      </div>
      <h1 className="m-0 text-[22px] font-bold tracking-[-0.01em] text-fg">
        {pt(lang, titleKey)}
      </h1>
    </div>
  )
}
