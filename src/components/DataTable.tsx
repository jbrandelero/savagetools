import { Fragment, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { SourcedEntry } from '@/types/entry'
import type { Column } from '@/data/columns'
import { sourceBadgeStyle } from '@/lib/sources'
import { resolveText } from '@/lib/localized'
import { categoryLabel } from '@/i18n/categories'
import { useT, useSourceName } from '@/hooks'

export interface DataTableProps {
  entries: SourcedEntry[]
  columns: Column[]
  lang: string // content language for resolveText
  selectedKey?: string
  onSelect: (e: SourcedEntry) => void
  variationCount: (key: string) => number // >1 means multiple book versions
  /** All variations of a key across active books (for the expandable sub-list). */
  variations?: (key: string) => SourcedEntry[]
  /** Choose a specific variation (sets it as the shown version + selects it). */
  onSelectVariation?: (e: SourcedEntry) => void
}

/** Sentinel key for the always-appended Source column. */
const SOURCE_KEY = '__source__'

type SortDir = 'asc' | 'desc'

function alignClass(align: Column['align']): string {
  if (align === 'right') return 'text-right'
  if (align === 'center') return 'text-center'
  return 'text-left'
}

export function DataTable(props: DataTableProps): JSX.Element {
  const {
    entries,
    columns,
    lang,
    selectedKey,
    onSelect,
    variationCount,
    variations,
    onSelectVariation,
  } = props
  const { t } = useT()
  const sourceName = useSourceName()

  const [sortKey, setSortKey] = useState<string>(columns[0]?.key ?? SOURCE_KEY)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const toggleExpand = (key: string) =>
    setExpanded((s) => {
      const n = new Set(s)
      if (n.has(key)) n.delete(key)
      else n.add(key)
      return n
    })

  // Sort value for a given entry + column key (Source handled specially).
  const sortValueFor = useMemo(() => {
    const byKey = new Map(columns.map((c) => [c.key, c]))
    return (e: SourcedEntry, key: string): string => {
      if (key === SOURCE_KEY) return e.sourceAbbrev
      const col = byKey.get(key)
      return col ? col.value(e, lang) : ''
    }
  }, [columns, lang])

  const sorted = useMemo(() => {
    const rows = [...entries]
    rows.sort((a, b) => {
      const cmp = sortValueFor(a, sortKey).localeCompare(sortValueFor(b, sortKey))
      return sortDir === 'asc' ? cmp : -cmp
    })
    return rows
  }, [entries, sortKey, sortDir, sortValueFor])

  // Group sorted rows by category. Groups are ordered alphabetically by their
  // localized label; the uncategorized bucket sinks to the bottom. When every
  // row shares a single category, grouping is skipped (one flat list).
  const groupsByCat = useMemo(() => {
    const buckets = new Map<string, { label: string; rows: SourcedEntry[] }>()
    for (const e of sorted) {
      const slug = e.category ?? ''
      let bucket = buckets.get(slug)
      if (!bucket) {
        bucket = {
          label: slug ? categoryLabel(slug, lang) : t.browse.uncategorized,
          rows: [],
        }
        buckets.set(slug, bucket)
      }
      bucket.rows.push(e)
    }
    return [...buckets.entries()]
      .sort(([sa, a], [sb, b]) => {
        if (!sa) return 1
        if (!sb) return -1
        return a.label.localeCompare(b.label)
      })
      .map(([, b]) => b)
  }, [sorted, lang, t])

  const showGroups = groupsByCat.length > 1
  const colTotal = columns.length + 1 // + source column

  function renderRow(entry: SourcedEntry): JSX.Element {
    const selected = entry.key === selectedKey
    const extra = variationCount(entry.key) - 1
    const isOpen = expanded.has(entry.key)
    const others = extra > 0 && variations ? variations(entry.key) : []
    return (
      <Fragment key={entry.key}>
        <tr
          onClick={() => onSelect(entry)}
          className={`cursor-pointer odd:bg-black/[0.02] even:bg-transparent hover:bg-black/5 dark:odd:bg-white/[0.03] dark:hover:bg-white/5 ${
            selected ? 'border-l-2 border-blood bg-blood/15' : ''
          }`}
        >
          {columns.map((col) => {
            const content = col.render ? col.render(entry, lang, t) : col.value(entry, lang)
            if (col.key === 'name') {
              return (
                <td key={col.key} className={`px-2 py-1 ${alignClass(col.align)}`}>
                  {extra > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleExpand(entry.key)
                      }}
                      className="mr-1 select-none text-brass"
                      title={`${extra} other version${extra > 1 ? 's' : ''}`}
                    >
                      {isOpen ? '▾' : '▸'}
                    </button>
                  )}
                  {content}
                  {extra > 0 && (
                    <span className="ml-1.5 rounded bg-brass/20 px-1 py-0.5 text-[10px] font-medium text-brass">
                      +{extra}
                    </span>
                  )}
                </td>
              )
            }
            return (
              <td key={col.key} className={`px-2 py-1 ${alignClass(col.align)}`}>
                {content}
              </td>
            )
          })}
          <td className="px-2 py-1 text-left">
            <span
              style={sourceBadgeStyle(entry.sourceAbbrev)}
              title={sourceName(entry.sourceAbbrev)}
              className="rounded px-1.5 py-0.5 text-[11px] font-medium"
            >
              {entry.sourceAbbrev}
            </span>
          </td>
        </tr>

        {isOpen &&
          others.map((v) => (
            <tr
              key={entry.key + '::' + v.source}
              onClick={() => (onSelectVariation ?? onSelect)(v)}
              className={`cursor-pointer bg-brass/[0.06] text-xs hover:bg-brass/15 ${
                v.source === entry.source ? 'font-medium' : ''
              }`}
            >
              <td colSpan={columns.length} className="px-2 py-1 pl-8">
                <span className="mr-1 opacity-40">↳</span>
                {resolveText(v.name, lang)}
                {v.source === entry.source && (
                  <span className="ml-1 text-brass">✓</span>
                )}
              </td>
              <td className="px-2 py-1 text-left">
                <span
                  style={sourceBadgeStyle(v.sourceAbbrev)}
                  title={sourceName(v.sourceAbbrev)}
                  className="rounded px-1.5 py-0.5 text-[11px] font-medium"
                >
                  {v.sourceAbbrev}
                </span>
              </td>
            </tr>
          ))}
      </Fragment>
    )
  }

  function toggleSort(key: string): void {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function sortIndicator(key: string): ReactNode {
    if (key !== sortKey) return null
    return <span className="ml-1 text-brass">{sortDir === 'asc' ? '▲' : '▼'}</span>
  }

  if (entries.length === 0) {
    return (
      <p className="p-4 text-sm text-ink/50 dark:text-parchment/50">
        {t.browse.empty}
      </p>
    )
  }

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="sticky top-0 z-10 bg-parchment text-ink dark:bg-ink dark:text-parchment">
          {columns.map((col) => (
            <th
              key={col.key}
              style={{ width: col.width }}
              onClick={() => toggleSort(col.key)}
              className={`cursor-pointer select-none border-b border-black/10 px-2 py-1 font-medium dark:border-white/10 ${alignClass(
                col.align,
              )} hover:bg-black/5 dark:hover:bg-white/5`}
            >
              {col.label(t)}
              {sortIndicator(col.key)}
            </th>
          ))}
          <th
            key={SOURCE_KEY}
            onClick={() => toggleSort(SOURCE_KEY)}
            className="cursor-pointer select-none border-b border-black/10 px-2 py-1 text-left font-medium dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
          >
            {t.entry.source}
            {sortIndicator(SOURCE_KEY)}
          </th>
        </tr>
      </thead>
      <tbody>
        {showGroups
          ? groupsByCat.map((g) => (
              <Fragment key={g.label}>
                <tr>
                  <th
                    colSpan={colTotal}
                    className="sticky top-7 z-[9] border-y border-brass/30 bg-brass/10 px-2 py-1 text-left text-xs font-semibold uppercase tracking-wide text-brass"
                  >
                    {g.label}
                    <span className="ml-2 font-normal opacity-60">{g.rows.length}</span>
                  </th>
                </tr>
                {g.rows.map(renderRow)}
              </Fragment>
            ))
          : sorted.map(renderRow)}
      </tbody>
    </table>
  )
}
