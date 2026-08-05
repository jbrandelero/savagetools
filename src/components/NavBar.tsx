import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import type { EntryType } from '@/types/entry'
import { Omnisearch } from './Omnisearch'
import { ThemeToggle } from './ThemeToggle'
import { LanguageMenu } from './LanguageSwitcher'
import { SpannerIcon } from './SpannerIcon'
import { useT } from '@/hooks'
import { usePwaInstall } from '@/hooks/usePwaInstall'
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

function Dropdown({
  label,
  types,
  extra,
}: {
  label: string
  types: EntryType[]
  extra?: { to: string; label: string }[]
}) {
  const { t } = useT()
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
          {types.map((type) => (
            <NavLink
              key={type}
              to={`/browse/${type}`}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-1.5 text-sm ${
                  isActive ? 'text-brass' : 'text-parchment hover:bg-white/10'
                }`
              }
            >
              {t.types[type]}
            </NavLink>
          ))}
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
            // Single-type group with no extra link -> a plain link, not a dropdown.
            if (g.types.length === 1 && !extra?.length) {
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
          <nav className="grid grid-cols-2 gap-x-4 gap-y-1">
            {GROUPS.flatMap((g) => g.types).map((type) => (
              <NavLink
                key={type}
                to={`/browse/${type}`}
                onClick={() => setMenu(false)}
                className={({ isActive }) =>
                  `py-1 text-sm ${isActive ? 'text-brass' : 'hover:text-brass'}`
                }
              >
                {t.types[type]}
              </NavLink>
            ))}
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
