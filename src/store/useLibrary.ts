import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Book, BookMeta } from '@/types/book'
import type { Entry, SourcedEntry } from '@/types/entry'
import { bookToMeta, loadAllBooks, loadManifest, normalizeBook } from '@/data/loader'
import { slugify } from '@/lib/slug'
import { newId } from '@/lib/id'
import { parseVideoId } from '@/lib/youtube'
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
const SEED_VERSION = 8

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

/** One reference inside an encounter: a compendium entry plus GM annotations. */
export interface EncounterItem {
  id: string
  /** Canonical entry key, e.g. "bestiary:goblin". */
  key: string
  /** How many of this thing are in play (creatures, loot, ...). */
  qty?: number
  /** GM highlight: the ones to keep an eye on during the scene. */
  starred?: boolean
  /** Free-form GM note ("ambushes from the roof", rolled HP, ...). */
  note?: string
  /** Wounds taken, one entry per copy in play (index = copy number). */
  wounds?: number[]
  /** How many wounds a copy can take before going down (per copy). */
  maxWounds?: number[]
  /** Fatigue levels taken, one entry per copy in play. */
  fatigue?: number[]
  /** Shaken state, one entry per copy in play. */
  shaken?: boolean[]
  /** Incapacitated mark, one entry per copy in play. */
  incapacitated?: boolean[]
  /** Other states in play, per copy: ["distracted", "prone", ...]. */
  states?: string[][]
}

/** A GM quick-reference list: a named bag of entry references. */
/**
 * One beat of an encounter: a named page of prose, the creatures and gear on
 * stage for it, and the playlist that should be running while it plays out.
 */
export interface Scene {
  id: string
  name: string
  text?: string
  items: EncounterItem[]
  /** Id of the playlist to play when this scene is opened. */
  playlistId?: string
}

export interface Encounter {
  id: string
  name: string
  scenes: Scene[]
  notes?: string
}

/** One YouTube video in a playlist. */
export interface Track {
  id: string
  title: string
  /** The YouTube video id. */
  ytId: string
}

/**
 * A user-built playlist of YouTube videos for the table's background music.
 * Playlists are library-wide: every encounter sees the same ones.
 */
export interface Playlist {
  id: string
  name: string
  tracks: Track[]
}

