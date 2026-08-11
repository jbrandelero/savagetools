import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import type { EntryType } from '@/types/entry'
import { Omnisearch } from './Omnisearch'
import { ThemeToggle } from './ThemeToggle'
import { LanguageMenu } from './LanguageSwitcher'
import { SpannerIcon } from './SpannerIcon'
import { useCategoriesByType, useContentLang, useT } from '@/hooks'
import { usePwaInstall } from '@/hooks/usePwaInstall'
import { categoryLabel } from '@/i18n/categories'
import type { Dict } from '@/i18n'

interface NavGroup {
  label: (t: Dict) => string
  types: EntryType[]
  extra?: { to: string; label: (t: Dict) => string }[]
}

// Top-nav dropdown groups, 5etools-style (pages grouped by theme).
const GROUPS: NavGroup[] = [
  { label: (t) => t.nav.character, types: ['edge', 'hindrance', 'skill', 'ancestry'] },
  {
    label: (t) => t.nav.powers,
    types: ['power'],
    extra: [{ to: '/browse/power?cat=modifier', label: (t) => t.nav.modifiers }],
  },
  { label: (t) => t.nav.rules, types: ['rule'] },
  { label: (t) => t.nav.gear, types: ['gear', 'weapon', 'armor'] },
  { label: (t) => t.nav.bestiary, types: ['bestiary'] },
]

// Shared look for every top-level nav item (dropdown buttons and plain links).
const NAV_ITEM =
  'rounded px-2 py-1 text-sm transition-colors hover:bg-white/10 hover:text-brass'

/** Thin vertical rule between top-nav sections. */
function NavDivider() {
  return <span aria-hidden className="mx-1.5 h-4 w-px shrink-0 bg-white/15" />
}

/** Powers list their modifiers through a dedicated menu entry, not as a category. */
function menuCategories(type: EntryType, cats: string[]): string[] {
  return type === 'power' ? cats.filter((c) => c !== 'modifier') : cats
}

/** Are we currently browsing exactly this type + category? */
function useIsBrowsing(): (type: EntryType, cat?: string) => boolean {
  const { pathname, search } = useLocation()
  return (type, cat) =>
    pathname === `/browse/${type}` &&
    (new URLSearchParams(search).get('cat') ?? undefined) === cat
}

/**
 * One entry type inside a nav dropdown. The label itself opens the unfiltered
 * list; when the active books define categories for the type, a flyout lists
 * them and each one opens the list already filtered.
 */
