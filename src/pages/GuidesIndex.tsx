import { useSyncExternalStore } from 'react'
import { PLATFORMS } from '@/core/platforms'
import { getLang, setLang, subscribe, t } from '@/i18n'
import { pt } from '@/i18n/pageCopy'
import { PlatformBadge } from '@/components/PlatformBadge'
import { StandalonePageHeader } from '@/components/StandalonePageHeader'
import { useDarkMode } from '@/hooks/useDarkMode'
import { GROUPS } from '@/lib/platformGroups'

export default function GuidesIndex() {
  const lang = useSyncExternalStore(subscribe, getLang)
  const [dark, setDark] = useDarkMode()

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <StandalonePageHeader
        title={pt(lang, 'guides.title')}
        lang={lang}
        dark={dark}
        onToggleDark={() => setDark((d) => !d)}
        onToggleLang={() => setLang(lang === 'ja' ? 'en' : 'ja')}
      />
      <main className="mx-auto flex w-full max-w-[900px] flex-col gap-6 px-5 pt-4 pb-16">
        <p className="max-w-[68ch] text-[13.5px] leading-[1.7] text-muted">
          {pt(lang, 'guides.intro')}
        </p>
        {GROUPS.map(({ group, labelKey }) => {
          const platforms = PLATFORMS.filter((p) => p.group === group)
          if (platforms.length === 0) return null
          return (
            <section key={group} className="flex flex-col gap-2.5">
              <h2 className="m-0 text-[13px] font-bold text-muted uppercase">{t(labelKey)}</h2>
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
              >
                {platforms.map((platform) => (
                  <a
                    key={platform.id}
                    href={`./sites/${platform.id}.html`}
                    className="flex items-center gap-2 rounded-[12px] border border-border bg-card px-3 py-2.5 text-[13px] font-medium text-fg no-underline hover:border-accent"
                  >
                    <PlatformBadge platform={platform} dark={dark} size={16} />
                    {platform.name}
                  </a>
                ))}
              </div>
            </section>
          )
        })}
      </main>
    </div>
  )
}
