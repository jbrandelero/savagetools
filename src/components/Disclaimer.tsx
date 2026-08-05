import { useLibrary, DISCLAIMER_VERSION } from '@/store/useLibrary'
import { useT } from '@/hooks'

/**
 * Legal disclaimer. Dismissible by default (reappears when DISCLAIMER_VERSION
 * bumps); pass `dismissible={false}` to keep it permanently visible.
 */
export function Disclaimer({ dismissible = true }: { dismissible?: boolean }) {
  const { t } = useT()
  const dismissed = useLibrary((s) => s.disclaimerDismissed)
  const dismiss = useLibrary((s) => s.dismissDisclaimer)

  if (dismissible && dismissed === DISCLAIMER_VERSION) return null

  return (
    <section
      className={`relative rounded border border-brass/40 bg-brass/5 px-3 py-2 text-sm ${
        dismissible ? 'pr-8' : ''
      }`}
    >
      {dismissible && (
        <button
          onClick={dismiss}
          aria-label="✕"
          title="✕"
          className="absolute right-1.5 top-1.5 rounded px-1 text-brass opacity-70 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
        >
          ✕
        </button>
      )}
      <h2 className="font-medium text-brass">{t.books.disclaimerTitle}</h2>
      <div className="mt-1 space-y-2 whitespace-pre-line opacity-80">
        {t.books.disclaimer}
      </div>
    </section>
  )
}
