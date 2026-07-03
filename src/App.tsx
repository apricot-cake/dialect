import { useEffect, useRef, useState } from 'react'
import {
  Bookmark,
  Check,
  Eraser,
  Languages,
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
import { getLang, setLang, t, type Lang } from '@/i18n'
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

// サイト絞り込みの選択中スタイル。薄グレーの枠背景(bg-muted/30)と secondary が
// ほぼ同色で埋もれるため、淡い塗り+輪郭でコントラストを付ける
// (塗りは淡めにしてブランド色アイコンを潰さない)
const FILTER_ACTIVE = 'bg-primary/15 ring-1 ring-primary/40 hover:bg-primary/20'

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
  // t() はモジュールの現在言語を読むだけなので、切替時はこの state 更新で
  // ツリー全体を再描画して新しい言語の文言を引き直させる
  const [lang, setLangState] = useState<Lang>(getLang)
  const toggleLang = () => {
    const next: Lang = lang === 'ja' ? 'en' : 'ja'
    setLang(next)
    setLangState(next)
  }

  const replaceQuery = (state: QueryState) => {
    setQuery(state)
    setBuilderKey((k) => k + 1)
  }

  // 現在の条件を常にURLへ反映しておく(ブックマーク・共有用)。
  // ただし条件が1つも無いとき(v= だけ)はクエリを付けず、初期表示のURLを汚さない
  useEffect(() => {
    const params = stateToParams(query)
    const hasConditions = [...params.keys()].some((k) => k !== 'v')
    history.replaceState(
      null,
      '',
      hasConditions ? `${location.pathname}?${params}` : location.pathname,
    )
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
        {/* ページ左上のツール名+機能説明。右端に言語切替。ロゴやキャッチコピーは置かない */}
        <header className="flex items-start justify-between gap-4 pt-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-semibold tracking-tight">
              {t('app.title')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('app.description')}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 text-muted-foreground"
            onClick={toggleLang}
          >
            <Languages className="size-3.5" />
            {t('app.langSwitch')}
          </Button>
        </header>
        <main
          className={
            isMobile
              ? // 下部の切り替えボタンに最後の内容が隠れないよう余白をとる
                'flex flex-col gap-8 pt-8 pb-24'
              : 'grid grid-cols-2 items-start gap-10 pt-8 pb-6'
          }
        >
          {/* 条件タブ / PCでは左カラム: 検索条件の組み立て */}
          <section
            className={`${
              isMobile && tab !== 'build' ? 'hidden' : 'flex'
            } flex-col gap-8`}
          >
            <h2 className="text-sm font-semibold tracking-tight">
              {t('column.build')}
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {/* 条件への操作(保存・共有・クリア)。下のサイト絞り込み枠や
                      右カラムの説明文と左端の軸をそろえるため左寄せにする */}
                  <div className="flex shrink-0 items-center gap-1">
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
                {/* サイトで絞る: ラベルを1行目に独立させ、2行目以降にサイトの絞り込みを折り返す。
                    各サイトはアイコンのみ(ホバーで名前)。選択中はハイライト、もう一度押すと解除=すべて */}
                <div className="flex flex-col gap-2 rounded-xl bg-card p-3 shadow-sm ring-1 ring-foreground/10">
                  <Tooltip>
                    <TooltipTrigger className="cursor-help self-start text-xs font-medium text-muted-foreground">
                      {t('builder.filter.label')}
                    </TooltipTrigger>
                    <TooltipContent className="max-w-64">
                      {t('builder.filter.help')}
                    </TooltipContent>
                  </Tooltip>
                  <div className="flex flex-wrap items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-7 ${filterId === null ? FILTER_ACTIVE : ''}`}
                      onClick={() => setFilterId(null)}
                    >
                      {t('builder.filter.all')}
                    </Button>
                    {PLATFORMS.map((p) => (
                      <Tooltip key={p.id}>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className={
                                filterId === p.id ? FILTER_ACTIVE : undefined
                              }
                              aria-label={p.name}
                              aria-pressed={filterId === p.id}
                              onClick={() =>
                                setFilterId(filterId === p.id ? null : p.id)
                              }
                            />
                          }
                        >
                          <PlatformIcon
                            id={p.id}
                            className="size-4"
                            style={{ color: p.brandColor }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>{p.name}</TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              </div>

              <Card className="shadow-sm">
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
            } flex-col gap-8`}
          >
            <h2 className="text-sm font-semibold tracking-tight">
              {t('column.launch')}
            </h2>
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