interface PersistedState {
  activeBookIds: string[]
  variationPrefs: Record<string, string> // key -> book id
  favorites: string[] // entry keys
  builds: PowerBuild[] // saved power-builder combinations
  encounters: Encounter[] // GM quick-reference lists
  playlists: Playlist[] // saved YouTube playlists for the music player
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
  /** Create an empty encounter; returns its id. */
  createEncounter: (name: string, firstSceneName: string) => string
  updateEncounter: (
    id: string,
    patch: Partial<Pick<Encounter, 'name' | 'notes'>>,
  ) => void
  /** Add a scene to an encounter; returns its id. */
  addScene: (encounterId: string, name: string) => string
  updateScene: (
    encounterId: string,
    sceneId: string,
    patch: Partial<Pick<Scene, 'name' | 'text'>>,
  ) => void
  removeScene: (encounterId: string, sceneId: string) => void
  removeEncounter: (id: string) => void
  /** Pick the playlist that plays while a scene is open. */
  setScenePlaylist: (
    encounterId: string,
    sceneId: string,
    playlistId?: string,
  ) => void
  /** Append an entry reference to a scene; returns the new item id. */
  addSceneItem: (
    encounterId: string,
    sceneId: string,
    key: string,
    starred?: boolean,
  ) => string
  updateSceneItem: (
    encounterId: string,
    sceneId: string,
    itemId: string,
    patch: Partial<Omit<EncounterItem, 'id'>>,
  ) => void
  removeSceneItem: (encounterId: string, sceneId: string, itemId: string) => void
  /** Set the wound count of one copy of an item (combat tracker). */
  setItemWounds: (
    encounterId: string,
    sceneId: string,
    itemId: string,
    copy: number,
    wounds: number,
  ) => void
  /** Resize the wound track of one copy (how many wounds it can take). */
  setItemMaxWounds: (
    encounterId: string,
    sceneId: string,
    itemId: string,
    copy: number,
    max: number,
  ) => void
  /** Set the Fatigue level of one copy of an item. */
  setItemFatigue: (
    encounterId: string,
    sceneId: string,
    itemId: string,
    copy: number,
    fatigue: number,
  ) => void
  /** Toggle the Shaken state of one copy of an item. */
  setItemShaken: (
    encounterId: string,
    sceneId: string,
    itemId: string,
    copy: number,
    shaken: boolean,
  ) => void
  /** Mark one copy as Incapacitated (down regardless of its wound track). */
  setItemIncapacitated: (
    encounterId: string,
    sceneId: string,
    itemId: string,
    copy: number,
    incapacitated: boolean,
  ) => void
  /** Add or drop one state on a copy of an item. */
  toggleItemState: (
    encounterId: string,
    sceneId: string,
    itemId: string,
    copy: number,
    state: string,
  ) => void
  /** Clear every wound and Shaken mark in the scene (end of fight). */
  resetWounds: (encounterId: string, sceneId: string) => void
  /** Move an item to a new position in the scene (drag reordering). */
  reorderSceneItem: (
    encounterId: string,
    sceneId: string,
    itemId: string,
    toIndex: number,
  ) => void
  /** Create an empty playlist; returns its id. */
  createPlaylist: (name: string) => string
  removePlaylist: (id: string) => void
  /** Append a video from any pasted URL or id; null when it names no video. */
  addTrack: (playlistId: string, url: string) => string | null
  /** Fill in a track's title once it comes back from YouTube. */
  setTrackTitle: (playlistId: string, trackId: string, title: string) => void
  removeTrack: (playlistId: string, trackId: string) => void
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
      encounters: [],
      playlists: [],
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

      createEncounter: (name, firstSceneName) => {
        const id = newId()
        set({
          encounters: [
            ...get().encounters,
            {
              id,
              name: name.trim() || 'Encounter',
              // An encounter always opens on a scene, never on nothing.
              scenes: [{ id: newId(), name: firstSceneName, items: [] }],
            },
          ],
        })
        return id
      },

      updateEncounter: (id, patch) =>
        set({
          encounters: get().encounters.map((e) =>
            e.id === id ? { ...e, ...patch } : e,
          ),
        }),

      addScene: (encounterId, name) => {
        const id = newId()
        set({
          encounters: get().encounters.map((e) =>
            e.id === encounterId
              ? {
                  ...e,
                  scenes: [
                    ...e.scenes,
                    { id, name: name.trim() || 'Scene', items: [] },
                  ],
                }
              : e,
          ),
        })
        return id
      },

      updateScene: (encounterId, sceneId, patch) =>
        set({
          encounters: get().encounters.map((e) =>
            e.id === encounterId
              ? {
                  ...e,
                  scenes: e.scenes.map((sc) =>
                    sc.id === sceneId ? { ...sc, ...patch } : sc,
                  ),
                }
              : e,
          ),
        }),

      removeScene: (encounterId, sceneId) =>
        set({
          encounters: get().encounters.map((e) =>
            e.id === encounterId
              ? { ...e, scenes: e.scenes.filter((sc) => sc.id !== sceneId) }
              : e,
          ),
        }),

      removeEncounter: (id) =>
        set({ encounters: get().encounters.filter((e) => e.id !== id) }),

      setScenePlaylist: (encounterId, sceneId, playlistId) =>
        set({
          encounters: mapScene(get().encounters, encounterId, sceneId, (sc) => ({
            ...sc,
            playlistId,
          })),
        }),

      addSceneItem: (encounterId, sceneId, key, starred) => {
        const item: EncounterItem = { id: newId(), key, starred }
        const encounters = mapScene(get().encounters, encounterId, sceneId, (sc) => ({
          ...sc,
          items: [...sc.items, item],
        }))
        set({ encounters })
        return item.id
      },

