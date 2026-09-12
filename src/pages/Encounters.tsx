import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  useLibrary,
  type Encounter,
  type EncounterItem,
  type Scene,
} from '@/store/useLibrary'
import { useContentLang, useResolvedEntries, useT } from '@/hooks'
import { resolveText } from '@/lib/localized'
import { sourceBadgeStyle } from '@/lib/sources'
import { EntryView } from '@/components/EntryView'
import { EntryWindowProvider } from '@/components/EntryWindows'
import { EntryPicker } from '@/components/EntryPicker'
import { MusicPlayer } from '@/components/MusicPlayer'
import { CombatTracker } from '@/components/CombatTracker'
import { JokerIcon } from '@/components/icons'
import { useToast } from '@/store/useToast'
import type { SourcedEntry } from '@/types/entry'

/**
 * GM quick-reference lists ("Encontros"): pick entries from the active books —
 * bestiary creatures above all — into a named list, with the list on the left
 * and the full stat block on the right. References inside the text open in
 * floating windows that never block the page; they are put away when another
 * item is selected and come back, same place and size, on returning to it.
 */
export function Encounters() {
  const { t } = useT()
  const lang = useContentLang()
  const encounters = useLibrary((s) => s.encounters)
  const createEncounter = useLibrary((s) => s.createEncounter)
  const updateEncounter = useLibrary((s) => s.updateEncounter)
  const addScene = useLibrary((s) => s.addScene)
  const updateScene = useLibrary((s) => s.updateScene)
  const removeScene = useLibrary((s) => s.removeScene)
  const removeEncounter = useLibrary((s) => s.removeEncounter)
  const setScenePlaylist = useLibrary((s) => s.setScenePlaylist)
  const addSceneItem = useLibrary((s) => s.addSceneItem)
  const updateSceneItem = useLibrary((s) => s.updateSceneItem)
  const removeSceneItem = useLibrary((s) => s.removeSceneItem)
  const reorderSceneItem = useLibrary((s) => s.reorderSceneItem)
  const setItemWounds = useLibrary((s) => s.setItemWounds)
  const setItemFatigue = useLibrary((s) => s.setItemFatigue)
  const setItemMaxWounds = useLibrary((s) => s.setItemMaxWounds)
  const setItemShaken = useLibrary((s) => s.setItemShaken)
  const setItemIncapacitated = useLibrary((s) => s.setItemIncapacitated)
  const toggleItemState = useLibrary((s) => s.toggleItemState)
  const resetWounds = useLibrary((s) => s.resetWounds)
  const showToast = useToast((s) => s.show)

  const resolved = useResolvedEntries()
  const byKey = useMemo(() => new Map(resolved.map((e) => [e.key, e])), [resolved])

  const [params, setParams] = useSearchParams()
  const [picking, setPicking] = useState(false)

  const encId = params.get('e') ?? encounters[0]?.id
  const enc = encounters.find((e) => e.id === encId)
  // The open scene owns the items; `i` picks one of them for the middle pane.
  const selScene =
    enc?.scenes.find((sc) => sc.id === params.get('s')) ?? enc?.scenes[0]
  const sel = params.get('i') ?? undefined
  const selItem = sel ? selScene?.items.find((i) => i.id === sel) : undefined
  const selEntry = selItem && byKey.get(selItem.key)

  const setQuery = (next: { e?: string; s?: string; i?: string }) => {
    const p = new URLSearchParams()
    if (next.e) p.set('e', next.e)
    if (next.s) p.set('s', next.s)
    if (next.i) p.set('i', next.i)
    setParams(p, { replace: true })
  }

  // An encounter always has somewhere to write: if its last scene was deleted
  // (or it predates scenes), open it on a fresh one.
  const seeded = useRef<string>()
  useEffect(() => {
    if (!enc || enc.scenes.length > 0 || seeded.current === enc.id) return
    seeded.current = enc.id
    addScene(enc.id, `${t.encounters.scene} 1`)
  }, [enc, addScene, t])

  // Created with a placeholder name: the list header is an inline input, so
  // renaming is one click away and no blocking prompt is needed.
  const newEncounter = () =>
    setQuery({
      e: createEncounter(t.encounters.untitled, `${t.encounters.scene} 1`),
    })

  const dropEncounter = (id: string) => {
    if (!confirm(t.encounters.removeConfirm)) return
    removeEncounter(id)
    if (id === encId) setQuery({})
  }

  const newScene = (encounter: Encounter) =>
    setQuery({
      e: encounter.id,
      s: addScene(
        encounter.id,
        `${t.encounters.scene} ${encounter.scenes.length + 1}`,
      ),
    })

  const pick = (entry: SourcedEntry) => {
    if (!enc || !selScene) return
    // Wild Cards are the ones a GM tracks turn by turn: highlight them on sight.
    addSceneItem(enc.id, selScene.id, entry.key, isWildCard(entry))
    showToast(`${resolveText(entry.name, lang)} → ${selScene.name}`)
  }

  if (encounters.length === 0) {
    return (
      <div className="space-y-3">
        <h1 className="font-display text-xl font-bold">{t.encounters.title}</h1>
        <p className="opacity-60">{t.encounters.empty}</p>
        <button
          onClick={newEncounter}
          className="rounded bg-blood px-3 py-1.5 text-sm font-semibold text-white"
        >
          {t.encounters.newEncounter}
        </button>
      </div>
    )
  }

  return (
    <EntryWindowProvider contextId={sel ?? selScene?.id ?? 'none'}>
      <div className="flex h-full flex-col">
        {/* Breadcrumb: the encounter's name is edited right here. */}
        <div className="mb-3 flex min-w-0 items-center gap-1.5">
          <h1 className="shrink-0 font-display text-lg font-bold sm:text-xl">
            {t.encounters.title}
          </h1>
          {enc && (
            <>
              <span aria-hidden className="shrink-0 opacity-40">
                ›
              </span>
              <span className="inline-grid max-w-[45vw] items-center">
                <span
                  aria-hidden
                  className="invisible col-start-1 row-start-1 whitespace-pre px-1 font-display text-lg font-bold sm:text-xl"
                >
                  {enc.name || ' '}
                </span>
                <input
                  value={enc.name}
                  size={1}
                  onChange={(e) => updateEncounter(enc.id, { name: e.target.value })}
                  aria-label={t.encounters.rename}
                  className="col-start-1 row-start-1 w-full min-w-0 rounded bg-transparent px-1 py-0.5 font-display text-lg font-bold outline-none hover:bg-black/5 focus:bg-black/5 sm:text-xl dark:hover:bg-white/5 dark:focus:bg-white/5"
                />
              </span>
            </>
          )}
          {selScene && (
            <>
              <span aria-hidden className="shrink-0 opacity-40">
                ›
              </span>
              <span className="min-w-0 truncate text-sm opacity-70">
                {selScene.name}
              </span>
            </>
          )}
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)_minmax(0,0.6fr)_minmax(0,0.7fr)]">
          {/* Left: encounters, then the items of the selected one. */}
          <div
            className={`flex min-h-0 flex-col gap-3 ${sel ? 'hidden lg:flex' : 'flex'}`}
          >
            <div className="max-h-48 shrink-0 overflow-auto rounded border border-black/10 dark:border-white/10">
              <div className="sticky top-0 flex items-center gap-2 bg-black/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-wide opacity-70 backdrop-blur dark:bg-white/[0.06]">
                {t.encounters.lists}
                <button
                  onClick={newEncounter}
                  className="ml-auto text-blood hover:underline"
                >
                  {t.encounters.newEncounter}
                </button>
              </div>
              <ul className="divide-y divide-black/5 dark:divide-white/5">
                {encounters.map((e) => (
                  <li
                    key={e.id}
                    className={`flex items-center border-l-2 hover:bg-black/5 dark:hover:bg-white/5 ${
                      e.id === encId
                        ? 'border-blood bg-blood/10'
                        : 'border-transparent'
                    }`}
                  >
                    <button
                      onClick={() => setQuery({ e: e.id })}
                      className="flex flex-1 items-center gap-2 px-3 py-1.5 text-left text-sm"
                    >
                      <span className="truncate font-medium">{e.name}</span>
                      <span className="ml-auto shrink-0 text-xs opacity-50">
                        {e.scenes.length}
                      </span>
                    </button>
                    <button
                      onClick={() => dropEncounter(e.id)}
                      title={t.encounters.remove}
                      className="shrink-0 px-1.5 text-xs opacity-30 hover:text-red-500 hover:opacity-100"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {enc && (
              <SceneList
                encounter={enc}
                selected={selScene?.id}
                onSelect={(id) => setQuery({ e: enc.id, s: id })}
                onAdd={() => newScene(enc)}
                onRemove={(id) => {
                  removeScene(enc.id, id)
                  if (id === selScene?.id) setQuery({ e: enc.id })
                }}
              />
            )}

            {enc && selScene && (
              <ItemList
                scene={selScene}
                byKey={byKey}
                selected={sel}
                onSelect={(i) => setQuery({ e: enc.id, s: selScene.id, i })}
                onAdd={() => setPicking(true)}
                onRemove={(itemId) => removeSceneItem(enc.id, selScene.id, itemId)}
                onPatch={(itemId, patch) =>
                  updateSceneItem(enc.id, selScene.id, itemId, patch)
                }
                onReorder={(itemId, to) =>
                  reorderSceneItem(enc.id, selScene.id, itemId, to)
                }
              />
            )}

            <MusicPlayer
              playlistId={selScene?.playlistId}
              onSelect={(id) =>
                enc && selScene && setScenePlaylist(enc.id, selScene.id, id)
              }
              autoplayToken={selScene?.id}
            />
          </div>

          {/* Middle: the selected item's stat block, or the current scene. */}
          <div
            className={`min-h-0 flex-col rounded border border-black/10 dark:border-white/10 ${
              sel ? 'flex' : 'hidden lg:flex'
            }`}
          >
            <div className="min-h-0 flex-1 overflow-auto p-4">
              {enc &&
                (selItem ? (
                  <SingleItem item={selItem} byKey={byKey} />
                ) : selScene ? (
                  <SceneEditor
                    key={selScene.id}
                    scene={selScene}
                    onPatch={(patch) => updateScene(enc.id, selScene.id, patch)}
                  />
                ) : (
                  <p className="opacity-50">{t.encounters.noScenes}</p>
                ))}
            </div>
            {sel && (
              <button
                onClick={() => setQuery({ e: encId })}
                className="shrink-0 border-t border-black/10 bg-blood py-3 text-sm font-semibold text-white lg:hidden dark:border-white/10"
              >
                ← {t.back}
              </button>
            )}
          </div>

          {/* Right column: notes — the encounter's, plus the selected item's. */}
          {enc && (
            <div className="flex min-h-0 flex-col gap-4">
              <NotesBox
                label={t.encounters.notes}
                placeholder={t.encounters.notesPlaceholder}
                value={enc.notes ?? ''}
                onChange={(notes) => updateEncounter(enc.id, { notes })}
              />
              {selItem && (
                <NotesBox
                  label={`${t.encounters.notes} ${
                    selEntry ? resolveText(selEntry.name, lang) : selItem.key
                  }`}
                  placeholder={t.encounters.notePlaceholder}
                  value={selItem.note ?? ''}
                  onChange={(note) =>
                    selScene &&
                    updateSceneItem(enc.id, selScene.id, selItem.id, { note })
                  }
                />
              )}
            </div>
          )}

          {/* Far right: one card per copy in play, with its wound counter. */}
          {enc && selScene && (
            <CombatTracker
              scene={selScene}
              byKey={byKey}
              onWounds={(itemId, copy, wounds) =>
                setItemWounds(enc.id, selScene.id, itemId, copy, wounds)
              }
              onFatigue={(itemId, copy, fatigue) =>
                setItemFatigue(enc.id, selScene.id, itemId, copy, fatigue)
              }
              onMaxWounds={(itemId, copy, max) =>
                setItemMaxWounds(enc.id, selScene.id, itemId, copy, max)
              }
              onIncapacitated={(itemId, copy, value) =>
                setItemIncapacitated(enc.id, selScene.id, itemId, copy, value)
              }
              onToggleState={(itemId, copy, state) =>
                toggleItemState(enc.id, selScene.id, itemId, copy, state)
              }
              onShaken={(itemId, copy, shaken) =>
                setItemShaken(enc.id, selScene.id, itemId, copy, shaken)
              }
              onReset={() => resetWounds(enc.id, selScene.id)}
            />
          )}
        </div>

        {picking && selScene && (
          <EntryPicker
            onPick={pick}
            onClose={() => setPicking(false)}
            picked={new Set(selScene.items.map((i) => i.key))}
          />
        )}
      </div>
    </EntryWindowProvider>
  )
}

type EntryMap = Map<string, SourcedEntry>

/** Whether an entry is a Wild Card, across the shapes the field takes in data. */
function isWildCard(entry: SourcedEntry): boolean {
  const value = entry.fields?.wildCard
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return !/^\s*(n|f|0|—|-|$)/i.test(value)
  return Boolean(value)
}

function ItemList({
  scene,
  byKey,
  selected,
  onSelect,
  onAdd,
  onRemove,
  onPatch,
  onReorder,
}: {
  scene: Scene
  byKey: EntryMap
  selected?: string
  onSelect: (itemId: string) => void
  onAdd: () => void
  onRemove: (itemId: string) => void
  onPatch: (itemId: string, patch: Partial<Omit<EncounterItem, 'id'>>) => void
  onReorder: (itemId: string, toIndex: number) => void
}) {
  const { t } = useT()
  const lang = useContentLang()
  const listRef = useRef<HTMLUListElement>(null)
  const dragging = useRef<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)

  // Pointer-based reordering (works with mouse and touch): while the grip is
  // held, the dragged row swaps into whichever row the pointer is over.
  const beginDrag = (itemId: string) => (e: React.PointerEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    dragging.current = itemId
    setDragId(itemId)

    const onMove = (ev: PointerEvent) => {
      const id = dragging.current
      if (!id) return
      const rows = [...(listRef.current?.querySelectorAll('li[data-item]') ?? [])]
      const from = rows.findIndex((r) => r.getAttribute('data-item') === id)
      const to = rows.findIndex((r) => {
        const box = r.getBoundingClientRect()
        return ev.clientY >= box.top && ev.clientY <= box.bottom
      })
      if (to >= 0 && to !== from) onReorder(id, to)
    }
    const onUp = () => {
      dragging.current = null
      setDragId(null)
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', onUp)
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    document.addEventListener('pointercancel', onUp)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded border border-black/10 dark:border-white/10">
      <div className="flex shrink-0 items-center gap-2 border-b border-black/10 px-2 py-1.5 dark:border-white/10">
        <span className="min-w-0 flex-1 truncate px-1 font-display text-sm font-bold">
          {scene.name}
        </span>
        <button
          onClick={onAdd}
          className="shrink-0 rounded bg-blood px-2 py-1 text-xs font-semibold text-white"
        >
          {t.encounters.addItem}
        </button>
      </div>

      {scene.items.length === 0 ? (
        <p className="p-3 text-sm opacity-50">{t.encounters.noItems}</p>
      ) : (
        <ul
          ref={listRef}
          className="min-h-0 flex-1 divide-y divide-black/5 overflow-auto dark:divide-white/5"
        >
          {scene.items.map((item) => {
            const entry = byKey.get(item.key)
            return (
              <li
                key={item.id}
                data-item={item.id}
                className={`flex items-center border-l-2 hover:bg-black/5 dark:hover:bg-white/5 ${
                  item.id === selected
                    ? 'border-blood bg-blood/10'
                    : 'border-transparent'
                } ${item.id === dragId ? 'opacity-50' : ''}`}
              >
                <span
                  onPointerDown={beginDrag(item.id)}
                  title={t.encounters.reorder}
                  className="shrink-0 cursor-grab touch-none select-none px-1.5 py-1.5 text-xs opacity-25 hover:opacity-70 active:cursor-grabbing"
                >
                  ⠿
                </span>
                <button
                  onClick={() => onPatch(item.id, { starred: !item.starred })}
                  title={t.encounters.star}
                  aria-pressed={!!item.starred}
                  className={`shrink-0 px-0.5 ${
                    item.starred ? 'text-brass' : 'opacity-25 hover:opacity-70'
                  }`}
                >
                  <JokerIcon className="h-[18px] w-[18px]" />
                </button>
                <input
                  type="number"
                  min={1}
                  value={item.qty ?? 1}
                  onChange={(e) =>
                    onPatch(item.id, {
                      qty: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                  title={t.encounters.qty}
                  aria-label={t.encounters.qty}
                  className="w-9 shrink-0 rounded border border-black/10 bg-transparent px-1 py-0.5 text-center text-xs tabular-nums outline-none focus:border-blood dark:border-white/10"
                />
                <button
                  onClick={() => onSelect(item.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 py-1.5 pl-1 pr-2 text-left text-sm"
                >
                  <span
                    className={`truncate font-medium ${entry ? '' : 'opacity-40 line-through'}`}
                  >
                    {entry ? resolveText(entry.name, lang) : item.key}
                  </span>
                  {item.note && (
                    <span className="truncate text-xs opacity-50">· {item.note}</span>
                  )}
                  {entry && (
                    <span
                      style={sourceBadgeStyle(entry.sourceAbbrev)}
                      className="ml-auto shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium"
                    >
                      {entry.sourceAbbrev}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => onRemove(item.id)}
                  title={t.encounters.removeItem}
                  className="shrink-0 px-1.5 text-xs opacity-30 hover:text-red-500 hover:opacity-100"
                >
                  ✕
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/** A labelled notes box for the right-hand column. */
function NotesBox({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex min-h-[8rem] flex-1 flex-col overflow-hidden rounded border border-black/10 dark:border-white/10">
      <div className="shrink-0 border-b border-black/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide opacity-70 dark:border-white/10">
        {label}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full flex-1 resize-none bg-transparent p-3 text-sm outline-none"
      />
    </div>
  )
}

/** The full stat block of the selected item. */
function SingleItem({ item, byKey }: { item?: EncounterItem; byKey: EntryMap }) {
  const { t } = useT()
  if (!item) return <p className="opacity-50">{t.encounters.noItems}</p>
  return byKey.get(item.key) ? (
    <EntryView entryKey={item.key} />
  ) : (
    <p className="opacity-50">{t.encounters.unavailable}</p>
  )
}

/** Compact list of the encounter's scenes, above the item list. */
function SceneList({
  encounter,
  selected,
  onSelect,
  onAdd,
  onRemove,
}: {
  encounter: Encounter
  selected?: string
  onSelect: (sceneId: string) => void
  onAdd: () => void
  onRemove: (sceneId: string) => void
}) {
  const { t } = useT()
  return (
    <div className="max-h-40 shrink-0 overflow-auto rounded border border-black/10 dark:border-white/10">
      <div className="sticky top-0 flex items-center gap-2 bg-black/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-wide opacity-70 backdrop-blur dark:bg-white/[0.06]">
        {t.encounters.scenes}
        <button onClick={onAdd} className="ml-auto text-blood hover:underline">
          {t.encounters.newScene}
        </button>
      </div>
      {encounter.scenes.length === 0 ? (
        <p className="px-3 py-1.5 text-sm opacity-50">{t.encounters.noScenes}</p>
      ) : (
        <ul className="divide-y divide-black/5 dark:divide-white/5">
          {encounter.scenes.map((scene) => (
            <li
              key={scene.id}
              className={`flex items-center border-l-2 hover:bg-black/5 dark:hover:bg-white/5 ${
                scene.id === selected
                  ? 'border-blood bg-blood/10'
                  : 'border-transparent'
              }`}
            >
              <button
                onClick={() => onSelect(scene.id)}
                className="min-w-0 flex-1 truncate px-3 py-1.5 text-left text-sm"
              >
                {scene.name}
              </button>
              <button
                onClick={() => onRemove(scene.id)}
                title={t.encounters.removeScene}
                className="shrink-0 px-1.5 text-xs opacity-30 hover:text-red-500 hover:opacity-100"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** One scene: an editable name over a full-height page of text. */
function SceneEditor({
  scene,
  onPatch,
}: {
  scene: Scene
  onPatch: (patch: Partial<Pick<Scene, 'name' | 'text'>>) => void
}) {
  const { t } = useT()
  return (
    <div className="flex h-full flex-col gap-2">
      <input
        value={scene.name}
        onChange={(e) => onPatch({ name: e.target.value })}
        aria-label={t.encounters.sceneName}
        className="shrink-0 rounded bg-transparent px-1 py-0.5 font-display text-xl font-bold outline-none hover:bg-black/5 focus:bg-black/5 dark:hover:bg-white/5 dark:focus:bg-white/5"
      />
      <textarea
        value={scene.text ?? ''}
        onChange={(e) => onPatch({ text: e.target.value })}
        placeholder={t.encounters.pagePlaceholder}
        className="min-h-[24rem] w-full flex-1 resize-none rounded border border-black/10 bg-transparent p-3 leading-relaxed outline-none focus:border-blood dark:border-white/10"
      />
    </div>
  )
}
