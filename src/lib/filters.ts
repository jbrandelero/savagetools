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
  text: string
}

export const FACET_KEYS = ['source', 'rank', 'category'] as const
export type FacetKey = (typeof FACET_KEYS)[number]

export function emptyFilter(): FilterState {
  return { source: {}, rank: {}, category: {}, text: '' }
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

function facetValue(e: SourcedEntry, key: FacetKey): string | undefined {
  if (key === 'source') return e.sourceAbbrev
  if (key === 'rank') return e.rank
  return e.category
}

/**
 * A facet passes when:
 *  - no value in that facet is required, OR the entry matches a required value;
 *  - AND the entry does not match any excluded value.
 */
function facetPasses(e: SourcedEntry, facet: FacetState, key: FacetKey): boolean {
  const v = facetValue(e, key)
  const required = Object.entries(facet).filter(([, m]) => m === 1).map(([k]) => k)
  const excluded = Object.entries(facet).filter(([, m]) => m === -1).map(([k]) => k)
  if (v && excluded.includes(v)) return false
  if (required.length > 0 && !(v && required.includes(v))) return false
  return true
}

export function applyFilters(
  entries: SourcedEntry[],
  f: FilterState,
  lang: string,
): SourcedEntry[] {
  const text = f.text.trim().toLowerCase()
  return entries.filter((e) => {
    if (!facetPasses(e, f.source, 'source')) return false
    if (!facetPasses(e, f.rank, 'rank')) return false
    if (!facetPasses(e, f.category, 'category')) return false
    if (text) {
      const hay = resolveText(e.name, lang).toLowerCase()
      if (!hay.includes(text)) return false
    }
    return true
  })
}

/** Distinct facet values present in the given entry set, in first-seen order. */
export function facetOptions(
  entries: SourcedEntry[],
  key: FacetKey,
): string[] {
  const seen: string[] = []
  for (const e of entries) {
    const v = facetValue(e, key)
    if (v && !seen.includes(v)) seen.push(v)
  }
  return seen
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
    const v = facetValue(e, key)
    if (v) out.add(v)
  }
  return out
}
