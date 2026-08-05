import { useLibrary } from '@/store/useLibrary'
import { useT } from '@/hooks'

export function ThemeToggle() {
  const { t } = useT()
  const theme = useLibrary((s) => s.theme)
  const toggle = useLibrary((s) => s.toggleTheme)
  return (
    <button
      onClick={toggle}
      title={t.theme.toggle}
      className="rounded border border-white/15 px-2 py-1 text-sm hover:bg-white/10"
    >
      {theme === 'dark' ? '☾' : '☀'}
    </button>
  )
}
