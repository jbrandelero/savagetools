import Fuse from 'fuse.js'
import type { SourcedEntry } from '@/types/entry'
import { resolveText } from './localized'

export interface SearchDoc {
  entry: SourcedEntry
  name: string
  summary: string
  description: string
  tags: string
}

/** Flatten entries into language-resolved search docs. */
export function buildDocs(entries: SourcedEntry[], lang: string): SearchDoc[] {
  return entries.map((entry) => ({
    entry,
    name: resolveText(entry.name, lang),
    summary: resolveText(entry.summary, lang),
    description: resolveText(entry.description, lang),
    tags: (entry.tags ?? []).join(' '),
  }))
}

export function makeFuse(docs: SearchDoc[]): Fuse<SearchDoc> {
  return new Fuse(docs, {
    includeScore: true,
    threshold: 0.38,
    ignoreLocation: true,
    keys: [
      { name: 'name', weight: 0.6 },
      { name: 'tags', weight: 0.2 },
      { name: 'summary', weight: 0.15 },
      { name: 'description', weight: 0.05 },
    ],
  })
}

export function search(fuse: Fuse<SearchDoc>, q: string): SourcedEntry[] {
  const query = q.trim()
  if (!query) return []
  return fuse.search(query).map((r) => r.item.entry)
}
