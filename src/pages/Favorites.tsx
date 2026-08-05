import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLibrary, type PowerBuild } from '@/store/useLibrary'
import { useResolvedEntries, useContentLang, useT } from '@/hooks'
import { resolveText } from '@/lib/localized'
import { sourceBadgeStyle } from '@/lib/sources'
import { categoryLabel } from '@/i18n/categories'
import { FavoriteStar } from '@/components/FavoriteStar'
import { EntryView } from '@/components/EntryView'
import { PowerBuilderPanel } from '@/components/PowerBuilderPanel'
import { ENTRY_TYPES, type EntryType, type SourcedEntry } from '@/types/entry'

export function Favorites() {
  const { t } = useT()
  const lang = useContentLang()
  const favorites = useLibrary((s) => s.favorites)
  const builds = useLibrary((s) => s.builds)
  const customMods = useLibrary((s) => s.customMods)
  const removeBuild = useLibrary((s) => s.removeBuild)
  const resolved = useResolvedEntries()
  const [params, setParams] = useSearchParams()
  const selectedKey = params.get('sel') ?? undefined
  const buildId = params.get('b') ?? undefined

  const byKey = useMemo(
    () => new Map(resolved.map((e) => [e.key, e])),
    [resolved],
  )
  const buildsByPower = useMemo(() => {
    const m = new Map<string, PowerBuild[]>()
    for (const b of builds) {
      const arr = m.get(b.powerKey) ?? []
      arr.push(b)
      m.set(b.powerKey, arr)
    }
    return m
  }, [builds])

  const { grouped, unavailable, powerKeys } = useMemo(() => {
    const g = new Map<EntryType, SourcedEntry[]>()
    const missing: string[] = []
    for (const key of favorites) {
      const entry = byKey.get(key)
      if (!entry) {
        missing.push(key)
        continue
      }
      const arr = g.get(entry.type) ?? []
      arr.push(entry)
      g.set(entry.type, arr)
    }
    // Powers to show = favorite powers ∪ powers that have saved builds.
    const pk = new Set<string>()
    for (const e of g.get('power') ?? []) pk.add(e.key)
    for (const k of buildsByPower.keys()) pk.add(k)
    return { grouped: g, unavailable: missing, powerKeys: [...pk] }
  }, [favorites, byKey, buildsByPower])

  const selectEntry = (key: string) => {
    const next = new URLSearchParams()
    next.set('sel', key)
    setParams(next, { replace: true })
  }
  const selectBuild = (b: PowerBuild) => {
    const next = new URLSearchParams()
    next.set('sel', b.powerKey)
    next.set('b', b.id)
    setParams(next, { replace: true })
  }
  const clear = () => setParams({}, { replace: true })

  function modLabel(b: PowerBuild): string {
    const pool = customMods[b.powerKey] ?? []
    const names = [
      ...b.own,
      ...b.gen.map((k) => resolveText(byKey.get(k)?.name, lang) || k),
      ...(b.customIds ?? []).map(
        (id) => pool.find((c) => c.id === id)?.name ?? '?',
      ),
    ]
    return names.join(', ')
  }

  if (favorites.length === 0 && builds.length === 0) {
    return (
      <div className="space-y-3">
        <h1 className="font-display text-xl font-bold">{t.favorites.title}</h1>
        <p className="opacity-60">{t.favorites.empty}</p>
      </div>
    )
  }

  const selected = selectedKey ? byKey.get(selectedKey) : undefined
  const isPower = selected?.type === 'power' && selected.category !== 'modifier'

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center gap-2">
        <h1 className="font-display text-lg font-bold sm:text-xl">
          {t.favorites.title}
        </h1>
        <span className="text-sm opacity-60">{favorites.length}</span>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* List by type */}
        <div
          className={`min-h-0 overflow-auto rounded border border-black/10 dark:border-white/10 ${
            selectedKey ? 'hidden lg:block' : 'block'
          }`}
        >
          {ENTRY_TYPES.filter(
            (ty) => grouped.has(ty) || (ty === 'power' && powerKeys.length > 0),
          ).map((ty) => {
            const rows =
              ty === 'power'
                ? powerKeys
                    .map((k) => byKey.get(k))
                    .filter((e): e is SourcedEntry => !!e)
                : (grouped.get(ty) ?? [])
            if (rows.length === 0) return null
            return (
              <div key={ty}>
                <div className="sticky top-0 bg-black/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-wide opacity-70 backdrop-blur dark:bg-white/[0.06]">
                  {t.types[ty]} <span className="opacity-60">{rows.length}</span>
                </div>
                <ul className="divide-y divide-black/5 dark:divide-white/5">
                  {rows
                    .slice()
                    .sort((a, b) =>
                      resolveText(a.name, lang).localeCompare(
                        resolveText(b.name, lang),
                      ),
                    )
                    .map((e) => (
                      <li key={e.key}>
                        <button
                          onClick={() => selectEntry(e.key)}
                          className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-black/5 dark:hover:bg-white/5 ${
                            e.key === selectedKey && !buildId
                              ? 'border-l-2 border-blood bg-blood/10'
                              : ''
                          }`}
                        >
                          <span className="font-medium">
                            {resolveText(e.name, lang)}
                          </span>
                          {e.category && (
                            <span className="opacity-50">
                              · {categoryLabel(e.category, lang)}
                            </span>
                          )}
                          <span
                            style={sourceBadgeStyle(e.sourceAbbrev)}
                            className="ml-auto rounded px-1.5 py-0.5 text-[11px] font-medium"
                          >
                            {e.sourceAbbrev}
                          </span>
                        </button>
                        {/* Saved combos as sub-items of the power. */}
                        {(buildsByPower.get(e.key) ?? []).map((b) => (
                          <div
                            key={b.id}
                            className={`flex items-center gap-2 py-1 pl-8 pr-3 text-xs ${
                              b.id === buildId
                                ? 'border-l-2 border-brass bg-brass/10'
                                : ''
                            }`}
                          >
                            <button
                              onClick={() => selectBuild(b)}
                              className="flex-1 truncate text-left hover:underline"
                              title={modLabel(b)}
                            >
                              <span className="text-brass">⚒</span>{' '}
                              {modLabel(b) || '—'}
                            </button>
                            <button
                              onClick={() => removeBuild(b.id)}
                              className="opacity-40 hover:text-red-500 hover:opacity-100"
                              title="✕"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </li>
                    ))}
                </ul>
              </div>
            )
          })}

          {unavailable.length > 0 && (
            <div>
              <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wide opacity-50">
                {t.favorites.unavailable}
              </div>
              <ul>
                {unavailable.map((key) => (
                  <li
                    key={key}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm opacity-50"
                  >
                    <FavoriteStar entryKey={key} />
                    {key}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Detail (item scrolls; power builder pinned + always visible) */}
        <div
          className={`min-h-0 flex-col rounded border border-black/10 dark:border-white/10 ${
            selectedKey ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {selectedKey ? (
            <>
              <div className="min-h-0 flex-1 overflow-auto p-4">
                <EntryView entryKey={selectedKey} />
              </div>
              {isPower && (
                <div className="max-h-[55%] shrink-0 overflow-auto border-t border-black/10 p-3 dark:border-white/10">
                  <PowerBuilderPanel
                    key={buildId ?? selectedKey}
                    powerKey={selectedKey}
                    buildId={
                      buildId &&
                      builds.find((b) => b.id === buildId)?.powerKey === selectedKey
                        ? buildId
                        : undefined
                    }
                  />
                </div>
              )}
              <button
                onClick={clear}
                className="shrink-0 border-t border-black/10 bg-blood py-3 text-sm font-semibold text-white lg:hidden dark:border-white/10"
              >
                ← {t.back}
              </button>
            </>
          ) : (
            <p className="p-4 opacity-50">{t.search.typeToSearch}</p>
          )}
        </div>
      </div>
    </div>
  )
}
