import type { Entry } from './entry'

/** Entry in the manifest — describes a book without loading its entries. */
export interface BookMeta {
  id: string
  title: string
  abbrev: string
  /** File under public/data/books/, e.g. "swade-core.json". */
  file: string
  /** Content languages present in this book, e.g. ["pt-BR", "en"]. */
  languages: string[]
  version?: string
  publisher?: string
  /** True for the base rulebook; UI may pin it. */
  core?: boolean
  /** Grouping label, e.g. "core" | "compendium" | "example" | "homebrew". */
  category?: string
  /** Cover image as a data: URI (base64). Lives in the book file. */
  cover?: string
}

export interface Manifest {
  books: BookMeta[]
}

/** A book file loaded from disk. */
export interface Book {
  id: string
  title: string
  abbrev: string
  languages: string[]
  version?: string
  publisher?: string
  category?: string
  cover?: string
  entries: Entry[]
}
