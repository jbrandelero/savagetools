import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useResolvedEntries, useContentLang, useT } from '@/hooks'
import { buildDocs, makeFuse, search } from '@/lib/search'
import { resolveText } from '@/lib/localized'
import { sourceBadgeStyle } from '@/lib/sources'
import type { SourcedEntry } from '@/types/entry'

export function Omnisearch(): JSX.Element {
  const entries = useResolvedEntries()
  const lang = useContentLang()
  const { t } = useT()
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Build the Fuse index once per entry set / language.
  const fuse = useMemo(() => makeFuse(buildDocs(entries, lang)), [entries, lang])

  // Recompute results (capped at 30) when the index or query changes.
  const results = useMemo<SourcedEntry[]>(
    () => search(fuse, query).slice(0, 30),
    [fuse, query],
  )

  // Reset the highlighted row whenever the query changes.
  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  // Focus the input when the modal opens.
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Global shortcut: Ctrl+K / Cmd+K to open, Escape to close.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(true)
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function close() {
    setOpen(false)
    setQuery('')
  }

  function select(entry: SourcedEntry) {
    navigate('/entry/' + encodeURIComponent(entry.key))
    close()
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const entry = results[activeIndex]
      if (entry) select(entry)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full max-w-xs items-center justify-between gap-3 rounded border border-black/15 bg-white/70 px-3 py-1.5 text-sm text-ink/60 outline-none hover:border-blood focus:border-blood dark:border-white/15 dark:bg-white/5 dark:text-parchment/60"
      >
        <span className="truncate">{t.omni.placeholder}</span>
        <kbd className="rounded border border-black/20 bg-black/5 px-1.5 py-0.5 text-xs font-medium text-ink/70 dark:border-white/20 dark:bg-white/10 dark:text-parchment/70">
          {t.omni.hint}
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={close}
            aria-hidden="true"
          />
          <div className="relative mx-auto mt-24 max-w-xl px-4">
            <div className="overflow-hidden rounded-lg border border-black/10 bg-parchment shadow-2xl dark:border-white/10 dark:bg-ink">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder={t.omni.placeholder}
                className="w-full border-b border-black/10 bg-transparent px-4 py-3 text-base text-ink outline-none placeholder:text-ink/40 dark:border-white/10 dark:text-parchment dark:placeholder:text-parchment/40"
              />

              {query.trim() !== '' && results.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-ink/50 dark:text-parchment/50">
                  {t.omni.empty}
                </div>
              )}

              {results.length > 0 && (
                <ul className="max-h-80 overflow-y-auto py-1">
                  {results.map((entry, i) => (
                    <li key={entry.source + ':' + entry.key}>
                      <button
                        type="button"
                        onClick={() => select(entry)}
                        onMouseEnter={() => setActiveIndex(i)}
                        className={
                          'flex w-full items-center gap-3 px-4 py-2 text-left ' +
                          (i === activeIndex
                            ? 'bg-blood/10 dark:bg-blood/25'
                            : '')
                        }
                      >
                        <span className="flex-1 truncate text-sm text-ink dark:text-parchment">
                          {resolveText(entry.name, lang)}
                        </span>
                        <span className="shrink-0 text-xs text-ink/45 dark:text-parchment/45">
                          {t.types[entry.type]}
                        </span>
                        <span
                          className="shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold"
                          style={sourceBadgeStyle(entry.sourceAbbrev)}
                        >
                          {entry.sourceAbbrev}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
