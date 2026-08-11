import type { ReactNode } from 'react'
import type { EntryType, SourcedEntry } from '@/types/entry'
import type { Dict } from '@/i18n'
import { entryField as field, resolveText } from '@/lib/localized'
import { categoryLabel } from '@/i18n/categories'

export interface Column {
  key: string
  label: (t: Dict) => string
  /** Fixed width (Tailwind class fragment or CSS value). */
  width?: string
  align?: 'left' | 'right' | 'center'
  /** Sort/plain value. */
  value: (e: SourcedEntry, lang: string) => string
  /** Optional rich cell; falls back to value(). */
  render?: (e: SourcedEntry, lang: string, t: Dict) => ReactNode
}

const nameCol: Column = {
  key: 'name',
  label: (t) => t.entry.name ?? 'Name',
  value: (e, lang) => resolveText(e.name, lang),
}

const rankCol: Column = {
  key: 'rank',
  label: (t) => t.entry.rank,
  width: '7rem',
  value: (e, _lang) => e.rank ?? '',
  render: (e, _lang, t) => (e.rank ? t.ranks[e.rank] : ''),
}

const categoryCol: Column = {
  key: 'category',
  label: (t) => t.entry.category,
  width: '9rem',
  value: (e, lang) => categoryLabel(e.category, lang),
}

// Every equipment list (gear, weapons, armor, vehicles) shows the same cost
// column, so it lives here instead of being repeated per type.
const costCol: Column = {
  key: 'cost',
  label: (t) => t.fields.cost,
  width: '6rem',
  align: 'right',
  value: (e, lang) => field(e, 'cost', lang),
}

const weightCol: Column = {
  key: 'weight',
  label: (t) => t.fields.weight,
  width: '6rem',
  align: 'right',
  value: (e, lang) => field(e, 'weight', lang),
}

// Rules have long category names ("Regras de Ciberequipamento"), so give them
// a wider column.
const categoryColWide: Column = { ...categoryCol, width: '16rem' }

// Column set per entry type. `name` and `source` are added by the table itself.
const MIDDLE: Record<EntryType, Column[]> = {
  edge: [
    rankCol,
    categoryCol,
    {
      key: 'requirements',
      label: (t) => t.entry.requirements,
      value: (e, lang) => resolveText(e.requirements, lang),
    },
  ],
  hindrance: [
    { key: 'severity', label: (t) => t.entry.category, width: '9rem', value: (e, lang) => categoryLabel(e.category, lang) },
  ],
  power: [
    rankCol,
    { key: 'pp', label: (t) => t.fields.pp, width: '4rem', align: 'right', value: (e, lang) => field(e, 'pp', lang) },
    { key: 'range', label: (t) => t.fields.range, width: '8rem', value: (e, lang) => field(e, 'range', lang) },
    { key: 'duration', label: (t) => t.fields.duration, width: '8rem', value: (e, lang) => field(e, 'duration', lang) },
  ],
  skill: [
    { key: 'attribute', label: (t) => t.fields.attribute, width: '8rem', value: (e, lang) => field(e, 'attribute', lang) },
  ],
  gear: [costCol, weightCol],
  weapon: [
    { key: 'damage', label: (t) => t.fields.damage, width: '7rem', value: (e, lang) => field(e, 'damage', lang) },
    { key: 'range', label: (t) => t.fields.range, width: '7rem', value: (e, lang) => field(e, 'range', lang) },
    { key: 'rof', label: (t) => t.fields.rof, width: '4rem', align: 'right', value: (e, lang) => field(e, 'rof', lang) },
    { key: 'minStr', label: (t) => t.fields.minStr, width: '6rem', align: 'right', value: (e, lang) => field(e, 'minStr', lang) },
    costCol,
  ],
  armor: [
    { key: 'armor', label: (t) => t.fields.armor, width: '6rem', align: 'right', value: (e, lang) => field(e, 'armor', lang) },
    { key: 'minStr', label: (t) => t.fields.minStr, width: '6rem', align: 'right', value: (e, lang) => field(e, 'minStr', lang) },
    costCol,
    weightCol,
  ],
  vehicle: [
    { key: 'topSpeed', label: (t) => t.fields.topSpeed, width: '7rem', value: (e, lang) => field(e, 'topSpeed', lang) },
    { key: 'toughness', label: (t) => t.fields.toughness, width: '7rem', value: (e, lang) => field(e, 'toughness', lang) },
    costCol,
  ],
  ancestry: [categoryCol],
  rule: [categoryColWide],
  'setting-rule': [categoryColWide],
  bestiary: [
    { key: 'wildCard', label: (t) => t.fields.wildCard, width: '6rem', align: 'center', value: (e) => (e.fields?.wildCard ? '★' : '') },
  ],
}

const typeCol: Column = {
  key: 'type',
  label: (t) => t.browse.title,
  width: '10rem',
  value: (e, _lang) => e.type,
  render: (e, _lang, t) => t.types[e.type],
}

/**
 * Columns for a browse view. `type === undefined` = the "All" view, which shows
 * a generic Name / Type / Source layout.
 */
export function columnsFor(type: EntryType | undefined): Column[] {
  if (!type) return [nameCol, typeCol]
  return [nameCol, ...MIDDLE[type]]
}
