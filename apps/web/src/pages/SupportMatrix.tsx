import { useSyncExternalStore, useState } from 'react'
import {
  CONCEPT_DEFS,
  PLATFORMS,
  supportOf,
  type ConceptId,
  type PlatformDef,
  type SupportLevel,
} from '@apricot-cake/dialect-core'
import { GROUPS } from '@/lib/platformGroups'
import { getLang, setLang, subscribe, t } from '@/i18n'
import { pt } from '@/i18n/pageCopy'
import { PlatformBadge } from '@/components/PlatformBadge'
import { StandalonePageHeader } from '@/components/StandalonePageHeader'
import { useDarkMode } from '@/hooks/useDarkMode'

/**
 * セル背景色。プロジェクトの慣例(Tailwindの dark: バリアントは使わず、色は dark
 * booleanから都度計算する。PlatformBadge の badgeColor と同じ考え方)に合わせる
 */
function cellColor(level: SupportLevel, dark: boolean): string {
  if (level === 'full') return dark ? 'oklch(0.42 0.09 150)' : 'oklch(0.82 0.1 150)'
  if (level === 'partial') return dark ? 'oklch(0.48 0.1 95)' : 'oklch(0.87 0.12 95)'
  return dark ? 'oklch(0.38 0.008 272)' : 'oklch(0.9 0.004 272)'
}

interface ActiveNote {
  conceptLabel: string
  platformName: string
  noteText: string
}

function Cell({
  platform,
  conceptId,
  dark,
  onOpenNote,
}: {
  platform: PlatformDef
  conceptId: ConceptId
  dark: boolean
  onOpenNote: (note: ActiveNote) => void
}) {
  const support = supportOf(platform, conceptId)
  const clickable = support.level === 'partial' && support.noteKey
  return (
    <td
      className="border border-border p-0 text-center"
      style={{
        background: cellColor(support.level, dark),
        cursor: clickable ? 'pointer' : undefined,
      }}
      onClick={
        clickable
          ? () =>
              onOpenNote({
                conceptLabel: t(CONCEPT_DEFS.find((d) => d.id === conceptId)!.labelKey),
                platformName: platform.name,
                noteText: t(support.noteKey!),
              })
          : undefined
      }
      title={support.level === 'partial' && support.noteKey ? t(support.noteKey) : undefined}
    >
      <span className="inline-block size-full min-h-[30px] min-w-[36px]" aria-hidden />
    </td>
  )
}

export default function SupportMatrix() {
  const lang = useSyncExternalStore(subscribe, getLang)
  const [dark, setDark] = useDarkMode()
  const [note, setNote] = useState<ActiveNote | null>(null)

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <StandalonePageHeader
        title={pt(lang, 'matrix.title')}
        lang={lang}
        dark={dark}
        onToggleDark={() => setDark((d) => !d)}
        onToggleLang={() => setLang(lang === 'ja' ? 'en' : 'ja')}
      />
      <main className="mx-auto flex w-full max-w-[1100px] flex-col gap-5 px-5 pt-4 pb-16">
        <p className="max-w-[68ch] text-[13.5px] leading-[1.7] text-muted">
          {pt(lang, 'matrix.intro')}
        </p>
        <div className="flex flex-wrap items-center gap-4 text-[11.5px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block size-3 rounded-sm"
              style={{ background: cellColor('full', dark) }}
            />
            {pt(lang, 'matrix.legendFull')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block size-3 rounded-sm"
              style={{ background: cellColor('partial', dark) }}
            />
            {pt(lang, 'matrix.legendPartial')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block size-3 rounded-sm"
              style={{ background: cellColor('none', dark) }}
            />
            {pt(lang, 'matrix.legendNone')}
          </span>
        </div>

        <div
          className="overflow-auto rounded-[14px] border border-border"
          style={{ maxHeight: '75dvh' }}
        >
          <table className="border-collapse text-[12px]" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th className="sticky top-0 left-0 z-20 min-w-[180px] border border-border bg-card p-2 text-left align-bottom text-[11px] font-bold text-muted">
                  {pt(lang, 'matrix.conceptColumn')}
                </th>
                {GROUPS.flatMap(({ group }) =>
                  PLATFORMS.filter((p) => p.group === group).map((platform) => (
                    <th
                      key={platform.id}
                      className="sticky top-0 z-10 border border-border bg-card p-1.5 text-center align-bottom"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <PlatformBadge platform={platform} dark={dark} size={15} />
                        <a
                          href={`./sites/${platform.id}.html`}
                          className="max-w-[60px] truncate text-[10px] font-medium text-muted no-underline hover:text-fg hover:underline"
                          title={platform.name}
                        >
                          {platform.name}
                        </a>
                      </div>
                    </th>
                  )),
                )}
              </tr>
            </thead>
            <tbody>
              {CONCEPT_DEFS.map((def) => (
                <tr key={def.id}>
                  <th className="sticky left-0 z-10 border border-border bg-card px-2.5 py-1.5 text-left text-[12px] font-medium text-fg">
                    {t(def.labelKey)}
                  </th>
                  {GROUPS.flatMap(({ group }) =>
                    PLATFORMS.filter((p) => p.group === group).map((platform) => (
                      <Cell
                        key={platform.id}
                        platform={platform}
                        conceptId={def.id}
                        dark={dark}
                        onOpenNote={setNote}
                      />
                    )),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {note && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card px-5 py-3 shadow-[0_-2px_8px_oklch(0_0_0_/_0.08)]">
          <div className="mx-auto flex max-w-[1100px] items-start justify-between gap-4">
            <div className="text-[12.5px] leading-[1.6] text-fg">
              <span className="font-bold">
                {note.conceptLabel} × {note.platformName}
              </span>
              <div className="text-muted">{note.noteText}</div>
            </div>
            <button
              type="button"
              onClick={() => setNote(null)}
              className="shrink-0 cursor-pointer rounded-full border border-border bg-card px-3 py-1 text-[11.5px] font-medium text-muted"
            >
              {pt(lang, 'matrix.closeNote')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
