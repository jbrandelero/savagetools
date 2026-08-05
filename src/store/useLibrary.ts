import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Book, BookMeta } from '@/types/book'
import type { Entry, SourcedEntry } from '@/types/entry'
import { bookToMeta, loadAllBooks, loadManifest, normalizeBook } from '@/data/loader'
import { slugify } from '@/lib/slug'
import {
  allBookRecords,
  countBooks,
  deleteBookRecord,
  putBookRecord,
  type BookOrigin,
} from '@/data/db'
import type { UiLang } from '@/i18n'

type Status = 'idle' | 'loading' | 'ready' | 'error'

export type Theme = 'dark' | 'light'

/** The bundled starter demo book, hidden + deactivated once real books exist. */
export const EXAMPLE_ID = 'swade-example'

/** Books to show/use: drops the example book when any other book is present. */
export function visibleBookIds(ids: string[]): string[] {
  return ids.some((id) => id !== EXAMPLE_ID)
    ? ids.filter((id) => id !== EXAMPLE_ID)
    : ids
}

// Bump whenever the bundled books in public/data change, so already-seeded
// browsers refresh their seed-origin books (user-uploaded books are untouched).
const SEED_VERSION = 7

// Bump when the disclaimer text changes so a dismissed disclaimer reappears.
export const DISCLAIMER_VERSION = 1

/** A user-defined (homebrew) modifier stored on a power. */
export interface CustomMod {
  id: string
  name: string
  cost: number
  desc?: string
}

/** A saved power combination from the Power Builder. */
export interface PowerBuild {
  id: string
  powerKey: string
  /** Keys of selected general modifiers (category "modifier"). */
  gen: string[]
  /** Names of selected power-specific modifiers (parsed from the power text). */
  own: string[]
  /** Chosen PP value per modifier id (for multi-value costs like "+1/+2/+4"). */
  choices?: Record<string, number>
  /** Ids of selected custom modifiers (defined per-power in `customMods`). */
  customIds?: string[]
}

interface PersistedState {
  activeBookIds: string[]
  variationPrefs: Record<string, string> // key -> book id
  favorites: string[] // entry keys
  builds: PowerBuild[] // saved power-builder combinations
  customMods: Record<string, CustomMod[]> // per-power custom modifiers
  ignoredLinks: string[] // lowercased names to NOT auto-link (false positives)
  seedVersion: number // version of the bundled data last seeded into the browser
  disclaimerDismissed: number // DISCLAIMER_VERSION the user dismissed (0 = never)
  uiLang: UiLang
  contentLang: string
  theme: Theme
}

interface LibraryState extends PersistedState {
  status: Status
  error?: string
  /** Derived from the books held in the browser (IndexedDB), in insertion order. */
  manifest: BookMeta[]
  books: Record<string, Book>
  origins: Record<string, BookOrigin>

  init: () => Promise<void>
  /** Add/replace a book from a parsed JSON object (user upload). Returns its id. */
  addBook: (raw: unknown) => Promise<string>
  /** Remove a book from the browser library entirely. */
  removeBook: (id: string) => Promise<void>
  toggleBook: (id: string) => void
  setActive: (id: string, active: boolean) => void
  setVariationPref: (key: string, bookId: string) => void
  toggleFavorite: (key: string) => void
  /** Create an empty user (homebrew) book; returns its id. */
  createBook: (meta: {
    title: string
    abbrev: string
    languages?: string[]
    category?: string
    cover?: string
  }) => string
  updateBookMeta: (
    id: string,
    patch: Partial<Pick<Book, 'title' | 'abbrev' | 'languages' | 'category' | 'cover'>>,
  ) => void
  addEntry: (bookId: string, entry: Entry) => void
  updateEntry: (bookId: string, entry: Entry) => void
  deleteEntry: (bookId: string, entryId: string) => void
  /** Full book JSON string for download. */
  exportBook: (id: string) => string
  addBuild: (build: PowerBuild) => void
  updateBuild: (id: string, patch: Partial<Omit<PowerBuild, 'id'>>) => void
  removeBuild: (id: string) => void
  addCustomMod: (powerKey: string, mod: CustomMod) => void
  removeCustomMod: (powerKey: string, id: string) => void
  ignoreLink: (name: string) => void
  dismissDisclaimer: () => void
  setUiLang: (lang: UiLang) => void
  setContentLang: (lang: string) => void
  toggleTheme: () => void
}

