import { useEffect, useRef, useState } from 'react'
import { defaultState } from '@/core/concepts'
import { paramsToQuery, permalinkUrl, stateToParams } from '@/core/permalink'
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
import { hasPositiveTerm } from '@/core/text'
import type { PlatformId, QueryState } from '@/core/types'
import { t, type MessageKey } from '@/i18n'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TooltipProvider } from '@/components/ui/tooltip'
import { PlatformIcon } from '@/components/PlatformIcon'
import { QueryBuilder } from '@/components/QueryBuilder'
import { LaunchPanel } from '@/components/LaunchPanel'
import { SavedSearches } from '@/components/SavedSearches'

function initialQuery(): QueryState {
  if (location.search) {
    return paramsToQuery(new URLSearchParams(location.search))
  }
  return defaultState()
}

type TabId = 'build' | 'launch'

const TABS: Array<{ id: TabId; labelKey: MessageKey }> = [
  { id: 'build', labelKey: 'tab.build' },
  { id: 'launch', labelKey: 'tab.launch' },
]

/**
 * タブ表示にするか。タッチ端末(主ポインタがcoarse) かつ 横幅が狭いときだけタブにする。
 * - PC: ウィンドウを狭くスナップしていても2カラムを維持
 * - iPad横向きなど広いタッチ端末: 2カラム
 * - スマホ・iPad縦向き: タブ。回転で幅が変わったら追従する
 */
const MOBILE_QUERY = '(pointer: coarse) and (max-width: 1023px)'

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia(MOBILE_QUERY).matches,
  )
  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY)
    const onChange = () => setIsMobile(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  return isMobile
}

export default function App() {
  const isMobile = useIsMobile()
  const [query, setQuery] = useState<QueryState>(initialQuery)
  // クリア・復元のたびに増やしてビルダーを再マウントし、
  // キーワード欄が保持している生テキストを state から引き直させる
  const [builderKey, setBuilderKey] = useState(0)
  const canSearch = hasPositiveTerm(query)
  const [tab, setTab] = useState<TabId>('build')
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [saved, setSaved] = useState(loadSaved)
  const [historyEntries, setHistoryEntries] = useState(loadHistory)
  const [hidden, setHidden] = useState<PlatformId[]>(loadHiddenPlatforms)
  const [filterId, setFilterId] = useState<PlatformId | null>(null)

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
  // 絞り込み中のサイトがOFFにされたら絞り込みを解除する
  const activeFilter = enabledPlatforms.some((p) => p.id === filterId)
    ? filterId
    : null

  const replaceQuery = (state: QueryState) => {
    setQuery(state)
    setBuilderKey((k) => k + 1)
  }

  // 現在の条件を常にURLへ反映しておく(ブックマーク・共有用)
  useEffect(() => {
    const params = stateToParams(query).toString()
    history.replaceState(null, '', `${location.pathname}?${params}`)
  }, [query])

  const copyPermalink = async () => {
    await navigator.clipboard.writeText(permalinkUrl(query))
    setCopied(true)
    clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    <TooltipProvider>
      <div
        className={`mx-auto flex min-h-dvh flex-col px-4 ${
          isMobile ? 'max-w-4xl' : 'max-w-7xl'
        }`}
      >
        {/* スマホはタブ切り替え。タブはスクロールしても隠れないよう画面上部に固定する */}
        {isMobile && (
          <nav
            role="tablist"
            className="sticky top-0 z-10 -mx-4 flex gap-1 border-b bg-background px-4"
          >
            {TABS.map(({ id, labelKey }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                className={`border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
                  tab === id
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setTab(id)}
              >
                {t(labelKey)}
              </button>
            ))}
          </nav>
        )}

        <main
          className={
            isMobile
              ? 'flex flex-col gap-8 py-6'
              : 'grid grid-cols-2 items-start gap-10 py-6'
          }
        >
          {/* 条件タブ / PCでは左カラム: 検索条件の組み立て */}
          <section
            className={`${
              isMobile && tab !== 'build' ? 'hidden' : 'flex'
            } flex-col gap-8`}
          >
            {!isMobile && (
              <h2 className="text-base font-semibold">
                {t('section.builder')}
              </h2>
            )}
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                {/* 条件の一覧をサイトで絞る(値の入った条件は絞っても隠れない) */}
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">
                    {t('builder.filter.label')}
                  </span>
                  <Button
                    variant={activeFilter === null ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setFilterId(null)}
                  >
                    {t('builder.filter.all')}
                  </Button>
                  {enabledPlatforms.map((p) => (
                    <Button
                      key={p.id}
                      variant={activeFilter === p.id ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() =>
                        setFilterId(activeFilter === p.id ? null : p.id)
                      }
                    >
                      <PlatformIcon
                        id={p.id}
                        className="size-3.5"
                        style={{ color: p.brandColor }}
                      />
                      {p.name}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-muted-foreground"
                  onClick={() => replaceQuery(defaultState())}
                >
                  {t('builder.clear')}
                </Button>
              </div>

              <Card>
                <CardContent className="flex flex-col gap-4">
                  <QueryBuilder
                    key={builderKey}
                    state={query}
                    onChange={setQuery}
                    platforms={enabledPlatforms}
                    filterId={activeFilter}
                  />
                </CardContent>
              </Card>

              <div className="flex flex-wrap items-center gap-2">
                <div className="ml-auto flex gap-2">
                  <Button
                    variant="outline"
                    disabled={!canSearch}
                    onClick={() => setSaved(saveSearch(query))}
                  >
                    {t('saved.save')}
                  </Button>
                  <Button variant="outline" onClick={copyPermalink}>
                    {copied ? t('share.copied') : t('share.copyLink')}
                  </Button>
                </div>
              </div>
            </div>

            <SavedSearches
              saved={saved}
              history={historyEntries}
              onRestore={replaceQuery}
              onDelete={(params) => setSaved(deleteSaved(params))}
            />
          </section>

          {/* 検索タブ / PCでは右カラム: 各サイトで開く */}
          <section
            className={`${
              isMobile && tab !== 'launch' ? 'hidden' : 'flex'
            } flex-col gap-4`}
          >
            {!isMobile && (
              <h2 className="text-base font-semibold">
                {t('section.launch')}
              </h2>
            )}
            <LaunchPanel
              state={query}
              hidden={hidden}
              onToggleHidden={toggleHidden}
              onLaunch={() => setHistoryEntries(recordHistory(query))}
            />
          </section>
        </main>

        <footer className="mt-auto flex items-center justify-between gap-4 border-t py-4 text-xs text-muted-foreground">
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
