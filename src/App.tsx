import { useEffect, useRef, useState } from 'react'
import { defaultState } from '@/core/concepts'
import { paramsToState, permalinkUrl, stateToParams } from '@/core/permalink'
import { hasPositiveTerm } from '@/core/text'
import type { QueryState } from '@/core/types'
import { t } from '@/i18n'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryBuilder } from '@/components/QueryBuilder'
import { LaunchPanel } from '@/components/LaunchPanel'

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

        <main className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
          <Card>
            <CardContent>
              <QueryBuilder state={state} onChange={setState} />
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            {!hasPositiveTerm(state) && (
              <p className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
                {t('launch.noQuery')}
              </p>
            )}
            <LaunchPanel state={state} />
            <Button variant="outline" onClick={copyPermalink}>
              {copied ? t('share.copied') : t('share.copyLink')}
            </Button>
          </div>
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
