import { Fragment, useEffect, useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { defaultState } from '@/core/concepts'
import { paramsToSets, permalinkUrl, setsToParams } from '@/core/permalink'
import {
  deleteSaved,
  loadHiddenPlatforms,
  loadHistory,
  loadSaved,
  recordHistory,
  saveSearch,
  storeHiddenPlatforms,
} from '@/core/storage'
import { PLATFORMS } from '@/core/platforms'
import { setMark } from '@/core/summary'
import { hasPositiveTerm } from '@/core/text'
import type { PlatformId, QueryState } from '@/core/types'
import { t } from '@/i18n'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryBuilder } from '@/components/QueryBuilder'
import { LaunchPanel } from '@/components/LaunchPanel'
import { SavedSearches } from '@/components/SavedSearches'

/**
 * セットにReactキー用の連番を振る。クリア・復元・セット削除のたびに新しいidに
 * なるので、ビルダーが再マウントされて「条件を追加」で開いた行も畳み直される
 */
let nextSetId = 1
interface SetEntry {
  id: number
  state: QueryState
}

function toEntries(states: QueryState[]): SetEntry[] {
  return states.map((state) => ({ id: nextSetId++, state }))
}

function initialSets(): SetEntry[] {
  if (location.search) {
    return toEntries(paramsToSets(new URLSearchParams(location.search)))
  }
  return toEntries([defaultState()])
}

export default function App() {
  const [sets, setSets] = useState<SetEntry[]>(initialSets)
  const states = sets.map((entry) => entry.state)
  const canSearch = states.some((s) => hasPositiveTerm(s))
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [saved, setSaved] = useState(loadSaved)
  const [historyEntries, setHistoryEntries] = useState(loadHistory)
  const [hidden, setHidden] = useState<PlatformId[]>(loadHiddenPlatforms)

  // 使わないサイトのON/OFF。選択はlocalStorageに記憶する。全OFFにはさせない
  const toggleHidden = (id: PlatformId) => {
    setHidden((prev) => {
      const next = prev.includes(id)
        ? prev.filter((h) => h !== id)
        : [...prev, id]
      if (next.length >= PLATFORMS.length) return prev
      storeHiddenPlatforms(next)
      return next
    })
  }
  const enabledPlatforms = PLATFORMS.filter((p) => !hidden.includes(p.id))

  const updateSet = (id: number, state: QueryState) =>
    setSets((prev) => prev.map((e) => (e.id === id ? { ...e, state } : e)))

  const addSet = () =>
    setSets((prev) => [...prev, ...toEntries([defaultState()])])

  const removeSet = (id: number) =>
    setSets((prev) =>
      prev.length > 1 ? prev.filter((e) => e.id !== id) : prev,
    )

  // 現在の条件を常にURLへ反映しておく(ブックマーク・共有用)
  useEffect(() => {
    const params = setsToParams(sets.map((e) => e.state)).toString()
    history.replaceState(null, '', `${location.pathname}?${params}`)
  }, [sets])

  const copyPermalink = async () => {
    await navigator.clipboard.writeText(permalinkUrl(states))
    setCopied(true)
    clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    <TooltipProvider>
      <div className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-8 px-4 py-10">
        <main className="flex flex-col gap-8">
          {/* 入力エリア: 検索条件の組み立て */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h1 className="text-base font-semibold">
                {t('section.builder')}
              </h1>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => setSets(toEntries([defaultState()]))}
              >
                {t('builder.clear')}
              </Button>
            </div>

            {sets.map((entry, i) => (
              <Fragment key={entry.id}>
                {i > 0 && (
                  <div className="flex items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {t('sets.or')}
                    </span>
                    <Separator className="flex-1" />
                  </div>
                )}
                <Card>
                  <CardContent className="flex flex-col gap-4">
                    {sets.length > 1 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">
                          {t('sets.label')}
                          {setMark(i)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 text-muted-foreground"
                          aria-label={t('sets.remove')}
                          onClick={() => removeSet(entry.id)}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    )}
                    <QueryBuilder
                      state={entry.state}
                      onChange={(state) => updateSet(entry.id, state)}
                      platforms={enabledPlatforms}
                    />
                  </CardContent>
                </Card>
              </Fragment>
            ))}

            <div className="flex flex-col gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="self-start text-muted-foreground"
                onClick={addSet}
              >
                <Plus />
                {t('sets.add')}
              </Button>
              {sets.length > 1 && (
                <p className="text-xs text-muted-foreground">
                  {t('sets.addNote')}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="ml-auto flex gap-2">
                <Button
                  variant="outline"
                  disabled={!canSearch}
                  onClick={() => setSaved(saveSearch(states))}
                >
                  {t('saved.save')}
                </Button>
                <Button variant="outline" onClick={copyPermalink}>
                  {copied ? t('share.copied') : t('share.copyLink')}
                </Button>
              </div>
            </div>
          </section>

          {/* リンクエリア: 背景色を変えて入力エリアと見分けやすくする */}
          <section className="flex flex-col gap-4 rounded-xl bg-muted/50 p-4">
            <h2 className="text-base font-semibold">{t('section.launch')}</h2>
            <LaunchPanel
              sets={states}
              hidden={hidden}
              onToggleHidden={toggleHidden}
              onLaunch={() => setHistoryEntries(recordHistory(states))}
            />
          </section>

          <SavedSearches
            saved={saved}
            history={historyEntries}
            onRestore={(restored) => setSets(toEntries(restored))}
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
