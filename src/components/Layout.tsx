import { Outlet } from 'react-router-dom'
import { NavBar } from './NavBar'
import { Toaster } from './Toaster'

export function Layout() {
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-parchment text-ink dark:bg-[#15120f] dark:text-parchment">
      <NavBar />
      {/* `overflow-y-auto`: the scrollbar only appears when the page overflows. */}
      <main className="mx-auto w-full min-h-0 max-w-[90rem] flex-1 overflow-y-auto px-3 py-4 sm:px-4">
        <Outlet />
      </main>
      <footer className="shrink-0 border-t border-black/10 px-4 py-2 text-center text-xs opacity-60 dark:border-white/10">
        <a
          href="https://github.com/jbrandelero/swade"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-blood hover:underline"
        >
          github · jbrandelero/swade
        </a>
      </footer>
      <Toaster />
    </div>
  )
}
