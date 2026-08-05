import type { EntryGroup } from '@/types/entry'
import { useLibrary } from '@/store/useLibrary'
import { useT } from '@/hooks'

/**
 * Lets the user choose which book's version of a game object to view when the
 * same `key` exists in more than one active book.
 */
export function VariationPicker({
  group,
  currentSource,
}: {
  group: EntryGroup
  currentSource: string
}) {
  const { t } = useT()
  const setPref = useLibrary((s) => s.setVariationPref)

  if (group.variations.length < 2) return null

  return (
    <div className="rounded border border-brass/40 bg-brass/10 p-3">
      <p className="mb-2 text-sm font-medium">{t.entry.otherVersions}</p>
      <div className="flex flex-wrap gap-2">
        {group.variations.map((v) => {
          const active = v.source === currentSource
          return (
            <button
              key={v.source}
              onClick={() => setPref(group.key, v.source)}
              className={`rounded px-2 py-1 text-sm ${
                active
                  ? 'bg-blood text-white'
                  : 'bg-white/60 hover:bg-white dark:bg-white/10'
              }`}
            >
              {v.sourceAbbrev}
              {v.page ? ` · ${t.entry.page}${v.page}` : ''}
            </button>
          )
        })}
      </div>
    </div>
  )
}
