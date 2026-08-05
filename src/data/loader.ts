import type { Book, BookMeta, Manifest } from '@/types/book'
import type { Entry } from '@/types/entry'
import { canonicalKey } from '@/lib/slug'
import { resolveText } from '@/lib/localized'

const BASE = import.meta.env.BASE_URL || '/'
const DATA = `${BASE}data`.replace(/\/{2,}/g, '/')

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url}: ${res.status} ${res.statusText}`)
  return (await res.json()) as T
}

export async function loadManifest(): Promise<BookMeta[]> {
  const m = await fetchJson<Manifest>(`${DATA}/manifest.json`)
  return m.books ?? []
}

/** Fetch and normalize one book: fill missing keys, default a fallback lang. */
export async function loadBook(meta: BookMeta): Promise<Book> {
  const raw = await fetchJson<Book>(`${DATA}/books/${meta.file}`)
  return normalizeBook(raw, meta)
}

/**
 * Normalize a raw book object (from a fetch OR a user upload) into a Book:
 * fills missing entry keys/ids and book-level defaults. Throws if it does not
 * look like a book.
 */
export function normalizeBook(raw: Partial<Book>, meta?: Partial<BookMeta>): Book {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.entries)) {
    throw new Error('Not a valid book: missing "entries" array.')
  }
  const id = raw.id ?? meta?.id
  if (!id) throw new Error('Book is missing an "id".')
  const langHint = raw.languages?.[0] ?? meta?.languages?.[0] ?? 'pt-BR'
  const entries: Entry[] = raw.entries.map((e) => normalizeEntry(e, langHint))
  const title = raw.title ?? meta?.title ?? id
  const abbrev = raw.abbrev ?? meta?.abbrev ?? id.slice(0, 4).toUpperCase()
  return {
    id,
    title,
    abbrev,
    languages: raw.languages ?? meta?.languages ?? [langHint],
    version: raw.version ?? meta?.version,
    publisher: raw.publisher ?? meta?.publisher,
    category: raw.category ?? meta?.category ?? 'homebrew',
    // Every book carries a base64 cover; synthesize a placeholder when absent.
    cover: raw.cover ?? meta?.cover ?? placeholderCover(id, title, abbrev),
    entries,
  }
}

/** Deterministic base64 SVG cover used when a book ships no image. */
function placeholderCover(id: string, title: string, abbrev: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="560" viewBox="0 0 400 560">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="hsl(${h} 45% 32%)"/><stop offset="1" stop-color="hsl(${(h + 40) % 360} 45% 18%)"/>
</linearGradient></defs>
<rect width="400" height="560" fill="url(#g)"/>
<rect x="16" y="16" width="368" height="528" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>
<text x="200" y="90" fill="rgba(255,255,255,0.85)" font-family="Georgia,serif" font-size="64" font-weight="bold" text-anchor="middle">${esc(abbrev)}</text>
<text x="200" y="300" fill="#fff" font-family="Georgia,serif" font-size="30" font-weight="bold" text-anchor="middle">${esc(title)}</text>
</svg>`
  return `data:image/svg+xml;base64,${utf8ToBase64(svg)}`
}

function utf8ToBase64(s: string): string {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

/** Build a manifest-style meta from a loaded book. */
export function bookToMeta(book: Book): BookMeta {
  return {
    id: book.id,
    title: book.title,
    abbrev: book.abbrev,
    file: `${book.id}.json`,
    languages: book.languages,
    version: book.version,
    publisher: book.publisher,
    category: book.category,
    cover: book.cover,
    core: book.id === 'swade-core' || undefined,
  }
}

/**
 * Ensure every entry has a stable `key` and `id`. Keys/ids are LANGUAGE-STABLE:
 * derived from the English name when present (falling back to the book's first
 * language), so the same object matches across localized editions.
 */
function normalizeEntry(e: Entry, langHint: string): Entry {
  const nameForKey = resolveText(e.name, 'en') || resolveText(e.name, langHint)
  const key = e.key ?? canonicalKey(e.type, nameForKey)
  const id = e.id ?? key.replace(':', '.')
  return { ...e, key, id }
}

export async function loadAllBooks(
  metas: BookMeta[],
): Promise<Record<string, Book>> {
  const loaded = await Promise.all(
    metas.map(async (m) => {
      try {
        return [m.id, await loadBook(m)] as const
      } catch (err) {
        console.error(`Failed to load book ${m.id}`, err)
        return null
      }
    }),
  )
  const out: Record<string, Book> = {}
  for (const item of loaded) if (item) out[item[0]] = item[1]
  return out
}
