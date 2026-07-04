import { useEffect, useRef, useState } from 'react'
import {
  ArrowUp,
  Bookmark,
  Check,
  Eraser,
  Languages,
  Link as LinkIcon,
  Moon,
  Search,
  SlidersHorizontal,
  Sun,
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

// サイト絞り込みの選択中スタイル。半透明塗り+濃いリングは濁って見えたので、
// 単色の淡いグレー塗り(輪郭なし)にする。ブランド色アイコンを潰さない濃さに留める
const FILTER_ACTIVE = 'bg-foreground/10 hover:bg-foreground/15'

// 左右カラムを「面」として分けるため、PCでは各カラムを軽く沈めたトレイに載せる。
// 中身のカードは白なので、ごく淡いグレー地の上で浮いて見える(面の明度差で分離する)。
// bg/ring とも foreground のアルファ塗りにして、ライト=淡いグレー地/ダーク=淡い明色地の
// どちらでも「一段沈んだ面」に見えるようにする
const COLUMN_TRAY =
  'rounded-2xl bg-foreground/[0.035] p-5 ring-1 ring-foreground/[0.07] ' +
  'dark:bg-foreground/[0.05] dark:ring-foreground/[0.12]'

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
  // ダークモード。初期値は index.html の先読みスクリプトが付けた class から拾う
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  )
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])
  // スクロール時だけ出す「最上部へ戻る」ボタンの表示制御
  const [showScrollTop, setShowScrollTop] = useState(false)
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 320)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
      <div className="flex min-h-dvh flex-col">
        {/* ヘッダー: ロゴマーク+ツール名。右端にテーマ/言語切替。追従はせず先頭に置くだけ */}
        <header className="border-b border-border/60 bg-background">
          <div
            className={`mx-auto flex w-full items-center justify-between gap-4 px-4 py-3 ${
              isMobile ? 'max-w-4xl' : 'max-w-7xl'
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              {/* ロゴはファビコンと同じ絵文字(🧐)。OS依存でブレないよう画像として読む */}
              <img
                src={`${import.meta.env.BASE_URL}favicon.svg`}
                alt=""
                aria-hidden
                className="size-8 shrink-0"
              />
              <div className="flex min-w-0 flex-col">
                <h1 className="truncate text-base leading-tight font-semibold tracking-tight">
                  {t('app.title')}
                </h1>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground"
                aria-label={t('app.themeToggle')}
                onClick={() => setDark((d) => !d)}
              >
                {dark ? <Sun /> : <Moon />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={toggleLang}
              >
                <Languages className="size-3.5" />
                {t('app.langSwitch')}
              </Button>
            </div>
          </div>
        </header>

        <div
          className={`mx-auto flex w-full flex-1 flex-col px-4 ${
            isMobile ? 'max-w-4xl' : 'max-w-7xl'
          }`}
        >
          <main
            className={
              isMobile
                ? // 下部の切り替えボタンに最後の内容が隠れないよう余白をとる
                  'flex flex-col gap-8 pt-6 pb-24'
                : 'grid grid-cols-2 items-start gap-6 pt-8 pb-6'
            }
          >
          {/* 条件タブ / PCでは左カラム: 検索条件の組み立て */}
          <section
            className={`${
              isMobile && tab !== 'build' ? 'hidden' : 'flex'
            } flex-col gap-8 ${isMobile ? '' : COLUMN_TRAY}`}
          >
            {/* カラム見出しにアイコンを添えて識別性を持たせる。押せると誤認させないよう
                色は付けず中立色にする。アイコンはモバイル切替ボタンと同じ(条件=スライダー) */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 shrink-0 text-muted-foreground" />
              <h2 className="text-sm font-semibold tracking-tight">
                {t('column.build')}
              </h2>
            </div>
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
                  {/* スマホはタップしやすいよう各ボタンを大きめ(約40px)にする */}
                  <div
                    className={`flex flex-wrap items-center ${
                      isMobile ? 'gap-1.5' : 'gap-1'
                    }`}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`${isMobile ? 'h-10 px-4' : 'h-7'} ${
                        filterId === null ? FILTER_ACTIVE : ''
                      }`}
                      onClick={() => setFilterId(null)}
                    >
                      {t('builder.filter.all')}
                    </Button>
                    {PLATFORMS.map((p) => (
                      <Tooltip key={p.id}>
                        {/* アイコンはタップで絞り込みを選ぶのが主目的。ツールチップが残らないようタップ開閉は無効 */}
                        <TooltipTrigger
                          disableTapToggle
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className={`${isMobile ? 'size-10 ' : ''}${
                                filterId === p.id ? FILTER_ACTIVE : ''
                              }`}
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
                            className={isMobile ? 'size-5' : 'size-4'}
                            brandColor={p.brandColor}
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
                    isMobile={isMobile}
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
            } flex-col gap-8 ${isMobile ? '' : COLUMN_TRAY}`}
          >
            {/* 見出しに検索アイコンを添える。左カラムと同じ作り(中立色) */}
            <div className="flex items-center gap-2">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <h2 className="text-sm font-semibold tracking-tight">
                {t('column.launch')}
              </h2>
            </div>
            <LaunchPanel
              state={query}
              onLaunch={() => setHistoryEntries(recordHistory(query))}
              isMobile={isMobile}
            />
          </section>
          </main>

          {/* スマホは検索/条件切替ボタン、PCは戻るボタンが右下に浮くので、
              最下部の注記・GitHubリンクが隠れないよう下余白を確保する */}
          <footer
            className={`mt-auto flex items-center justify-between gap-4 border-t pt-4 text-xs text-muted-foreground ${
              isMobile ? 'pb-24' : 'pb-16'
            }`}
          >
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

        {/* 最上部へ戻る。スマホは右下が切替ボタンで埋まるため左下に置く */}
        {showScrollTop && (
          <Button
            variant="outline"
            size="icon"
            aria-label={t('app.backToTop')}
            className={`fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] z-20 size-10 rounded-full shadow-lg ${
              isMobile ? 'left-4' : 'right-4'
            }`}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <ArrowUp />
          </Button>
        )}
      </div>
    </TooltipProvider>
  )
}
