import { useMemo, useState } from 'react'
import { useResolvedEntries, useContentLang, useT } from '@/hooks'
import { useLibrary } from '@/store/useLibrary'
import { useToast } from '@/store/useToast'
import { resolveText } from '@/lib/localized'
import {
  costMin,
  costVariable,
  extractBlockModifiers,
  parseCostOptions,
} from '@/lib/powerBuild'

function newId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `b_${Date.now()}_${Math.floor(Math.random() * 1e6)}`
  }
}

interface ModDesc {
  id: string // gen: entry key; own: "own:"+name; custom: "custom:"+id
  label: string
  cost: string | undefined
  options: number[]
  group: 'own' | 'gen' | 'custom'
  desc?: string
  customId?: string // for removable custom mods
}

export function PowerBuilderPanel({
  powerKey,
  buildId,
}: {
  powerKey: string
  buildId?: string
}) {
  const { t } = useT()
  const lang = useContentLang()
  const entries = useResolvedEntries()
  const builds = useLibrary((s) => s.builds)
  const addBuild = useLibrary((s) => s.addBuild)
  const updateBuild = useLibrary((s) => s.updateBuild)
  const customStore = useLibrary((s) => s.customMods[powerKey])
  const addCustomMod = useLibrary((s) => s.addCustomMod)
  const removeCustomMod = useLibrary((s) => s.removeCustomMod)
  const showToast = useToast((s) => s.show)

  const power = useMemo(
    () => entries.find((e) => e.key === powerKey),
    [entries, powerKey],
  )

  const generalMods: ModDesc[] = useMemo(
    () =>
      entries
        .filter((e) => e.type === 'power' && e.category === 'modifier')
        .sort((a, b) =>
          resolveText(a.name, lang).localeCompare(resolveText(b.name, lang)),
        )
        .map((e) => {
          const cost = e.fields?.cost as string | undefined
          return {
            id: e.key,
            label: resolveText(e.name, lang),
            cost,
            options: parseCostOptions(cost),
            group: 'gen' as const,
            desc: resolveText(e.summary ?? e.description, lang),
          }
        }),
    [entries, lang],
  )

  const ownMods: ModDesc[] = useMemo(
    () =>
      (power ? extractBlockModifiers(resolveText(power.description, lang)) : []).map(
        (m) => ({
          id: `own:${m.name}`,
          label: m.name,
          cost: m.cost,
          options: parseCostOptions(m.cost),
          group: 'own' as const,
          desc: m.desc,
        }),
      ),
    [power, lang],
  )

  const customMods: ModDesc[] = useMemo(
    () =>
      (customStore ?? []).map((c) => ({
        id: `custom:${c.id}`,
        label: c.name,
        cost: c.cost >= 0 ? `+${c.cost}` : String(c.cost),
        options: [c.cost],
        group: 'custom' as const,
        desc: c.desc,
        customId: c.id,
      })),
    [customStore],
  )

  const existing = buildId ? builds.find((b) => b.id === buildId) : undefined
  const [gen, setGen] = useState<string[]>(existing?.gen ?? [])
  const [own, setOwn] = useState<string[]>(existing?.own ?? [])
  const [cus, setCus] = useState<string[]>(existing?.customIds ?? [])
  const [choices, setChoices] = useState<Record<string, number>>(
    existing?.choices ?? {},
  )
  const [showForm, setShowForm] = useState(false)
  const [cName, setCName] = useState('')
  const [cVal, setCVal] = useState('')
  const [cDesc, setCDesc] = useState('')

  if (!power) return null

  const basePP = (power.fields?.pp as string | undefined) ?? '0'
  const selectedIds = new Set([
    ...gen,
    ...own.map((n) => `own:${n}`),
    ...cus.map((id) => `custom:${id}`),
  ])
  const allMods = [...ownMods, ...generalMods, ...customMods]

  const valueOf = (m: ModDesc): number =>
    choices[m.id] ?? m.options[0] ?? costMin(m.cost)

  let total = costMin(basePP)
  for (const m of allMods) if (selectedIds.has(m.id)) total += valueOf(m)
  if (total < 1) total = 1
  const variable = costVariable(basePP) || /\D/.test(basePP.replace(/^\+/, ''))

  const isOn = (m: ModDesc) => selectedIds.has(m.id)
  const toggle = (m: ModDesc) => {
    if (m.group === 'gen')
      setGen((s) => (s.includes(m.id) ? s.filter((x) => x !== m.id) : [...s, m.id]))
    else if (m.group === 'own') {
      const name = m.label
      setOwn((s) => (s.includes(name) ? s.filter((x) => x !== name) : [...s, name]))
    } else if (m.customId) {
      const id = m.customId
      setCus((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
    }
  }
  const choose = (id: string, v: number) => setChoices((c) => ({ ...c, [id]: v }))

  const submitCustom = () => {
    const name = cName.trim()
    const cost = parseInt(cVal, 10)
    if (!name || Number.isNaN(cost)) return
    const id = newId()
    addCustomMod(powerKey, { id, name, cost, desc: cDesc.trim() || undefined })
    setCus((s) => [...s, id]) // auto-activate
    setCName('')
    setCVal('')
    setCDesc('')
    setShowForm(false)
  }
  const deleteCustom = (id: string) => {
    removeCustomMod(powerKey, id)
    setCus((s) => s.filter((x) => x !== id))
  }

  const save = () => {
    if (existing) {
      updateBuild(existing.id, { gen, own, choices, customIds: cus })
      showToast(t.builder.updatedToast)
    } else {
      addBuild({ id: newId(), powerKey, gen, own, choices, customIds: cus })
      showToast(t.builder.savedToast)
    }
  }
  const clearAll = () => {
    setGen([])
    setOwn([])
    setCus([])
    setChoices({})
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-brass">
          {t.builder.title}
        </h2>
        <div className="text-sm">
          {t.builder.totalPP}:{' '}
          <span className="font-bold">
            {total}
            {variable ? '+' : ''} PP
          </span>
        </div>
      </div>

      {ownMods.length > 0 && (
        <ModGroup label={t.builder.ownMods} mods={ownMods} isOn={isOn} onToggle={toggle} valueOf={valueOf} onChoose={choose} />
      )}
      {generalMods.length > 0 && (
        <ModGroup label={t.builder.generalMods} mods={generalMods} isOn={isOn} onToggle={toggle} valueOf={valueOf} onChoose={choose} />
      )}

      {/* Custom (homebrew) modifiers — stored on the power, toggleable */}
      <div className="mb-2">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wide opacity-60">
            {t.builder.customMods}
          </span>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="text-xs text-blood hover:underline">
              {t.builder.addCustom}
            </button>
          )}
        </div>

        {customMods.length > 0 && (
          <ModGroup
            label=""
            mods={customMods}
            isOn={isOn}
            onToggle={toggle}
            valueOf={valueOf}
            onChoose={choose}
            onDelete={deleteCustom}
          />
        )}

        {showForm && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5 rounded border border-black/10 p-2 dark:border-white/10">
            <input value={cName} onChange={(e) => setCName(e.target.value)} placeholder={t.builder.customName}
              className="w-32 rounded border border-black/15 bg-white px-2 py-0.5 text-xs dark:border-white/15 dark:bg-black/30" />
            <input value={cVal} onChange={(e) => setCVal(e.target.value)} type="number" placeholder={t.builder.customValue}
              className="w-16 rounded border border-black/15 bg-white px-2 py-0.5 text-xs dark:border-white/15 dark:bg-black/30" />
            <input value={cDesc} onChange={(e) => setCDesc(e.target.value)} placeholder={t.builder.customDesc}
              className="min-w-[8rem] flex-1 rounded border border-black/15 bg-white px-2 py-0.5 text-xs dark:border-white/15 dark:bg-black/30" />
            <button onClick={submitCustom} className="rounded bg-blood px-2 py-0.5 text-xs text-white hover:opacity-90">
              {t.builder.add}
            </button>
            <button onClick={() => setShowForm(false)} className="rounded border border-black/15 px-2 py-0.5 text-xs dark:border-white/15">
              {t.builder.cancel}
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        {selectedIds.size > 0 && (
          <button onClick={clearAll} className="rounded border border-black/15 px-2 py-1 text-xs hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10">
            {t.builder.clear}
          </button>
        )}
        <button onClick={save} className="rounded bg-blood px-3 py-1 text-sm text-white hover:opacity-90">
          ★ {existing ? t.builder.update : t.builder.save}
        </button>
      </div>
    </section>
  )
}

function ModGroup({
  label,
  mods,
  isOn,
  onToggle,
  valueOf,
  onChoose,
  onDelete,
}: {
  label: string
  mods: ModDesc[]
  isOn: (m: ModDesc) => boolean
  onToggle: (m: ModDesc) => void
  valueOf: (m: ModDesc) => number
  onChoose: (id: string, v: number) => void
  onDelete?: (customId: string) => void
}) {
  return (
    <div className="mb-2">
      {label && (
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide opacity-60">
          {label}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {mods.map((m) => {
          const on = isOn(m)
          const multi = m.options.length > 1
          const val = valueOf(m)
          return (
            <span key={m.id} className="group relative inline-flex items-center">
              <button
                onClick={() => onToggle(m)}
                className={`rounded px-2 py-0.5 text-xs ${
                  on
                    ? 'bg-blood text-white'
                    : 'bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20'
                }`}
              >
                {m.label}
                {m.cost ? ` (${multi ? (val >= 0 ? `+${val}` : val) : m.cost})` : ''}
              </button>
              {m.customId && onDelete && (
                <button
                  onClick={() => onDelete(m.customId!)}
                  className="ml-0.5 text-[10px] opacity-40 hover:text-red-500 hover:opacity-100"
                  title="✕"
                >
                  ✕
                </button>
              )}
              {(m.desc || multi) && (
                <span className="pointer-events-none absolute bottom-full left-0 z-50 mb-1 hidden w-60 rounded border border-black/10 bg-white p-2 text-left text-[11px] leading-snug shadow-lg group-hover:block dark:border-white/15 dark:bg-[#1c1815]">
                  <strong className="font-semibold">
                    {m.label}
                    {m.cost ? ` (${m.cost})` : ''}
                  </strong>
                  {m.desc && <span className="mt-0.5 block opacity-90">{m.desc}</span>}
                </span>
              )}
              {on && multi && (
                <span className="ml-1 inline-flex overflow-hidden rounded border border-black/15 dark:border-white/15">
                  {m.options.map((o) => (
                    <button
                      key={o}
                      onClick={() => onChoose(m.id, o)}
                      className={`px-1.5 py-0.5 text-[11px] ${
                        val === o ? 'bg-brass text-ink' : 'hover:bg-black/5 dark:hover:bg-white/10'
                      }`}
                    >
                      {o >= 0 ? `+${o}` : o}
                    </button>
                  ))}
                </span>
              )}
            </span>
          )
        })}
      </div>
    </div>
  )
}
