import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { DataTable } from '@/components/DataTable'
import { FilterBox } from '@/components/FilterBox'
import { EntryView } from '@/components/EntryView'
import { PowerBuilderPanel } from '@/components/PowerBuilderPanel'
import { EntryEditor } from '@/components/EntryEditor'
import { columnsFor, type Column } from '@/data/columns'
import { ENTRY_TYPES, type EntryType, type SourcedEntry } from '@/types/entry'
import { resolveText } from '@/lib/localized'
import { categoryLabel } from '@/i18n/categories'

const MODIFIER_COLUMNS: Column[] = [
  { key: 'name', label: (t) => t.entry.name, value: (e, lang) => resolveText(e.name, lang) },
  {
    key: 'cost',
    label: () => 'PP',
    width: '5rem',
    align: 'right',
    value: (e) => String(e.fields?.cost ?? ''),
  },
]
import {
  applyFilters,
  emptyFilter,
  type FilterState,
} from '@/lib/filters'
import { useGroups, useResolvedEntries, useContentLang, useT } from '@/hooks'
import { useLibrary } from '@/store/useLibrary'

export function Browse() {
  const { type } = useParams<{ type?: string }>()
  const { t } = useT()
  const lang = useContentLang()
  const all = useResolvedEntries()
  const groups = useGroups()
  const setVariationPref = useLibrary((s) => s.setVariationPref)
  const [params, setParams] = useSearchParams()

  const activeType =
    type && ENTRY_TYPES.includes(type as EntryType)
      ? (type as EntryType)
      : undefined
  const cat = params.get('cat') ?? undefined

  const typed = useMemo(() => {
    let list = activeType ? all.filter((e) => e.type === activeType) : all
    if (cat) list = list.filter((e) => e.category === cat)
    // Plain Powers view excludes the "modifier" sub-category (its own menu).
    else if (activeType === 'power')
      list = list.filter((e) => e.category !== 'modifier')
    return list
  }, [all, activeType, cat])

  const [filter, setFilter] = useState<FilterState>(emptyFilter())
  // Reset filters when switching view.
  useEffect(() => setFilter(emptyFilter()), [activeType, cat])

  const rows = useMemo(
    () => applyFilters(typed, filter, lang),
    [typed, filter, lang],
  )

  const columns = useMemo(
    () => (cat === 'modifier' ? MODIFIER_COLUMNS : columnsFor(activeType)),
    [activeType, cat],
  )

  const [creating, setCreating] = useState(false)
  const selectedKey = params.get('sel') ?? undefined
  const selected = useMemo(
    () => all.find((e) => e.key === selectedKey),
    [all, selectedKey],
  )
  const isPower = selected?.type === 'power' && selected.category !== 'modifier'
  const selectEntry = (e: SourcedEntry) => {
    const next = new URLSearchParams(params)
    next.set('sel', e.key)
    setParams(next, { replace: true })
  }
  const clearSelection = () => {
    const next = new URLSearchParams(params)
    next.delete('sel')
    setParams(next, { replace: true })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-lg font-bold sm:text-xl">
          {cat
            ? categoryLabel(cat, lang) + 's'
            : activeType
              ? t.types[activeType]
              : t.browse.all}
        </h1>
        <span className="text-sm opacity-60">{rows.length}</span>
        <button
          onClick={() => setCreating(true)}
          className="ml-auto rounded border border-blood px-2 py-1 text-sm text-blood hover:bg-blood/10"
        >
          + {t.editor.newItem}
        </button>
      </div>
      {creating && (
        <EntryEditor
          defaultType={activeType}
          onClose={() => setCreating(false)}
        />
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* List — hidden on small screens when an entry is open. */}
        <div
          className={`min-h-0 flex-col gap-2 ${
            selectedKey ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <FilterBox
            entries={typed}
            filter={filter}
            onChange={setFilter}
            lang={lang}
          />
          <div className="min-h-0 flex-1 overflow-auto rounded border border-black/10 dark:border-white/10">
            <DataTable
              entries={rows}
              columns={columns}
              lang={lang}
              selectedKey={selectedKey}
              onSelect={selectEntry}
              variationCount={(key) => groups.get(key)?.variations.length ?? 1}
              variations={(key) => groups.get(key)?.variations ?? []}
              onSelectVariation={(v) => {
                setVariationPref(v.key, v.source)
                selectEntry(v)
              }}
            />
          </div>
        </div>

        {/* Detail — item scrolls; power builder pinned + always visible. */}
        <div
          className={`min-h-0 flex-col rounded border border-black/10 dark:border-white/10 ${
            selectedKey ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {selectedKey ? (
            <>
              <div className="min-h-0 flex-1 overflow-auto p-4">
                <EntryView entryKey={selectedKey} />
              </div>
              {isPower && (
                <div className="max-h-[55%] shrink-0 overflow-auto border-t border-black/10 p-3 dark:border-white/10">
                  <PowerBuilderPanel key={selectedKey} powerKey={selectedKey} />
                </div>
              )}
              <button
                onClick={clearSelection}
                className="shrink-0 border-t border-black/10 bg-blood py-3 text-sm font-semibold text-white lg:hidden dark:border-white/10"
              >
                ← {t.back}
              </button>
            </>
          ) : (
            <p className="p-4 opacity-50">{t.search.typeToSearch}</p>
          )}
        </div>
      </div>
    </div>
  )
}
