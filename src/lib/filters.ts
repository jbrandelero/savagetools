import type { SourcedEntry } from '@/types/entry'
import { resolveText } from './localized'

// Tri-state faceted filtering, 5etools-style.
//   0 = ignore, 1 = require (blue), -1 = exclude (red)
export type FilterMode = 0 | 1 | -1

export type FacetState = Record<string, FilterMode>

export interface FilterState {
  source: FacetState
  rank: FacetState
  category: FacetState
  tags: FacetState
  text: string
}

export const FACET_KEYS = ['source', 'rank', 'category', 'tags'] as const
export type FacetKey = (typeof FACET_KEYS)[number]

export function emptyFilter(): FilterState {
  return { source: {}, rank: {}, category: {}, tags: {}, text: '' }
}

/** ignore -> require -> exclude -> ignore */
export function cycleMode(mode: FilterMode | undefined): FilterMode {
  if (mode === 1) return -1
  if (mode === -1) return 0
  return 1
}

export function isFilterActive(f: FilterState): boolean {
  if (f.text.trim()) return true
  return FACET_KEYS.some((k) => Object.values(f[k]).some((m) => m !== 0))
}

/**
 * The values an entry carries for a facet. Most facets hold at most one value;
 * `tags` holds several, so every facet is expressed as a list.
 */
function facetValues(e: SourcedEntry, key: FacetKey): string[] {
  if (key === 'source') return [e.sourceAbbrev]
  if (key === 'rank') return e.rank ? [e.rank] : []
  if (key === 'tags') return e.tags ?? []
  return e.category ? [e.category] : []
}

/**
 * A facet passes when:
 *  - no value in that facet is required, OR the entry matches a required value;
 *  - AND the entry does not match any excluded value.
 */
function facetPasses(e: SourcedEntry, facet: FacetState, key: FacetKey): boolean {
  const values = facetValues(e, key)
  const required = Object.entries(facet).filter(([, m]) => m === 1).map(([k]) => k)
  const excluded = Object.entries(facet).filter(([, m]) => m === -1).map(([k]) => k)
  if (values.some((v) => excluded.includes(v))) return false
  if (required.length > 0 && !values.some((v) => required.includes(v))) return false
  return true
}

export function applyFilters(
  entries: SourcedEntry[],
  f: FilterState,
  lang: string,
): SourcedEntry[] {
  const text = f.text.trim().toLowerCase()
  return entries.filter((e) => {
    if (!FACET_KEYS.every((k) => facetPasses(e, f[k], k))) return false
    if (text) {
      const hay = resolveText(e.name, lang).toLowerCase()
      if (!hay.includes(text)) return false
    }
    return true
  })
}

/**
 * Distinct facet values present in the given entry set. Sources/ranks/categories
 * keep first-seen order; tags are alphabetical, since a book can define dozens
 * of them and load order carries no meaning for a reader scanning the pills.
 */
export function facetOptions(
  entries: SourcedEntry[],
  key: FacetKey,
): string[] {
  const seen: string[] = []
  for (const e of entries) {
    for (const v of facetValues(e, key)) if (!seen.includes(v)) seen.push(v)
  }
  return key === 'tags' ? seen.sort((a, b) => a.localeCompare(b)) : seen
}

/**
 * Values of `key` still reachable given the other facets' current selections
 * (cross-filtering) — a value not in this set has zero matching entries once
 * the other filters apply, so its pill can be disabled.
 */
export function availableFacetValues(
  entries: SourcedEntry[],
  f: FilterState,
  key: FacetKey,
): Set<string> {
  const others = FACET_KEYS.filter((k) => k !== key)
  const out = new Set<string>()
  for (const e of entries) {
    if (!others.every((k) => facetPasses(e, f[k], k))) continue
    for (const v of facetValues(e, key)) out.add(v)
  }
  return out
}
