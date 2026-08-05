import { Link } from 'react-router-dom'
import { ENTRY_TYPES } from '@/types/entry'
import { useResolvedEntries, useT, useVisibleManifest } from '@/hooks'
import { useLibrary } from '@/store/useLibrary'
import { Disclaimer } from '@/components/Disclaimer'
import { langBadge } from '@/i18n'
import { useMemo } from 'react'

export function Home() {
  const { t } = useT()
  const entries = useResolvedEntries()
  const manifest = useVisibleManifest()
  const books = useLibrary((s) => s.books)
  const activeBookIds = useLibrary((s) => s.activeBookIds)
  const toggleBook = useLibrary((s) => s.toggleBook)

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const e of entries) c[e.type] = (c[e.type] ?? 0) + 1
    return c
  }, [entries])

  // The bundled "Livro Exemplo" is a starter demo — it does not count as the
  // user's own content, so the empty-state notice still shows when it is the
  // only active book.
  const hasRealContent = useMemo(
    () => entries.some((e) => e.source !== 'swade-example'),
    [entries],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-lg font-bold sm:text-xl">
          {t.home.title}
        </h1>
        <span className="text-sm opacity-60">
          {entries.length} {t.books.entries}
        </span>
      </div>

      <Disclaimer />

      {!hasRealContent && (
        <div className="rounded border border-brass/40 bg-brass/5 p-4">
          <h2 className="font-display text-lg font-semibold text-brass">
            {t.home.emptyTitle}
          </h2>
          <p className="mt-1 text-sm opacity-80">{t.home.emptyBody}</p>
          <Link
            to="/books"
            className="mt-3 inline-block rounded bg-blood px-3 py-1.5 text-sm text-white hover:opacity-90"
          >
            {t.home.goToBooks}
          </Link>
        </div>
      )}

      {/* Book covers — click to toggle active. */}
      {manifest.length > 0 && (
        <div>
          <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide opacity-60">
            {t.books.title}
          </h2>
          <div className="flex flex-wrap gap-4">
            {manifest.map((m) => {
              const active = activeBookIds.includes(m.id)
              const cover = books[m.id]?.cover ?? m.cover
              const count = books[m.id]?.entries.length ?? 0
              return (
                <button
                  key={m.id}
                  onClick={() => toggleBook(m.id)}
                  title={m.title}
                  aria-pressed={active}
                  className={`group relative w-28 shrink-0 text-left transition ${
                    active ? '' : 'opacity-45 grayscale hover:opacity-70'
                  }`}
                >
                  {cover ? (
                    <img
                      src={cover}
                      alt={m.title}
                      className={`aspect-[5/7] w-full rounded object-cover shadow ${
                        active
                          ? 'ring-2 ring-blood'
                          : 'ring-1 ring-black/10 dark:ring-white/10'
                      }`}
                    />
                  ) : (
                    <div className="aspect-[5/7] w-full rounded bg-black/10 dark:bg-white/10" />
                  )}
                  <div className="absolute right-1 top-1 rounded bg-black/60 px-1 text-[10px] text-white">
                    {active ? t.books.active : t.books.inactive}
                  </div>
                  <div className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[10px] font-medium text-white">
                    {langBadge(m.languages)}
                  </div>
                  <div className="mt-1 truncate text-xs font-medium">{m.title}</div>
                  <div className="text-[11px] opacity-60">
                    {m.abbrev} · {count}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide opacity-60">
          {t.browse.title}
        </h2>
        {/* 10 browsable types — 5 per row, so two rows on desktop. */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {ENTRY_TYPES.filter((type) => (counts[type] ?? 0) > 0).map((type) => (
            <Link
              key={type}
              to={`/browse/${type}`}
              className="group rounded border border-black/10 bg-white/50 p-4 transition-colors hover:border-blood hover:bg-blood/5 dark:border-white/10 dark:bg-white/5 dark:hover:bg-blood/20"
            >
              <div className="font-display text-lg transition-colors group-hover:text-blood dark:group-hover:text-brass">
                {t.types[type]}
              </div>
              <div className="text-sm opacity-60">
                {counts[type]} {t.books.entries}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