function TypeItem({
  type,
  categories,
  onNavigate,
}: {
  type: EntryType
  categories: string[]
  onNavigate: () => void
}) {
  const { t } = useT()
  const lang = useContentLang()
  const isBrowsing = useIsBrowsing()
  const [open, setOpen] = useState(false)
  const hasSub = categories.length > 0
  const itemCls = (active: boolean) =>
    `block px-3 py-1.5 text-sm ${active ? 'text-brass' : 'text-parchment hover:bg-white/10'}`

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="flex items-center">
        <NavLink
          to={`/browse/${type}`}
          onClick={onNavigate}
          className={`flex-1 ${itemCls(isBrowsing(type))}`}
        >
          {t.types[type]}
        </NavLink>
        {hasSub && (
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={t.types[type]}
            aria-expanded={open}
            className="px-2 py-1.5 text-xs text-parchment/60 hover:text-brass"
          >
            ▸
          </button>
        )}
      </div>
      {hasSub && open && (
        <div className="absolute left-full top-0 z-50 max-h-[70vh] min-w-[12rem] overflow-auto rounded border border-white/10 bg-ink py-1 shadow-lg">
          {categories.map((cat) => (
            <NavLink
              key={cat}
              to={`/browse/${type}?cat=${encodeURIComponent(cat)}`}
              onClick={onNavigate}
              className={itemCls(isBrowsing(type, cat))}
            >
              {categoryLabel(cat, lang)}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

/** "All of <type>" plus one row per category, for a single-type dropdown. */
function SoleTypeItems({
  type,
  categories,
  onNavigate,
}: {
  type: EntryType
  categories: string[]
  onNavigate: () => void
}) {
  const { t } = useT()
  const lang = useContentLang()
  const isBrowsing = useIsBrowsing()
  const itemCls = (active: boolean) =>
    `block px-3 py-1.5 text-sm ${active ? 'text-brass' : 'text-parchment hover:bg-white/10'}`
  return (
    <>
      <NavLink
        to={`/browse/${type}`}
        onClick={onNavigate}
        className={itemCls(isBrowsing(type))}
      >
        {t.types[type]}
      </NavLink>
      {categories.map((cat, i) => (
        <NavLink
          key={cat}
          to={`/browse/${type}?cat=${encodeURIComponent(cat)}`}
          onClick={onNavigate}
          className={`${itemCls(isBrowsing(type, cat))} ${
            i === 0 ? 'border-t border-white/10' : ''
          }`}
        >
          {categoryLabel(cat, lang)}
        </NavLink>
      ))}
    </>
  )
}

function Dropdown({
  label,
  types,
  extra,
}: {
  label: string
  types: EntryType[]
  extra?: { to: string; label: string }[]
}) {
  const catsByType = useCategoriesByType()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Click-only (works the same on mouse and touch); close on outside click / Esc.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`${NAV_ITEM} ${open ? 'bg-white/10 text-brass' : ''}`}
      >
        {label}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 min-w-[11rem] rounded border border-white/10 bg-ink py-1 shadow-lg">
          {/* A group covering one type puts its categories straight in the
              panel — a flyout off a single row would be a pointless hop. */}
          {types.length === 1 ? (
            <SoleTypeItems
              type={types[0]}
              categories={menuCategories(types[0], catsByType.get(types[0]) ?? [])}
              onNavigate={() => setOpen(false)}
            />
          ) : (
            types.map((type) => (
              <TypeItem
                key={type}
                type={type}
                categories={menuCategories(type, catsByType.get(type) ?? [])}
                onNavigate={() => setOpen(false)}
              />
            ))
          )}
          {extra?.map((x) => (
            <NavLink
              key={x.to}
              to={x.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block border-t border-white/10 px-3 py-1.5 text-sm ${
                  isActive ? 'text-brass' : 'text-parchment hover:bg-white/10'
                }`
              }
            >
              {x.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export function NavBar() {
  const { t } = useT()
  const lang = useContentLang()
  const catsByType = useCategoriesByType()
  const { canInstall, install } = usePwaInstall()
  const [menu, setMenu] = useState(false)

  const topLink = ({ isActive }: { isActive: boolean }) =>
    `${NAV_ITEM} ${isActive ? 'text-brass' : ''}`

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-ink text-parchment">
      <div className="mx-auto flex max-w-[90rem] items-center gap-2 px-3 py-2 sm:px-4">
        <Link
          to="/"
          className="mr-1 flex items-center gap-1.5 font-display text-lg font-bold text-brass"
        >
          <SpannerIcon className="h-5 w-5" />
          {t.appTitle}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center md:flex">
          {GROUPS.map((g) => {
            const extra = g.extra?.map((x) => ({ to: x.to, label: x.label(t) }))
            const soleCats =
              g.types.length === 1
                ? menuCategories(g.types[0], catsByType.get(g.types[0]) ?? [])
                : []
            // Single type, no extra link and no categories -> a plain link.
            if (g.types.length === 1 && !extra?.length && soleCats.length === 0) {
              return (
                <NavLink key={g.label(t)} to={`/browse/${g.types[0]}`} className={topLink}>
                  {g.label(t)}
                </NavLink>
              )
            }
            return (
              <Dropdown
                key={g.label(t)}
                label={g.label(t)}
                types={g.types}
                extra={extra}
              />
            )
          })}
          <NavDivider />
          <NavLink to="/browse" end className={topLink}>
            {t.browse.all}
          </NavLink>
          <NavLink to="/favorites" className={topLink}>
            ★ {t.nav.favorites}
          </NavLink>
          <NavDivider />
          <NavLink to="/books" className={topLink}>
            {t.nav.books}
          </NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden w-40 sm:block lg:w-56">
            <Omnisearch />
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <LanguageMenu />
            <ThemeToggle />
          </div>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMenu((m) => !m)}
            aria-label="Menu"
            aria-expanded={menu}
            className="rounded border border-white/15 px-2 py-1 text-lg leading-none md:hidden"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menu && (
        <div className="border-t border-white/10 px-3 py-3 md:hidden">
          {canInstall && (
            <button
              onClick={() => {
                setMenu(false)
                void install()
              }}
              className="mb-3 w-full rounded bg-blood py-2 text-sm font-semibold text-white"
            >
              ⬇ {t.nav.install}
            </button>
          )}
          <div className="mb-3 sm:hidden">
            <Omnisearch />
          </div>
          {/* One row per type; its categories sit right below as chips that
              open the list already filtered. */}
          <nav className="space-y-1">
            {GROUPS.flatMap((g) => g.types).map((type) => {
              const cats = menuCategories(type, catsByType.get(type) ?? [])
              return (
                <div key={type}>
                  <NavLink
                    to={`/browse/${type}`}
                    onClick={() => setMenu(false)}
                    className={({ isActive }) =>
                      `block py-1 text-sm ${isActive ? 'text-brass' : 'hover:text-brass'}`
                    }
                  >
                    {t.types[type]}
                  </NavLink>
                  {cats.length > 0 && (
                    <div className="flex flex-wrap gap-1 pb-1 pl-3">
                      {cats.map((cat) => (
                        <NavLink
                          key={cat}
                          to={`/browse/${type}?cat=${encodeURIComponent(cat)}`}
                          onClick={() => setMenu(false)}
                          className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] hover:bg-white/20 hover:text-brass"
                        >
                          {categoryLabel(cat, lang)}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            <NavLink
              to="/browse/power?cat=modifier"
              onClick={() => setMenu(false)}
              className={({ isActive }) =>
                `py-1 text-sm ${isActive ? 'text-brass' : 'hover:text-brass'}`
              }
            >
              {t.nav.modifiers}
            </NavLink>
          </nav>
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-white/10 pt-3">
            <NavLink to="/browse" end onClick={() => setMenu(false)} className={topLink}>
              {t.browse.all}
            </NavLink>
            <NavLink to="/favorites" onClick={() => setMenu(false)} className={topLink}>
              ★ {t.nav.favorites}
            </NavLink>
            <NavLink to="/books" onClick={() => setMenu(false)} className={topLink}>
              {t.nav.books}
            </NavLink>
            <div className="ml-auto flex items-center gap-2">
              <LanguageMenu />
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