export const useLibrary = create<LibraryState>()(
  persist(
    (set, get) => ({
      status: 'idle',
      manifest: [],
      books: {},
      origins: {},
      activeBookIds: [],
      variationPrefs: {},
      favorites: [],
      builds: [],
      customMods: {},
      ignoredLinks: [],
      seedVersion: 0,
      disclaimerDismissed: 0,
      uiLang: 'pt-BR',
      contentLang: 'pt-BR',
      theme: 'dark',

      init: async () => {
        if (get().status === 'loading') return
        set({ status: 'loading', error: undefined })
        try {
          // Seed the browser store from the bundled books on first run, and
          // refresh the seed-origin books whenever SEED_VERSION changes (a data
          // update). User-uploaded books are never overwritten.
          const empty = (await countBooks()) === 0
          if (empty || get().seedVersion !== SEED_VERSION) {
            // Never clobber books the user has adopted/edited (origin 'user').
            const existing = new Map(
              (await allBookRecords()).map((r) => [r.id, r.origin]),
            )
            const metas = await loadManifest()
            const seeded = await loadAllBooks(metas)
            for (const book of Object.values(seeded)) {
              if (existing.get(book.id) === 'user') continue
              await putBookRecord({ id: book.id, origin: 'seed', book })
            }
            // Books dropped from the bundle go away in already-seeded browsers
            // too. Only 'seed' records are touched — anything the user uploaded
            // or edited (origin 'user') is kept.
            const bundled = new Set(metas.map((m) => m.id))
            for (const [id, origin] of existing) {
              if (origin === 'seed' && !bundled.has(id)) await deleteBookRecord(id)
            }
            set({ seedVersion: SEED_VERSION })
          }

          const records = await allBookRecords()
          const books: Record<string, Book> = {}
          const origins: Record<string, BookOrigin> = {}
          const manifest: BookMeta[] = []
          for (const rec of records) {
            books[rec.id] = rec.book
            origins[rec.id] = rec.origin
            manifest.push(bookToMeta(rec.book))
          }

          const known = manifest.map((m) => m.id)
          const saved = get().activeBookIds
          const active =
            saved.length === 0 ? known : saved.filter((id) => known.includes(id))

          set({ manifest, books, origins, activeBookIds: active, status: 'ready' })
        } catch (err) {
          set({ status: 'error', error: String(err) })
        }
      },

      addBook: async (raw) => {
        const book = normalizeBook(raw as Partial<Book>)
        await putBookRecord({ id: book.id, origin: 'user', book })
        const books = { ...get().books, [book.id]: book }
        const origins = { ...get().origins, [book.id]: 'user' as BookOrigin }
        // Keep manifest ordered; replace existing meta or append.
        const manifest = get().manifest.some((m) => m.id === book.id)
          ? get().manifest.map((m) => (m.id === book.id ? bookToMeta(book) : m))
          : [...get().manifest, bookToMeta(book)]
        const activeBookIds = get().activeBookIds.includes(book.id)
          ? get().activeBookIds
          : [...get().activeBookIds, book.id]
        set({ books, origins, manifest, activeBookIds })
        return book.id
      },

      removeBook: async (id) => {
        await deleteBookRecord(id)
        const books = { ...get().books }
        delete books[id]
        const origins = { ...get().origins }
        delete origins[id]
        set({
          books,
          origins,
          manifest: get().manifest.filter((m) => m.id !== id),
          activeBookIds: get().activeBookIds.filter((x) => x !== id),
        })
      },

      toggleBook: (id) => {
        const active = get().activeBookIds
        set({
          activeBookIds: active.includes(id)
            ? active.filter((x) => x !== id)
            : [...active, id],
        })
      },

      setActive: (id, active) => {
        const cur = get().activeBookIds
        if (active && !cur.includes(id)) set({ activeBookIds: [...cur, id] })
        if (!active && cur.includes(id))
          set({ activeBookIds: cur.filter((x) => x !== id) })
      },

      setVariationPref: (key, bookId) =>
        set({ variationPrefs: { ...get().variationPrefs, [key]: bookId } }),

      toggleFavorite: (key) => {
        const fav = get().favorites
        set({
          favorites: fav.includes(key)
            ? fav.filter((k) => k !== key)
            : [...fav, key],
        })
      },

      createBook: (meta) => {
        const base = slugify(meta.title) || 'book'
        const taken = new Set(get().manifest.map((m) => m.id))
        let id = `user-${base}`
        let n = 2
        while (taken.has(id)) id = `user-${base}-${n++}`
        const book = normalizeBook({
          id,
          title: meta.title,
          abbrev: meta.abbrev || meta.title.slice(0, 4).toUpperCase(),
          languages: meta.languages ?? ['pt-BR'],
          category: meta.category ?? 'homebrew',
          cover: meta.cover,
          entries: [],
        })
        void writeUserBook(book, get, set, true)
        return id
      },

      updateBookMeta: (id, patch) => {
        const book = get().books[id]
        if (!book) return
        void writeUserBook(normalizeBook({ ...book, ...patch }), get, set)
      },

      addEntry: (bookId, entry) => {
        const book = get().books[bookId]
        if (!book) return
        void writeUserBook(
          normalizeBook({ ...book, entries: [...book.entries, entry] }),
          get,
          set,
          true,
        )
      },

      updateEntry: (bookId, entry) => {
        const book = get().books[bookId]
        if (!book) return
        const entries = book.entries.map((e) => (e.id === entry.id ? entry : e))
        void writeUserBook(normalizeBook({ ...book, entries }), get, set)
      },

      deleteEntry: (bookId, entryId) => {
        const book = get().books[bookId]
        if (!book) return
        const entries = book.entries.filter((e) => e.id !== entryId)
        void writeUserBook(normalizeBook({ ...book, entries }), get, set)
      },

      exportBook: (id) => JSON.stringify(get().books[id] ?? {}, null, 2),

      addBuild: (build) => set({ builds: [...get().builds, build] }),
      updateBuild: (id, patch) =>
        set({
          builds: get().builds.map((b) =>
            b.id === id ? { ...b, ...patch } : b,
          ),
        }),
      removeBuild: (id) =>
        set({ builds: get().builds.filter((b) => b.id !== id) }),

      addCustomMod: (powerKey, mod) =>
        set({
          customMods: {
            ...get().customMods,
            [powerKey]: [...(get().customMods[powerKey] ?? []), mod],
          },
        }),
      removeCustomMod: (powerKey, id) =>
        set({
          customMods: {
            ...get().customMods,
            [powerKey]: (get().customMods[powerKey] ?? []).filter(
              (m) => m.id !== id,
            ),
          },
        }),

      ignoreLink: (name) => {
        const low = name.toLowerCase()
        const cur = get().ignoredLinks
        if (!cur.includes(low)) set({ ignoredLinks: [...cur, low] })
      },

      dismissDisclaimer: () => set({ disclaimerDismissed: DISCLAIMER_VERSION }),

      setUiLang: (uiLang) => set({ uiLang }),
      setContentLang: (contentLang) => set({ contentLang }),
      toggleTheme: () =>
        set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
    }),
    {
      name: 'swade-library',
      partialize: (s): PersistedState => ({
        activeBookIds: s.activeBookIds,
        variationPrefs: s.variationPrefs,
        favorites: s.favorites,
        builds: s.builds,
        customMods: s.customMods,
        ignoredLinks: s.ignoredLinks,
        seedVersion: s.seedVersion,
        disclaimerDismissed: s.disclaimerDismissed,
        uiLang: s.uiLang,
        contentLang: s.contentLang,
        theme: s.theme,
      }),
    },
  ),
)

