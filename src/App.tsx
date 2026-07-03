import { useEffect, useRef, useState } from 'react'
import {
  Bookmark,
  Check,
  ChevronDown,
  ChevronUp,
  Eraser,
  Info,
  Link as LinkIcon,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import { defaultState } from '@/core/concepts'
import { paramsToQuery, permalinkUrl, stateToParams } from '@/core/permalink'
import {
  deleteSaved,
  loadHistory,
  loadSaved,
  recordHistory,
  saveSearch,
} from '@/core/storage'
import { PLATFORMS } from '@/core/platforms'
import { hasPositiveTerm } from '@/core/text'
import type { PlatformId, QueryState } from '@/core/types'
import { t } from '@/i18n'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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

/**
 * 1画面表示にするか。タッチ端末(主ポインタがcoarse) かつ 横幅が狭いときだけ切り替え式にする。
 * - PC: ウィンドウを狭くスナップしていても2カラムを維持
 * - iPad横向きなど広いタッチ端末: 2カラム
 * - スマホ・iPad縦向き: 右下のボタンで2画面を行き来。回転で幅が変わったら追従する
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
  const [filterId, setFilterId] = useState<PlatformId | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const activeFilterDef = PLATFORMS.find((p) => p.id === filterId) ?? null

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
        <main
          className={
            isMobile
              ? // 下部の切り替えボタンに最後の内容が隠れないよう余白をとる
                'flex flex-col gap-8 py-6 pb-24'
              : 'grid grid-cols-2 items-start gap-10 py-6'
          }
        >
          {/* 条件タブ / PCでは左カラム: 検索条件の組み立て */}
          <section
            className={`${
              isMobile && tab !== 'build' ? 'hidden' : 'flex'
            } flex-col gap-8`}
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {/* 条件の一覧をサイトで絞る。リストはクリックで展開する
                      (値の入った条件は絞っても隠れない) */}
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-muted-foreground"
                      aria-expanded={filterOpen}
                      // 長いサイト名で1行から溢れないよう、絞り込み中はアイコンだけで示す
                      title={activeFilterDef?.name}
                      onClick={() => setFilterOpen(!filterOpen)}
                    >
                      {activeFilterDef ? (
                        <>
                          <PlatformIcon
                            id={activeFilterDef.id}
                            className="size-3.5"
                            style={{ color: activeFilterDef.brandColor }}
                          />
                          {t('builder.filter.active')}
                        </>
                      ) : (
                        t('builder.filter.label')
                      )}
                      {filterOpen ? <ChevronUp /> : <ChevronDown />}
                    </Button>
                    <Tooltip>
                      <TooltipTrigger
                        aria-label={t('builder.help.iconLabel')}
                        className="text-muted-foreground/60 hover:text-foreground"
                      >
                        <Info className="size-3.5" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-64">
                        {t('builder.filter.help')}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {/* 条件への操作。表示の絞り込み(左)と区別して右に寄せ、
                      ラベルは短く、説明はホバーのツールチップに持たせる */}
                  <div className="ml-auto flex shrink-0 items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="outline"
                            size="sm"
                            className="px-2.5 text-muted-foreground"
                            disabled={!canSearch}
                            onClick={() => setSaved(saveSearch(query))}
                          />
                        }
                      >
                        <Bookmark />
                        {t('saved.save')}
                      </TooltipTrigger>
                      <TooltipContent className="max-w-64">
                        {t('saved.save.tip')}
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="outline"
                            size="sm"
                            className="px-2.5 text-muted-foreground"
                            onClick={copyPermalink}
                          />
                        }
                      >
                        {copied ? <Check /> : <LinkIcon />}
                        {copied ? t('share.copied') : t('share.copyLink')}
                      </TooltipTrigger>
                      <TooltipContent className="max-w-64">
                        {t('share.copyLink.tip')}
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="outline"
                            size="sm"
                            className="px-2.5 text-muted-foreground"
                            onClick={() => replaceQuery(defaultState())}
                          />
                        }
                      >
                        <Eraser />
                        {t('builder.clear')}
                      </TooltipTrigger>
                      <TooltipContent className="max-w-64">
                        {t('builder.clear.tip')}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                {filterOpen && (
                  <div className="flex flex-wrap items-center gap-1.5 rounded-md border bg-muted/30 p-2">
                    <Button
                      variant={filterId === null ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => {
                        setFilterId(null)
                        setFilterOpen(false)
                      }}
                    >
                      {t('builder.filter.all')}
                    </Button>
                    {PLATFORMS.map((p) => (
                      <Button
                        key={p.id}
                        variant={filterId === p.id ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => {
                          setFilterId(filterId === p.id ? null : p.id)
                          setFilterOpen(false)
                        }}
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
                )}
              </div>

              <Card>
                <CardContent className="flex flex-col gap-4">
                  <QueryBuilder
                    key={builderKey}
                    state={query}
                    onChange={setQuery}
                    platforms={PLATFORMS}
                    filterId={filterId}
                  />
                </CardContent>
              </Card>

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
            <LaunchPanel
              state={query}
              onLaunch={() => setHistoryEntries(recordHistory(query))}
            />
          </section>
        </main>

        {/* スマホは右下の浮きボタン1つで「条件を入力」と「検索する」を行き来する。
            ラベルは移動先の画面を示す */}
        {isMobile && (
          <Button
            size="lg"
            className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-20 h-12 rounded-full px-5 shadow-lg"
            onClick={() => {
              setTab(tab === 'build' ? 'launch' : 'build')
              window.scrollTo({ top: 0 })
            }}
          >
            {tab === 'build' ? <Search /> : <SlidersHorizontal />}
            {t(tab === 'build' ? 'tab.launch' : 'tab.build')}
          </Button>
        )}

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
