// Core content model. One `Entry` = one game object (edge, power, rule, ...).
// Text fields are `LocalizedText`: either a plain string (single language)
// or a map of language-code -> string, so one book can carry many languages.

export type EntryType =
  | 'edge' // vantagem
  | 'hindrance' // complicação
  | 'power' // poder
  | 'skill' // perícia
  | 'gear' // equipamento
  | 'weapon' // arma
  | 'armor' // armadura
  | 'vehicle' // veículo
  | 'ancestry' // raça / origem
  | 'rule' // regra
  | 'setting-rule' // regra de cenário
  | 'bestiary' // criatura

// Browsable entry types. `vehicle` is merged into `gear` and `setting-rule`
// into `rule`, so they are not listed here (kept in EntryType for old data).
export const ENTRY_TYPES: EntryType[] = [
  'edge',
  'hindrance',
  'power',
  'skill',
  'gear',
  'weapon',
  'armor',
  'ancestry',
  'rule',
  'bestiary',
]

export type Rank = 'novice' | 'seasoned' | 'veteran' | 'heroic' | 'legendary'

export const RANKS: Rank[] = ['novice', 'seasoned', 'veteran', 'heroic', 'legendary']

/** Plain string, or { "pt-BR": "...", "en": "..." }. */
export type LocalizedText = string | Record<string, string>

export interface Entry {
  /** Unique within its book, e.g. "edge.alerta". */
  id: string
  /**
   * Canonical dedup key shared by the SAME game object across books,
   * e.g. "edge:alerta". Drives variation grouping.
   */
  key: string
  type: EntryType
  name: LocalizedText
  /** Sub-grouping within a type, e.g. edge category "background". */
  category?: string
  rank?: Rank
  requirements?: LocalizedText
  summary?: LocalizedText
  description?: LocalizedText
  page?: number
  tags?: string[]
  /** Type-specific structured data (power points, damage, range, ...). */
  fields?: Record<string, unknown>
}

/** An `Entry` after loading, tagged with the book it came from. */
export interface SourcedEntry extends Entry {
  source: string // book id
  sourceAbbrev: string
}

/** All variations of one `key` across the active books. */
export interface EntryGroup {
  key: string
  type: EntryType
  variations: SourcedEntry[]
}
