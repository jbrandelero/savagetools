import { useLibrary } from '@/store/useLibrary'
import { useT } from '@/hooks'

/** Toggle button that stars/unstars an entry by its canonical key. */
export function FavoriteStar({
  entryKey,
  className = '',
}: {
  entryKey: string
  className?: string
}) {
  const { t } = useT()
  const isFav = useLibrary((s) => s.favorites.includes(entryKey))
  const toggle = useLibrary((s) => s.toggleFavorite)
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        toggle(entryKey)
      }}
      aria-pressed={isFav}
      title={isFav ? t.favorites.marked : t.favorites.mark}
      className={`select-none leading-none transition-colors ${
        isFav ? 'text-brass' : 'text-black/25 hover:text-brass dark:text-white/25'
      } ${className}`}
    >
      {isFav ? '★' : '☆'}
    </button>
  )
}
