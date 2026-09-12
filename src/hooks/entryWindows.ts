import { createContext, useContext } from 'react'

/** Opens one entry (by canonical key) in a floating, non-blocking window. */
export type OpenEntry = (key: string) => void

/**
 * Set by `EntryWindowProvider`. When present, auto-linked references open a
 * window; when null (the default) they navigate to the entry page as usual.
 */
export const EntryWindowContext = createContext<OpenEntry | null>(null)

export function useEntryWindow(): OpenEntry | null {
  return useContext(EntryWindowContext)
}
