import { Fragment, useMemo, useRef, useState } from 'react'
import { Popover } from '@base-ui/react/popover'
import { activeConcepts, defaultState } from '@/core/concepts'
import { CONCEPT_MAP } from '@/core/conceptDefs'
import { conceptSummary } from '@/core/preview'
import {
  hasFragments,
  mergeFragments,
  parseSmartInput,
  type SmartFragments,
} from '@/core/smartInput'
import { conceptColors } from '@/lib/conceptColors'
import { t, type MessageKey } from '@/i18n'

/**
 * Hint rows (one per grammar item) for the on-demand help panel. Labels
 * reuse the concept label keys so the panel and the live-preview chips
 * speak the same words; examples live in i18n as |-separated lists
 */
const HINT_ROWS: { labelKey: MessageKey; exKey: MessageKey }[] = [
  { labelKey: 'concept.exclude.label', exKey: 'smart.hint.exclude.ex' },
  { labelKey: 'concept.exactPhrase.label', exKey: 'smart.hint.phrase.ex' },
  { labelKey: 'concept.fromUser.label', exKey: 'smart.hint.user.ex' },
  { labelKey: 'concept.hashtag.label', exKey: 'smart.hint.tag.ex' },
]

/**
 * The smart input (issue #16): one always-visible line that is a pure entry
 * point. While typing it live-previews how the text will split into
 * conditions (doubling as an operator tutorial); Enter turns everything into
 * chips on the condition bars and empties the line (input = means,
 * conditions = state)
 */
export function SmartInput({
  dark,
  onApply,
}: {
  dark: boolean
  onApply: (fragments: SmartFragments) => void
}) {
  const [input, setInput] = useState('')
  const [helpOpen, setHelpOpen] = useState(false)
  // The hint popover is anchored to the whole bar (not the "?" trigger) so
  // its offset clears the bar's rounded edge instead of the button inside it
  const barRef = useRef<HTMLDivElement>(null)
  const fragments = useMemo(() => parseSmartInput(input), [input])
  const filled = hasFragments(fragments)
  // Preview against a blank state: shows exactly what this line adds
  const previewState = useMemo(() => mergeFragments(defaultState(), fragments), [fragments])
  const previewConcepts = activeConcepts(previewState)
  const colors = conceptColors(previewConcepts, dark)

  const submit = () => {
    if (!filled) return
    onApply(fragments)
    setInput('')
  }
  // The hint panel is an anchored popover on the "?" button (hover or tap;
  // auto-opening on focus proved intrusive, and an in-flow panel shoved the
  // layout down). It's a read-only cheat sheet: tap-to-insert was dropped
  // because most examples are placeholders the user would have to retype
  // anyway. It only competes with emptiness: once anything is typed the
  // live preview takes over as the tutorial

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="dl-bar" ref={barRef}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--faint)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          value={input}
          aria-label={t('smart.label')}
          placeholder={t('smart.placeholder')}
          onChange={(e) => {
            setInput(e.target.value)
            // Typing hides the panel; don't let it pop back on later clears
            if (e.target.value.trim() !== '') setHelpOpen(false)
          }}
          onKeyDown={(e) => {
            // isComposing guards against IME conversion commits (ja input)
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              e.preventDefault()
              submit()
            }
            if (e.key === 'Escape') setHelpOpen(false)
          }}
          className="h-9 min-w-0 flex-1 border-none bg-transparent text-[15px] text-fg outline-none placeholder:text-faint"
        />
        {input.trim() === '' && (
          <Popover.Root open={helpOpen} onOpenChange={setHelpOpen}>
            <Popover.Trigger
              data-noscale
              openOnHover
              delay={150}
              aria-label={t('smart.hint.toggle')}
              title={t('smart.hint.toggle')}
              className={`inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full ${
                helpOpen ? 'text-accent' : 'text-faint'
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
              </svg>
            </Popover.Trigger>
            <Popover.Portal>
              {/* Open upward: in the hero layout the space above the bar is
                  empty, while below sit the action buttons the panel would
                  half-cover. Flips to the bottom automatically when short
                  on space */}
              <Popover.Positioner
                anchor={barRef}
                side="top"
                align="end"
                sideOffset={6}
                collisionPadding={12}
                className="z-50"
              >
                <Popover.Popup className="dl-glass dl-drop-in w-[min(360px,calc(100vw-24px))] rounded-[14px] px-3.5 py-3 text-[12px] leading-[1.6]">
                  <div className="mb-2 text-faint">{t('smart.hint.title')}</div>
                  <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5">
                    {HINT_ROWS.map((row) => (
                      <Fragment key={row.exKey}>
                        <span className="font-semibold whitespace-nowrap text-label">
                          {t(row.labelKey)}
                        </span>
                        <span className="flex flex-wrap items-center gap-1.5">
                          {t(row.exKey)
                            .split('|')
                            .map((ex) => (
                              <span
                                key={ex}
                                className="inline-flex items-center rounded-full border border-border bg-bg px-2.5 py-0.5 text-fg"
                              >
                                {ex}
                              </span>
                            ))}
                        </span>
                      </Fragment>
                    ))}
                  </div>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        )}
        {filled && (
          <button
            type="button"
            data-noscale
            onClick={submit}
            className="inline-flex h-8 shrink-0 cursor-pointer items-center rounded-full bg-accent px-3.5 text-[12.5px] font-semibold text-white"
          >
            {t('smart.commit')}
          </button>
        )}
      </div>
      {input.trim() !== '' && filled && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 px-2 text-[12px] leading-[1.5]">
          <span className="text-faint">{t('smart.preview')}</span>
          {previewConcepts.map((concept) => {
            const s = conceptSummary(concept, previewState)
            if (!s) return null
            return (
              <span
                key={concept}
                className="inline-flex max-w-full items-baseline gap-1 rounded-[8px] border border-border bg-card px-2 py-0.5"
              >
                <span
                  className="font-semibold whitespace-nowrap"
                  style={{ color: colors.get(concept) }}
                >
                  {t(CONCEPT_MAP[concept].labelKey)}
                </span>
                <span className="min-w-0 break-words text-fg">{s}</span>
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
