import { useState } from 'react'
import {
  type FilterState,
  type FacetKey,
  FACET_KEYS,
  cycleMode,
  emptyFilter,
  facetOptions,
  availableFacetValues,
  isFilterActive,
} from '@/lib/filters'
import type { SourcedEntry } from '@/types/entry'
import { useT, useSourceName } from '@/hooks'
import { sourceBadgeStyle } from '@/lib/sources'
import { categoryLabel } from '@/i18n/categories'

export interface FilterBoxProps {
  entries: SourcedEntry[]
  filter: FilterState
  onChange: (f: FilterState) => void
  lang: string
}

export function FilterBox(props: FilterBoxProps): JSX.Element {
  const { entries, filter, onChange, lang } = props
  const { t } = useT()
  const sourceName = useSourceName()
  const [open, setOpen] = useState(false)

  const active = isFilterActive(filter)

  function pillLabel(key: FacetKey, value: string): string {
    if (key === 'rank') {
      const ranks = t.ranks as Record<string, string>
      return ranks[value] ?? value
    }
    if (key === 'category') return categoryLabel(value, lang)
    return value
  }

  function togglePill(key: FacetKey, value: string): void {
    onChange({
      ...filter,
      [key]: { ...filter[key], [value]: cycleMode(filter[key][value]) },
    })
  }

  const facetLabels = t.filter as Record<string, string>

  return (
    <div className="text-slate-800 dark:text-slate-100">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="relative inline-flex items-center gap-1 rounded border border-brass/40 bg-black/5 px-2 py-1 text-sm font-medium hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20"
          aria-expanded={open}
        >
          {t.filter.button}
          {active && (
            <span
              className="ml-1 inline-block h-2 w-2 rounded-full bg-blood"
              aria-hidden="true"
            />
          )}
        </button>
        <input
          type="text"
          value={filter.text}
          placeholder={t.filter.listSearch}
          onChange={(e) => onChange({ ...filter, text: e.target.value })}
          className="flex-1 rounded border border-black/10 bg-white px-2 py-1 text-sm outline-none focus:border-brass dark:border-white/10 dark:bg-black/30"
        />
      </div>

      {open && (
        <div className="mt-2 rounded border border-black/10 bg-black/[0.03] p-3 dark:border-white/10 dark:bg-white/[0.04]">
          {FACET_KEYS.map((key) => {
            const options = facetOptions(entries, key)
            if (options.length === 0) return null
            const available = availableFacetValues(entries, filter, key)
            return (
              <div key={key} className="mb-3 last:mb-0">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {facetLabels[key]}
                </div>
                <div className="flex flex-wrap gap-1">
                  {options.map((value) => {
                    const mode = filter[key][value] ?? 0
                    // Disable a neutral pill with no matching entries under the
                    // other active filters (cross-filtering).
                    const disabled = mode === 0 && !available.has(value)
                    let cls = 'rounded px-2 py-0.5 text-xs transition-colors '
                    let style: React.CSSProperties | undefined
                    if (mode === 1) {
                      cls += 'bg-blue-600 text-white'
                    } else if (mode === -1) {
                      cls += 'bg-red-700 text-white line-through'
                    } else if (disabled) {
                      cls += 'cursor-not-allowed bg-black/5 opacity-30 dark:bg-white/10'
                    } else {
                      cls +=
                        'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20'
                      if (key === 'source') {
                        const badge = sourceBadgeStyle(value)
                        style = {
                          boxShadow: `inset 3px 0 0 ${String(badge.backgroundColor)}`,
                        }
                      }
                    }
                    const tip =
                      key === 'source' ? sourceName(value) : pillLabel(key, value)
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => !disabled && togglePill(key, value)}
                        disabled={disabled}
                        className={cls}
                        style={style}
                        aria-pressed={mode !== 0}
                        title={tip}
                      >
                        {pillLabel(key, value)}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          <div className="mt-3 flex items-center justify-between border-t border-black/10 pt-2 text-[11px] text-slate-500 dark:border-white/10 dark:text-slate-400">
            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
              <span>
                <span className="inline-block h-2 w-2 translate-y-[1px] rounded-full bg-blue-600" />{' '}
                {t.filter.hintRequire}
              </span>
              <span>
                <span className="inline-block h-2 w-2 translate-y-[1px] rounded-full bg-red-700" />{' '}
                {t.filter.hintExclude}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onChange(emptyFilter())}
              className="rounded border border-brass/40 px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-black/10 dark:text-slate-200 dark:hover:bg-white/10"
            >
              {t.filter.reset}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