/**
 * Persist a book as user-owned (adopts seed books on first edit) + sync state.
 * `activate` turns the book on when it is new content the user just added;
 * plain edits leave an intentionally disabled book disabled.
 */
async function writeUserBook(
  book: Book,
  get: () => LibraryState,
  set: (partial: Partial<LibraryState>) => void,
  activate = false,
): Promise<void> {
  await putBookRecord({ id: book.id, origin: 'user', book })
  const s = get()
  const manifest = s.manifest.some((m) => m.id === book.id)
    ? s.manifest.map((m) => (m.id === book.id ? bookToMeta(book) : m))
    : [...s.manifest, bookToMeta(book)]
  set({
    books: { ...s.books, [book.id]: book },
    origins: { ...s.origins, [book.id]: 'user' },
    manifest,
    activeBookIds:
      activate && !s.activeBookIds.includes(book.id)
        ? [...s.activeBookIds, book.id]
        : s.activeBookIds,
  })
}

interface EntrySource {
  manifest: BookMeta[]
  books: Record<string, Book>
  activeBookIds: string[]
}

/** All entries from active books, tagged with their source. Book order = manifest order. */
export function selectActiveEntries(s: EntrySource): SourcedEntry[] {
  const out: SourcedEntry[] = []
  for (const meta of s.manifest) {
    if (!s.activeBookIds.includes(meta.id)) continue
    const book = s.books[meta.id]
    if (!book) continue
    for (const e of book.entries) {
      out.push({ ...e, source: book.id, sourceAbbrev: book.abbrev })
    }
  }
  return out
}
