import { UI_LANGS } from '@/i18n'
import { useLibrary } from '@/store/useLibrary'
import { useT } from '@/hooks'

const LANG_LABEL: Record<string, string> = {
  en: 'EN',
  'pt-BR': 'PT',
  pt: 'PT',
}

function label(code: string): string {
  return LANG_LABEL[code] ?? code.toUpperCase()
}

function Row({
  title,
  options,
  current,
  onPick,
  accent,
}: {
  title: string
  options: string[]
  current: string
  onPick: (code: string) => void
  accent: string
}) {
  if (options.length === 0) return null
  return (
    <div className="px-2 py-1.5">
      <div className="mb-1 text-[10px] uppercase tracking-wide opacity-50">
        {title}
      </div>
      <div className="flex gap-1">
        {options.map((code) => (
          <button
            key={code}
            onClick={() => onPick(code)}
            className={`rounded px-2 py-0.5 text-xs ${
              current === code
                ? `${accent} text-white`
                : 'bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20'
            }`}
          >
            {label(code)}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Single dropdown combining interface language + content language. */
export function LanguageMenu() {
  const { t, uiLang } = useT()
  const setUiLang = useLibrary((s) => s.setUiLang)
  const contentLang = useLibrary((s) => s.contentLang)
  const setContentLang = useLibrary((s) => s.setContentLang)
  const manifest = useLibrary((s) => s.manifest)
  const activeBookIds = useLibrary((s) => s.activeBookIds)

  const contentLangs = Array.from(
    new Set(
      manifest
        .filter((m) => activeBookIds.includes(m.id))
        .flatMap((m) => m.languages),
    ),
  )

  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-1 rounded border border-white/15 px-2 py-1 text-sm hover:bg-white/10">
        <span aria-hidden>🌐</span>
        <span className="text-xs">
          {label(uiLang)}
          {contentLangs.length > 0 ? ` · ${label(contentLang)}` : ''}
        </span>
        <span className="text-[10px] opacity-60">▾</span>
      </summary>
      <div className="absolute right-0 top-full z-40 mt-1 w-40 rounded border border-white/10 bg-ink text-parchment shadow-lg">
        <Row
          title={t.langs.ui}
          options={UI_LANGS}
          current={uiLang}
          onPick={(c) => setUiLang(c as (typeof UI_LANGS)[number])}
          accent="bg-blood"
        />
        <div className="border-t border-white/10" />
        <Row
          title={t.langs.content}
          options={contentLangs}
          current={contentLang}
          onPick={setContentLang}
          accent="bg-brass"
        />
      </div>
    </details>
  )
}
