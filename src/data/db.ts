// Client-side book storage. All books live in the browser (IndexedDB) — nothing
// is persisted on the server. The bundled public/data books are used ONCE to
// seed an empty database; after that the library is fully client-owned and the
// user can upload their own book JSON files.

import type { Book } from '@/types/book'

const DB_NAME = 'swade-library'
const STORE = 'books'
const VERSION = 1

export type BookOrigin = 'seed' | 'user'

export interface BookRecord {
  id: string
  origin: BookOrigin
  book: Book
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function promisify<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function allBookRecords(): Promise<BookRecord[]> {
  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readonly')
    return await promisify(tx.objectStore(STORE).getAll() as IDBRequest<BookRecord[]>)
  } finally {
    db.close()
  }
}

export async function countBooks(): Promise<number> {
  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readonly')
    return await promisify(tx.objectStore(STORE).count())
  } finally {
    db.close()
  }
}

export async function putBookRecord(rec: BookRecord): Promise<void> {
  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readwrite')
    await promisify(tx.objectStore(STORE).put(rec))
  } finally {
    db.close()
  }
}

export async function deleteBookRecord(id: string): Promise<void> {
  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readwrite')
    await promisify(tx.objectStore(STORE).delete(id))
  } finally {
    db.close()
  }
}
