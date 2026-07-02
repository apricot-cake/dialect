import { useEffect, useRef, useState } from 'react'
import { defaultState } from '@/core/concepts'
import { paramsToState, permalinkUrl, stateToParams } from '@/core/permalink'
import {
  deleteSaved,
  loadHistory,
  loadSaved,
  recordHistory,
  saveSearch,
} from '@/core/storage'
import { applyTemplate, TEMPLATES } from '@/core/templates'
import { hasPositiveTerm } from '@/core/text'
import type { QueryState } from '@/core/types'
import { t } from '@/i18n'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryBuilder } from '@/components/QueryBuilder'
import { LaunchPanel } from '@/components/LaunchPanel'
import { SavedSearches } from '@/components/SavedSearches'

function initialState(): QueryState {
  if (location.search) {
    return paramsToState(new URLSearchParams(location.search))
  }
  return defaultState()
}

export default function App() {
  const [state, setState] = useState<QueryState>(initialState)
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [saved, setSaved] = useState(loadSaved)
  const [historyEntries, setHistoryEntries] = useState(loadHistory)

  // 現在の条件を常にURLへ反映しておく(ブックマーク・共有用)
  useEffect(() => {
    const params = stateToParams(state).toString()
    history.replaceState(null, '', `${location.pathname}?${params}`)
  }, [state])

  const copyPermalink = async () => {
    await navigator.clipboard.writeText(permalinkUrl(state))
    setCopied(true)
    clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    <TooltipProvider>
      <div className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-8 px-4 py-10">
        <header>
          <p className="text-sm text-muted-foreground">
            {t('app.description')}
          </p>
        </header>

        <main className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {t('template.heading')}
            </span>
            {TEMPLATES.map((template) => (
              <Button
                key={template.id}
                variant="outline"
                size="sm"
                onClick={() => setState(applyTemplate(state, template))}
              >
                {t(template.labelKey)}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => setState(defaultState())}
            >
              {t('template.clear')}
            </Button>
          </div>

          <Card>
            <CardContent>
              <QueryBuilder state={state} onChange={setState} />
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center gap-2">
            {!hasPositiveTerm(state) && (
              <p className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
                {t('launch.noQuery')}
              </p>
            )}
            <div className="ml-auto flex gap-2">
              <Button
                variant="outline"
                disabled={!hasPositiveTerm(state)}
                onClick={() => setSaved(saveSearch(state))}
              >
                {t('saved.save')}
              </Button>
              <Button variant="outline" onClick={copyPermalink}>
                {copied ? t('share.copied') : t('share.copyLink')}
              </Button>
            </div>
          </div>

          <LaunchPanel
            state={state}
            onLaunch={() => setHistoryEntries(recordHistory(state))}
          />

          <SavedSearches
            saved={saved}
            history={historyEntries}
            onRestore={setState}
            onDelete={(params) => setSaved(deleteSaved(params))}
          />
        </main>

        <footer className="mt-auto flex items-center justify-between gap-4 border-t pt-4 text-xs text-muted-foreground">
          <span>{t('footer.disclaimer')}</span>
          <a
            className="shrink-0 underline underline-offset-2"
            href="https://github.com/apricot-cake/dialect"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('footer.github')}
          </a>
        </footer>
      </div>
    </TooltipProvider>
  )
}
