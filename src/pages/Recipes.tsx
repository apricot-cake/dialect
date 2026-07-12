import { useMemo, useSyncExternalStore } from 'react'
import { PLATFORMS } from '@/core/platforms'
import { defaultState } from '@/core/concepts'
import { resolve } from '@/core/resolve'
import { stateToParams } from '@/core/permalink'
import { getLang, setLang, subscribe } from '@/i18n'
import { pt } from '@/i18n/pageCopy'
import { PlatformBadge } from '@/components/PlatformBadge'
import { StandalonePageHeader } from '@/components/StandalonePageHeader'
import { useDarkMode } from '@/hooks/useDarkMode'
import { RECIPES } from './recipesData'
import type { Lang } from '@/i18n'

function Recipe({
  recipe,
  lang,
  dark,
}: {
  recipe: (typeof RECIPES)[number]
  lang: Lang
  dark: boolean
}) {
  const state = useMemo(() => ({ ...defaultState(), ...recipe.patch }), [recipe])
  const permalink = useMemo(() => `./?${stateToParams(state).toString()}`, [state])
  const supported = useMemo(() => PLATFORMS.filter((p) => resolve(p, state).url !== null), [state])

  return (
    <section className="flex flex-col gap-2.5 rounded-[14px] border border-border bg-card p-4">
      <h2 className="m-0 text-[14.5px] font-bold text-fg">{recipe.title[lang]}</h2>
      <p className="m-0 max-w-[68ch] text-[13px] leading-[1.65] text-muted">
        {recipe.description[lang]}
      </p>
      <a
        href={permalink}
        className="self-start text-[13px] font-medium text-accent no-underline hover:underline"
      >
        {pt(lang, 'recipes.openLink')} →
      </a>
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {supported.map((p) => (
          <PlatformBadge key={p.id} platform={p} dark={dark} size={15} />
        ))}
        {supported.length === 0 && (
          <span className="text-[11.5px] text-faint">{pt(lang, 'recipes.noSupport')}</span>
        )}
      </div>
    </section>
  )
}

export default function Recipes() {
  const lang = useSyncExternalStore(subscribe, getLang)
  const [dark, setDark] = useDarkMode()

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <StandalonePageHeader
        title={pt(lang, 'recipes.title')}
        lang={lang}
        dark={dark}
        onToggleDark={() => setDark((d) => !d)}
        onToggleLang={() => setLang(lang === 'ja' ? 'en' : 'ja')}
      />
      <main className="mx-auto flex w-full max-w-[900px] flex-col gap-8 px-5 pt-4 pb-16">
        <p className="max-w-[68ch] text-[13.5px] leading-[1.7] text-muted">
          {pt(lang, 'recipes.intro')}
        </p>
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}
        >
          {RECIPES.map((recipe) => (
            <Recipe key={recipe.id} recipe={recipe} lang={lang} dark={dark} />
          ))}
        </div>
      </main>
    </div>
  )
}