      updateSceneItem: (encounterId, sceneId, itemId, patch) =>
        set({
          encounters: mapItem(get().encounters, encounterId, sceneId, itemId, (it) => ({
            ...it,
            ...patch,
          })),
        }),

      removeSceneItem: (encounterId, sceneId, itemId) =>
        set({
          encounters: mapScene(get().encounters, encounterId, sceneId, (sc) => ({
            ...sc,
            items: sc.items.filter((it) => it.id !== itemId),
          })),
        }),

      setItemWounds: (encounterId, sceneId, itemId, copy, wounds) =>
        set({
          encounters: mapItem(get().encounters, encounterId, sceneId, itemId, (it) => {
            const next = (it.wounds ?? []).slice()
            while (next.length <= copy) next.push(0)
            next[copy] = wounds
            return { ...it, wounds: next }
          }),
        }),

      setItemMaxWounds: (encounterId, sceneId, itemId, copy, max) =>
        set({
          encounters: mapItem(get().encounters, encounterId, sceneId, itemId, (it) => {
            const next = (it.maxWounds ?? []).slice()
            while (next.length <= copy) next.push(0)
            next[copy] = Math.max(1, max)
            // A shorter track cannot hold more wounds than it has slots.
            const wounds = (it.wounds ?? []).slice()
            if ((wounds[copy] ?? 0) > next[copy]) wounds[copy] = next[copy]
            return { ...it, maxWounds: next, wounds }
          }),
        }),

      setItemFatigue: (encounterId, sceneId, itemId, copy, fatigue) =>
        set({
          encounters: mapItem(get().encounters, encounterId, sceneId, itemId, (it) => {
            const next = (it.fatigue ?? []).slice()
            while (next.length <= copy) next.push(0)
            next[copy] = fatigue
            return { ...it, fatigue: next }
          }),
        }),

      setItemShaken: (encounterId, sceneId, itemId, copy, shaken) =>
        set({
          encounters: mapItem(get().encounters, encounterId, sceneId, itemId, (it) => {
            const next = (it.shaken ?? []).slice()
            while (next.length <= copy) next.push(false)
            next[copy] = shaken
            return { ...it, shaken: next }
          }),
        }),

      setItemIncapacitated: (encounterId, sceneId, itemId, copy, incapacitated) =>
        set({
          encounters: mapItem(get().encounters, encounterId, sceneId, itemId, (it) => {
            const next = (it.incapacitated ?? []).slice()
            while (next.length <= copy) next.push(false)
            next[copy] = incapacitated
            return { ...it, incapacitated: next }
          }),
        }),

      toggleItemState: (encounterId, sceneId, itemId, copy, state) =>
        set({
          encounters: mapItem(get().encounters, encounterId, sceneId, itemId, (it) => {
            const next = (it.states ?? []).map((list) => list.slice())
            while (next.length <= copy) next.push([])
            next[copy] = next[copy].includes(state)
              ? next[copy].filter((x) => x !== state)
              : [...next[copy], state]
            return { ...it, states: next }
          }),
        }),

      resetWounds: (encounterId, sceneId) =>
        set({
          encounters: mapScene(get().encounters, encounterId, sceneId, (sc) => ({
            ...sc,
            items: sc.items.map((it) => ({
              ...it,
              wounds: [],
              fatigue: [],
              shaken: [],
              incapacitated: [],
              states: [],
            })),
          })),
        }),

      reorderSceneItem: (encounterId, sceneId, itemId, toIndex) =>
        set({
          encounters: mapScene(get().encounters, encounterId, sceneId, (sc) => {
            const from = sc.items.findIndex((it) => it.id === itemId)
            const to = Math.min(Math.max(toIndex, 0), sc.items.length - 1)
            if (from < 0 || from === to) return sc
            const items = sc.items.slice()
            const [moved] = items.splice(from, 1)
            items.splice(to, 0, moved)
            return { ...sc, items }
          }),
        }),

