import { useEffect, type ReactNode } from 'react'

/**
 * Centered dialog over a dimmed page. Closes on the ✕, on a backdrop click and
 * on Escape. The panel scrolls with the page, so tall forms stay reachable on
 * short screens.
 */
export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  /** Roomier panel, for forms with side-by-side columns. */
  wide?: boolean
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center overflow-auto p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className={`relative z-10 mt-10 w-full rounded border border-black/10 bg-parchment p-4 shadow-xl dark:border-white/10 dark:bg-[#15120f] ${
          wide ? 'max-w-3xl' : 'max-w-2xl'
        }`}
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-blood">{title}</h2>
          <button onClick={onClose} className="opacity-60 hover:opacity-100">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
