import { Fragment, useMemo, useState } from 'react'
import type { QueryState } from '@/core/types'
import { activeConcepts, defaultState } from '@/core/concepts'
import { CONCEPT_MAP } from '@/core/conceptDefs'
import { conceptSummary } from '@/core/preview'
import { tokenize } from '@/core/parse'
import {
  hasFragments,
  mergeFragments,
  parseSmartInput,
  type SmartFragments,
} from '@/core/smartInput'
import { suggestFor, type SmartSuggestion } from '@/core/smartSuggest'
import { conceptColors } from '@/lib/conceptColors'
import { t, type MessageKey } from '@/i18n'

/**
 * Focus-time hint rows (one per grammar item). Labels reuse the concept
 * label keys so the panel and the live-preview chips speak the same words;
 * examples live in i18n as |-separated lists and insert on tap
 */
const HINT_ROWS: { labelKey: MessageKey; exKey: MessageKey }[] = [
  { labelKey: 'concept.exclude.label', exKey: 'smart.hint.exclude.ex' },
  { labelKey: 'concept.exactPhrase.label', exKey: 'smart.hint.phrase.ex' },
  { labelKey: 'concept.fromUser.label', exKey: 'smart.hint.user.ex' },
  { labelKey: 'concept.hashtag.label', exKey: 'smart.hint.tag.ex' },
  { labelKey: 'concept.period.label', exKey: 'smart.hint.period.ex' },
  { labelKey: 'concept.minLikes.label', exKey: 'smart.hint.likes.ex' },
  { labelKey: 'smart.hint.natural', exKey: 'smart.hint.natural.ex' },
]

/**
 * The smart input (issue #16): one always-visible line that is a pure entry
 * point. While typing it live-previews how the text will split into
 * conditions (doubling as an operator tutorial); Enter turns everything into
 * chips on the condition bars and empties the line (input = means,
 * conditions = state). Below the preview, "did you mean" suggestions
 * (issue #17) offer semantic leaps as tappable chips — never auto-applied
 */
export function SmartInput({
  query,
  dark,
  onApply,
  onAdopt,
}: {
  query: QueryState
  dark: boolean
  onApply: (fragments: SmartFragments) => void
  /** Apply one suggestion's patch (the input text is rewritten here) */
  onAdopt: (suggestion: SmartSuggestion) => void
}) {
  const [input, setInput] = useState('')
  const [focused, setFocused] = useState(false)
  // One clock per keystroke is plenty for resolving 今週/today
  const now = useMemo(() => new Date(), [input]) // eslint-disable-line react-hooks/exhaustive-deps
  const fragments = useMemo(() => parseSmartInput(input, now), [input, now])
  const filled = hasFragments(fragments)
  // Preview against a blank state: shows exactly what this line adds
  const previewState = useMemo(() => mergeFragments(defaultState(), fragments), [fragments])
  const previewConcepts = activeConcepts(previewState)
  const colors = conceptColors(previewConcepts, dark)
  const suggestions = useMemo(
    () => (filled ? suggestFor(fragments.terms, query, now) : []),
    [filled, fragments, query, now],
  )

  const submit = () => {
    if (!filled) return
    onApply(fragments)
    setInput('')
  }
  const adopt = (s: SmartSuggestion) => {
    onAdopt(s)
    // Peel the matched word out of the line, keeping the rest as typed
    setInput(
      tokenize(input)
        .map((tok) => (tok === s.source ? s.remainder : tok))
        .filter(Boolean)
        .join(' '),
    )
  }
  /** Label like 「種類: 動画」 for one suggestion, via the shared summaries */
  const suggestionLabel = (s: SmartSuggestion): string => {
    const state = { ...defaultState(), ...s.patch }
    return `${t(CONCEPT_MAP[s.concept].labelKey)}: ${conceptSummary(s.concept, state)}`
  }
  // The hint panel only competes with emptiness: once anything is typed the
  // live preview takes over as the tutorial
  const showHints = focused && input.trim() === ''
  const insertExample = (ex: string) => {
    setInput((prev) => (prev && !/[\s　]$/.test(prev) ? `${prev} ` : prev) + ex)
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="dl-bar">
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
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            // isComposing guards against IME conversion commits (ja input)
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              e.preventDefault()
              submit()
            }
            if (e.key === 'Escape') e.currentTarget.blur()
          }}
          className="h-9 min-w-0 flex-1 border-none bg-transparent text-[15px] text-fg outline-none placeholder:text-faint"
        />
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
      {showHints && (
        <div className="rounded-[10px] border border-border bg-card px-3.5 py-3 text-[12px] leading-[1.6]">
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
                      <button
                        key={ex}
                        type="button"
                        data-noscale
                        // Keep the input focused through the tap (no blur flicker)
                        onPointerDown={(e) => e.preventDefault()}
                        onClick={() => insertExample(ex)}
                        className="inline-flex cursor-pointer items-center rounded-full border border-border bg-bg px-2.5 py-0.5 text-fg"
                      >
                        {ex}
                      </button>
                    ))}
                </span>
              </Fragment>
            ))}
          </div>
        </div>
      )}
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
      {suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 px-2 text-[12px] leading-[1.5]">
          <span className="text-faint">{t('smart.suggest')}</span>
          {suggestions.map((s) => (
            <button
              key={s.key}
              type="button"
              data-noscale
              onClick={() => adopt(s)}
              className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-border bg-card px-2.5 py-0.5 font-semibold text-label"
            >
              <span className="text-accent">+</span>
              {suggestionLabel(s)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
