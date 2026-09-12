import { useEffect, useMemo, useRef, useState } from 'react'
import { useContentLang, useResolvedEntries, useT } from '@/hooks'
import { buildDocs, makeFuse, search } from '@/lib/search'
import { resolveText } from '@/lib/localized'
import { sourceBadgeStyle } from '@/lib/sources'
import { categoryLabel } from '@/i18n/categories'
import { ENTRY_TYPES, type EntryType, type SourcedEntry } from '@/types/entry'

/** Max rows listed when browsing a type with no query (keeps the DOM small). */
const BROWSE_CAP = 300

/**
 * Modal to pick entries from the active books. Stays open after each pick so a
 * whole list can be assembled in one go; `picked` marks what is already in it.
 */
export function EntryPicker({
  onPick,
  onClose,
  picked,
  initialType = 'bestiary',
}: {
  onPick: (entry: SourcedEntry) => void
  onClose: () => void
  /** Keys already in the target list, shown as "added". */
  picked?: Set<string>
  initialType?: EntryType | 'all'
}) {
  const { t } = useT()
  const lang = useContentLang()
  const entries = useResolvedEntries()
  const [query, setQuery] = useState('')
  const [type, setType] = useState<EntryType | 'all'>(initialType)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const pool = useMemo(
    () => (type === 'all' ? entries : entries.filter((e) => e.type === type)),
    [entries, type],
  )
  const fuse = useMemo(() => makeFuse(buildDocs(pool, lang)), [pool, lang])

  // No query: browse the whole type alphabetically. With a query: fuzzy search.
  const results = useMemo<SourcedEntry[]>(() => {
    const q = query.trim()
    if (!q)
      return pool
        .slice()
        .sort((a, b) =>
          resolveText(a.name, lang).localeCompare(resolveText(b.name, lang)),
        )
        .slice(0, BROWSE_CAP)
    return search(fuse, q).slice(0, 60)
  }, [fuse, query, pool, lang])

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative flex max-h-full w-full max-w-xl flex-col overflow-hidden rounded-lg border border-black/10 bg-parchment shadow-2xl dark:border-white/10 dark:bg-ink">
        <div className="flex shrink-0 items-center gap-2 border-b border-black/10 px-3 py-2 dark:border-white/10">
          <h2 className="font-display text-sm font-bold">{t.encounters.pickTitle}</h2>
          <button
            onClick={onClose}
            className="ml-auto rounded px-2 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/10"
          >
            {t.encounters.done}
          </button>
        </div>

        <div className="shrink-0 space-y-2 border-b border-black/10 p-3 dark:border-white/10">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.omni.placeholder}
            className="w-full rounded border border-black/15 bg-white/70 px-3 py-2 text-sm outline-none focus:border-blood dark:border-white/15 dark:bg-white/5"
          />
          <div className="flex flex-wrap gap-1">
            <TypeChip active={type === 'all'} onClick={() => setType('all')}>
              {t.encounters.allTypes}
            </TypeChip>
            {ENTRY_TYPES.map((ty) => (
              <TypeChip key={ty} active={type === ty} onClick={() => setType(ty)}>
                {t.types[ty]}
              </TypeChip>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {results.length === 0 ? (
            <p className="p-4 text-center text-sm opacity-50">{t.omni.empty}</p>
          ) : (
            <ul className="divide-y divide-black/5 dark:divide-white/5">
              {results.map((e) => (
                <li key={e.source + ':' + e.key}>
                  <button
                    onClick={() => onPick(e)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <span className="truncate font-medium">
                      {resolveText(e.name, lang)}
                    </span>
                    {e.category && (
                      <span className="truncate text-xs opacity-50">
                        {categoryLabel(e.category, lang)}
                      </span>
                    )}
                    <span className="ml-auto shrink-0 text-xs opacity-45">
                      {t.types[e.type]}
                    </span>
                    <span
                      style={sourceBadgeStyle(e.sourceAbbrev)}
                      className="shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium"
                    >
                      {e.sourceAbbrev}
                    </span>
                    <span className="w-4 shrink-0 text-center text-brass">
                      {picked?.has(e.key) ? '✓' : '+'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function TypeChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-2 py-0.5 text-xs ${
        active
          ? 'border-blood bg-blood/15 text-blood'
          : 'border-black/15 opacity-70 hover:opacity-100 dark:border-white/15'
      }`}
    >
      {children}
    </button>
  )
}
