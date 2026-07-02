import { PLATFORMS } from '@/core/platforms'
import type { ConceptId, SupportLevel } from '@/core/types'
import { t } from '@/i18n'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const LEVEL_CLASS: Record<SupportLevel, string> = {
  full: 'bg-emerald-500',
  partial: 'bg-amber-400',
  none: 'bg-zinc-300',
}

const LEVEL_LABEL_KEY = {
  full: 'support.full',
  partial: 'support.partial',
  none: 'support.none',
} as const

/** 概念1つに対する4プラットフォームの対応状況インジケータ */
export function SupportDots({ concept }: { concept: ConceptId }) {
  return (
    <span className="flex items-center gap-1.5">
      {PLATFORMS.map((platform) => {
        const support = platform.support[concept]
        const label = `${platform.name}: ${t(LEVEL_LABEL_KEY[support.level])}`
        return (
          <Tooltip key={platform.id}>
            <TooltipTrigger
              className="flex cursor-default items-center p-0"
              aria-label={label}
            >
              <span
                className={`size-2 rounded-full ${LEVEL_CLASS[support.level]}`}
              />
            </TooltipTrigger>
            <TooltipContent>
              {label}
              {support.noteKey ? ` — ${t(support.noteKey)}` : ''}
            </TooltipContent>
          </Tooltip>
        )
      })}
    </span>
  )
}
