import { X } from 'lucide-react'
import type { StoredQuery } from '@/core/storage'
import { toSets } from '@/core/storage'
import { summarizeSets } from '@/core/summary'
import type { QueryState } from '@/core/types'
import { t } from '@/i18n'

interface Props {
  saved: StoredQuery[]
  history: StoredQuery[]
  onRestore: (sets: QueryState[]) => void
  onDelete: (params: string) => void
}

function QueryList({
  entries,
  onRestore,
  onDelete,
}: {
  entries: StoredQuery[]
  onRestore: (sets: QueryState[]) => void
  onDelete?: (params: string) => void
}) {
  return (
    <ul className="flex flex-col gap-1">
      {entries.map((entry) => (
        <li key={entry.params} className="flex items-center gap-1">
          <button
            type="button"
            className="min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
            onClick={() => onRestore(toSets(entry))}
          >
            {summarizeSets(toSets(entry))}
          </button>
          {onDelete && (
            <button
              type="button"
              aria-label={t('saved.delete')}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => onDelete(entry.params)}
            >
              <X className="size-3.5" />
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}

export function SavedSearches({ saved, history, onRestore, onDelete }: Props) {
  if (saved.length === 0 && history.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      {saved.length > 0 && (
        <section className="flex flex-col gap-1.5">
          <h2 className="text-xs font-medium text-muted-foreground">
            {t('saved.title')}
          </h2>
          <QueryList entries={saved} onRestore={onRestore} onDelete={onDelete} />
        </section>
      )}
      {history.length > 0 && (
        <section className="flex flex-col gap-1.5">
          <h2 className="text-xs font-medium text-muted-foreground">
            {t('history.title')}
          </h2>
          <QueryList entries={history} onRestore={onRestore} />
        </section>
      )}
    </div>
  )
}
