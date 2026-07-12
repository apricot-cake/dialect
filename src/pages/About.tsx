import { useSyncExternalStore } from 'react'
import { getLang, setLang, subscribe } from '@/i18n'
import { pt } from '@/i18n/pageCopy'
import { StandalonePageHeader } from '@/components/StandalonePageHeader'
import { useDarkMode } from '@/hooks/useDarkMode'

function Section({
  title,
  body,
  link,
}: {
  title: string
  body: string
  link?: { href: string; label: string }
}) {
  return (
    <section className="flex flex-col gap-2 rounded-[14px] border border-border bg-card p-4">
      <h2 className="m-0 text-[15px] font-bold text-fg">{title}</h2>
      <p className="m-0 max-w-[68ch] text-[13.5px] leading-[1.7] text-muted">{body}</p>
      {link && (
        <a
          href={link.href}
          target={link.href.startsWith('http') ? '_blank' : undefined}
          rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="text-[13px] font-medium text-accent no-underline hover:underline"
        >
          {link.label} →
        </a>
      )}
    </section>
  )
}

export default function About() {
  const lang = useSyncExternalStore(subscribe, getLang)
  const [dark, setDark] = useDarkMode()

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <StandalonePageHeader
        titleKey="about.title"
        lang={lang}
        dark={dark}
        onToggleDark={() => setDark((d) => !d)}
        onToggleLang={() => setLang(lang === 'ja' ? 'en' : 'ja')}
      />
      <main className="mx-auto flex w-full max-w-[900px] flex-col gap-8 px-5 pt-4 pb-16">
        <p className="max-w-[68ch] text-[13.5px] leading-[1.7] text-muted">
          {pt(lang, 'about.intro')}
        </p>
        <div className="flex flex-col gap-3">
          <Section
            title={pt(lang, 'about.nothingSent.title')}
            body={pt(lang, 'about.nothingSent.body')}
          />
          <Section
            title={pt(lang, 'about.localOnly.title')}
            body={pt(lang, 'about.localOnly.body')}
          />
          <Section
            title={pt(lang, 'about.openSource.title')}
            body={pt(lang, 'about.openSource.body')}
            link={{
              href: 'https://github.com/apricot-cake/dialect',
              label: pt(lang, 'about.openSource.link'),
            }}
          />
          <Section
            title={pt(lang, 'about.qualityControl.title')}
            body={pt(lang, 'about.qualityControl.body')}
            link={{ href: './health.html', label: pt(lang, 'about.qualityControl.link') }}
          />
        </div>
      </main>
    </div>
  )
}