      createPlaylist: (name) => {
        const id = newId()
        set({
          playlists: [
            ...get().playlists,
            { id, name: name.trim() || 'Playlist', tracks: [] },
          ],
        })
        return id
      },

      addTrack: (playlistId, url) => {
        const ytId = parseVideoId(url)
        if (!ytId) return null
        // Titles are resolved from YouTube; until then the id stands in.
        const track: Track = { id: newId(), title: ytId, ytId }
        set({
          playlists: get().playlists.map((p) =>
            p.id === playlistId ? { ...p, tracks: [...p.tracks, track] } : p,
          ),
        })
        return track.id
      },

      setTrackTitle: (playlistId, trackId, title) =>
        set({
          playlists: get().playlists.map((p) =>
            p.id === playlistId
              ? {
                  ...p,
                  tracks: p.tracks.map((tr) =>
                    tr.id === trackId ? { ...tr, title } : tr,
                  ),
                }
              : p,
          ),
        }),

      removeTrack: (playlistId, trackId) =>
        set({
          playlists: get().playlists.map((p) =>
            p.id === playlistId
              ? { ...p, tracks: p.tracks.filter((tr) => tr.id !== trackId) }
              : p,
          ),
        }),

      removePlaylist: (id) =>
        set({
          playlists: get().playlists.filter((p) => p.id !== id),
          // Scenes pointing at it fall back to "no playlist".
          encounters: get().encounters.map((e) => ({
            ...e,
            scenes: e.scenes.map((sc) =>
              sc.playlistId === id ? { ...sc, playlistId: undefined } : sc,
            ),
          })),
        }),

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
      version: 3,
      migrate: (state, from) => {
        let s = state as PersistedState
        // v0 kept one YouTube playlist/video id per "playlist"; they are now
        // user-built track lists, so those legacy entries are dropped.
        if (from < 1) s = { ...s, playlists: [] }
        // v1 gave an encounter one page of text and owned the items itself;
        // both belong to scenes now, so fold them into an opening scene.
        if (from < 3) {
          s = {
            ...s,
            encounters: (s.encounters ?? []).map((e) => {
              const legacy = e as Encounter & {
                text?: string
                items?: EncounterItem[]
              }
              const scenes: Scene[] = (e.scenes ?? []).map((sc) => ({
                ...sc,
                items: sc.items ?? [],
              }))
              if (scenes.length === 0)
                scenes.push({
                  id: newId(),
                  name: 'Cena 1',
                  text: legacy.text,
                  items: [],
                })
              else if (legacy.text && !scenes[0].text) scenes[0].text = legacy.text
              if (legacy.items?.length)
                scenes[0] = {
                  ...scenes[0],
                  items: [...scenes[0].items, ...legacy.items],
                }
              return { id: e.id, name: e.name, notes: e.notes, scenes }
            }),
          }
        }
        return s
      },
      partialize: (s): PersistedState => ({
        activeBookIds: s.activeBookIds,
        variationPrefs: s.variationPrefs,
        favorites: s.favorites,
        builds: s.builds,
        encounters: s.encounters,
        playlists: s.playlists,
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

/** Replace one scene of one encounter, leaving every other object untouched. */
function mapScene(
  encounters: Encounter[],
  encounterId: string,
  sceneId: string,
  fn: (scene: Scene) => Scene,
): Encounter[] {
  return encounters.map((e) =>
    e.id === encounterId
      ? { ...e, scenes: e.scenes.map((sc) => (sc.id === sceneId ? fn(sc) : sc)) }
      : e,
  )
}

/** Replace one item of one scene. */
function mapItem(
  encounters: Encounter[],
  encounterId: string,
  sceneId: string,
  itemId: string,
  fn: (item: EncounterItem) => EncounterItem,
): Encounter[] {
  return mapScene(encounters, encounterId, sceneId, (sc) => ({
    ...sc,
    items: sc.items.map((it) => (it.id === itemId ? fn(it) : it)),
  }))
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
