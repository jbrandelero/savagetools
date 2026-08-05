import type { EntryGroup, SourcedEntry } from '@/types/entry'

/**
 * Group entries by canonical `key`. Each group holds every variation of the
 * same game object found across the (active) books, preserving input order
 * so book priority can decide the default.
 */
export function groupByKey(entries: SourcedEntry[]): Map<string, EntryGroup> {
  const groups = new Map<string, EntryGroup>()
  for (const e of entries) {
    let g = groups.get(e.key)
    if (!g) {
      g = { key: e.key, type: e.type, variations: [] }
      groups.set(e.key, g)
    }
    g.variations.push(e)
  }
  return groups
}

/**
 * Pick one entry per group. `prefs` maps key -> chosen book id; when absent or
 * the chosen book is inactive, the first variation (highest priority) wins.
 */
export function resolveGroups(
  groups: Map<string, EntryGroup>,
  prefs: Record<string, string>,
): SourcedEntry[] {
  const out: SourcedEntry[] = []
  for (const g of groups.values()) {
    const preferredId = prefs[g.key]
    const chosen =
      (preferredId && g.variations.find((v) => v.source === preferredId)) ||
      g.variations[0]
    out.push(chosen)
  }
  return out
}
