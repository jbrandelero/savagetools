import { useMemo } from 'react'
import { getDict } from '@/i18n'
import { groupByKey, resolveGroups } from '@/lib/dedupe'
import { useLibrary, selectActiveEntries, visibleBookIds } from '@/store/useLibrary'
import { resolveText } from '@/lib/localized'
import type { EntryGroup, SourcedEntry } from '@/types/entry'

/** UI dictionary + current UI language. */
export function useT() {
  const uiLang = useLibrary((s) => s.uiLang)
  const t = useMemo(() => getDict(uiLang), [uiLang])
  return { t, uiLang }
}

/** Current content language. */
export function useContentLang(): string {
  return useLibrary((s) => s.contentLang)
}

/** Visible books (example hidden when real books exist), sorted by title. */
export function useVisibleManifest() {
  const manifest = useLibrary((s) => s.manifest)
  return useMemo(() => {
    const ids = visibleBookIds(manifest.map((m) => m.id))
    const coreRank = (m: { category?: string }) => (m.category === 'core' ? 0 : 1)
    return manifest
      .filter((m) => ids.includes(m.id))
      .slice()
      .sort(
        (a, b) => coreRank(a) - coreRank(b) || a.title.localeCompare(b.title),
      )
  }, [manifest])
}

/** Maps a source abbreviation to its full book title (falls back to the abbrev). */
export function useSourceName(): (abbrev: string) => string {
  const manifest = useLibrary((s) => s.manifest)
  return useMemo(() => {
    const m = new Map(manifest.map((b) => [b.abbrev, b.title]))
    return (abbrev: string) => m.get(abbrev) ?? abbrev
  }, [manifest])
}

/** All active entries, grouped by canonical key. */
export function useGroups(): Map<string, EntryGroup> {
  const manifest = useLibrary((s) => s.manifest)
  const books = useLibrary((s) => s.books)
  const activeBookIds = useLibrary((s) => s.activeBookIds)
  return useMemo(() => {
    const entries = selectActiveEntries({
      manifest,
      books,
      activeBookIds: visibleBookIds(activeBookIds),
    })
    return groupByKey(entries)
  }, [manifest, books, activeBookIds])
}

/** One entry per key, honoring saved variation preferences. */
export function useResolvedEntries(): SourcedEntry[] {
  const groups = useGroups()
  const prefs = useLibrary((s) => s.variationPrefs)
  return useMemo(() => resolveGroups(groups, prefs), [groups, prefs])
}

export interface NameIndex {
  regex: RegExp | null
  /** lowercased content-lang name -> candidate entries (across active books). */
  byName: Map<string, SourcedEntry[]>
  /** Book ids whose category is "core". */
  coreBookIds: Set<string>
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Index of entry names in the current content language, plus a single regex that
 * matches any of them on word boundaries. Used to auto-link names inside text
 * without any markup in the JSON. Names in `ignoredLinks` are excluded so they
 * never link (false-positive suppression).
 */
export function useNameIndex(): NameIndex {
  const entries = useResolvedEntries()
  const lang = useContentLang()
  const manifest = useLibrary((s) => s.manifest)
  const ignored = useLibrary((s) => s.ignoredLinks)

  return useMemo(() => {
    const coreBookIds = new Set(
      manifest.filter((m) => m.category === 'core').map((m) => m.id),
    )
    const ignoredSet = new Set(ignored)
    const byName = new Map<string, SourcedEntry[]>()
    for (const e of entries) {
      const name = resolveText(e.name, lang).trim()
      // Skip very short, numeric or explicitly-ignored names.
      if (name.length < 3 || /^\d+$/.test(name)) continue
      const low = name.toLowerCase()
      if (ignoredSet.has(low)) continue
      const arr = byName.get(low)
      if (arr) arr.push(e)
      else byName.set(low, [e])
    }
    if (byName.size === 0) return { regex: null, byName, coreBookIds }
    const alts = [...byName.keys()]
      .sort((a, b) => b.length - a.length)
      .map(escapeRegex)
      .join('|')
    let regex: RegExp | null = null
    try {
      regex = new RegExp(`(?<![\\p{L}\\p{N}])(${alts})(?![\\p{L}\\p{N}])`, 'giu')
    } catch {
      regex = null
    }
    return { regex, byName, coreBookIds }
  }, [entries, lang, manifest, ignored])
}
