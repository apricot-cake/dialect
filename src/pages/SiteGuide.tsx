import { useMemo, useSyncExternalStore } from 'react'
import { PLATFORMS } from '@/core/platforms'
import { CONCEPT_DEFS } from '@/core/conceptDefs'
import { supportOf } from '@/core/types'
import type { PlatformId, SupportLevel } from '@/core/types'
import { getLang, setLang, subscribe, t } from '@/i18n'
import { pt } from '@/i18n/pageCopy'
import { PlatformBadge } from '@/components/PlatformBadge'
import { StandalonePageHeader } from '@/components/StandalonePageHeader'
import { useDarkMode } from '@/hooks/useDarkMode'
import { SITE_GUIDES } from './siteGuides'
import type { GuideSource } from './siteGuides/types'

function levelDot(level: SupportLevel): string {
  if (level === 'full') return 'bg-[oklch(0.7_0.15_150)]'
  if (level === 'partial') return 'bg-[oklch(0.75_0.14_95)]'
  return 'bg-[oklch(0.6_0.01_272)]'
}

const SOURCE_LABEL: Record<GuideSource, { ja: string; en: string }> = {
  doc: { ja: '公式ドキュメント', en: 'Official docs' },
  url: { ja: 'URL確認', en: 'URL check' },
  gui: { ja: 'GUI操作で確認', en: 'Verified via the site UI' },
}

export default function SiteGuide({ platformId }: { platformId: PlatformId }) {
  const lang = useSyncExternalStore(subscribe, getLang)
  const [dark, setDark] = useDarkMode()

  const platform = PLATFORMS.find((p) => p.id === platformId)
  const guide = SITE_GUIDES[platformId]

  // 対応条件の一覧(自動生成)。noneは表示せず、対応している条件だけを見せる
  const supportedConcepts = useMemo(() => {
    if (!platform) return []
    return CONCEPT_DEFS.filter((def) => supportOf(platform, def.id).level !== 'none')
  }, [platform])

  if (!platform) return null

  const title = lang === 'ja' ? `${platform.name}の検索` : `Searching ${platform.name}`

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <StandalonePageHeader
        title={title}
        lang={lang}
        dark={dark}
        onToggleDark={() => setDark((d) => !d)}
        onToggleLang={() => setLang(lang === 'ja' ? 'en' : 'ja')}
      />
      <main className="mx-auto flex w-full max-w-[900px] flex-col gap-8 px-5 pt-4 pb-16">
        <div className="flex items-center gap-2">
          <PlatformBadge platform={platform} dark={dark} size={20} />
        </div>

        <section className="flex flex-col gap-2">
          <h2 className="m-0 text-[14.5px] font-bold text-fg">
            {pt(lang, 'siteGuide.supportedTitle')}
          </h2>
          <div className="flex flex-col rounded-[14px] border border-border bg-card">
            {supportedConcepts.map((def) => {
              const support = supportOf(platform, def.id)
              return (
                <div
                  key={def.id}
                  className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 border-b border-border px-4 py-2.5 last:border-b-0"
                >
                  <span
                    className={`size-2 shrink-0 self-center rounded-full ${levelDot(support.level)}`}
                  />
                  <span className="text-[13px] font-medium text-fg">{t(def.labelKey)}</span>
                  {support.level === 'partial' && support.noteKey && (
                    <span className="text-[12px] text-muted">{t(support.noteKey)}</span>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {guide && (
          <section className="flex flex-col gap-3">
            <h2 className="m-0 text-[14.5px] font-bold text-fg">
              {pt(lang, 'siteGuide.notesTitle')}
            </h2>
            {guide.sections.map((section, i) => (
              <div
                key={i}
                className="flex flex-col gap-1.5 rounded-[14px] border border-border bg-card p-4"
              >
                <h3 className="m-0 text-[13.5px] font-bold text-fg">{section.title[lang]}</h3>
                <p className="m-0 max-w-[68ch] text-[13px] leading-[1.65] text-muted">
                  {section.body[lang]}
                </p>
                <span className="text-[11px] text-faint">
                  {pt(lang, 'siteGuide.checkedAt')} {section.checkedAt}{' '}
                  {lang === 'ja'
                    ? `（${SOURCE_LABEL[section.source][lang]}）`
                    : `(${SOURCE_LABEL[section.source][lang]})`}
                </span>
              </div>
            ))}
          </section>
        )}

        {guide?.examples && guide.examples.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="m-0 text-[14.5px] font-bold text-fg">
              {pt(lang, 'siteGuide.examplesTitle')}
            </h2>
            <div className="flex flex-col gap-1.5">
              {guide.examples.map((example, i) => (
                <a
                  key={i}
                  href={example.permalink}
                  className="text-[13px] font-medium text-accent-bright no-underline hover:underline"
                >
                  {example.label[lang]} →
                </a>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
