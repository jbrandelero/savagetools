import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { EntryView } from './EntryView'
import { EntryWindowContext, type OpenEntry } from '@/hooks/entryWindows'
import { useContentLang, useResolvedEntries, useT } from '@/hooks'
import { resolveText } from '@/lib/localized'

interface WinState {
  /** Canonical entry key — also identifies the window within its context. */
  key: string
  x: number
  y: number
  w: number
  h: number
  /** Stacking order; the highest is on top. */
  z: number
}

/** Open windows per context id, so switching contexts hides and restores them. */
type Layouts = Record<string, WinState[]>

const MIN_W = 260
const MIN_H = 140

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), Math.max(lo, hi))
}

/** Cascading default geometry for the n-th window of a context. */
function defaultGeom(n: number): Omit<WinState, 'key' | 'z'> {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const w = Math.min(400, vw - 24)
  const h = Math.min(460, vh - 120)
  const step = 28 * (n % 6)
  return {
    w,
    h,
    x: clamp(Math.round(vw * 0.32) + step, 8, vw - w - 8),
    y: clamp(90 + step, 8, vh - h - 8),
  }
}

/**
 * Makes every auto-linked reference below it open in a floating window instead
 * of navigating away. Windows never block the page: several can be open at
 * once, each draggable and resizable. Windows belong to `contextId` — changing
 * it puts them away, and coming back reopens them where they were left.
 */
export function EntryWindowProvider({
  contextId,
  children,
}: {
  contextId: string
  children: ReactNode
}) {
  const [layouts, setLayouts] = useState<Layouts>({})
  const windows = layouts[contextId] ?? []

  const open = useCallback<OpenEntry>(
    (key) => {
      setLayouts((prev) => {
        const list = prev[contextId] ?? []
        const top = list.reduce((m, w) => Math.max(m, w.z), 0) + 1
        // Already open in this context: raise it instead of duplicating.
        const next = list.some((w) => w.key === key)
          ? list.map((w) => (w.key === key ? { ...w, z: top } : w))
          : [...list, { key, z: top, ...defaultGeom(list.length) }]
        return { ...prev, [contextId]: next }
      })
    },
    [contextId],
  )

  const patch = useCallback(
    (key: string, geom: Partial<WinState>) => {
      setLayouts((prev) => ({
        ...prev,
        [contextId]: (prev[contextId] ?? []).map((w) =>
          w.key === key ? { ...w, ...geom } : w,
        ),
      }))
    },
    [contextId],
  )

  const focus = useCallback(
    (key: string) => {
      setLayouts((prev) => {
        const list = prev[contextId] ?? []
        const top = list.reduce((m, w) => Math.max(m, w.z), 0)
        if (list.find((w) => w.key === key)?.z === top) return prev
        return {
          ...prev,
          [contextId]: list.map((w) => (w.key === key ? { ...w, z: top + 1 } : w)),
        }
      })
    },
    [contextId],
  )

  const close = useCallback(
    (key: string) => {
      setLayouts((prev) => ({
        ...prev,
        [contextId]: (prev[contextId] ?? []).filter((w) => w.key !== key),
      }))
    },
    [contextId],
  )

  // Escape closes the topmost window of the current context.
  useEffect(() => {
    if (windows.length === 0) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const top = windows.reduce((a, b) => (b.z > a.z ? b : a))
      close(top.key)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [windows, close])

  return (
    <EntryWindowContext.Provider value={open}>
      {children}
      {windows.length > 0 &&
        createPortal(
          <>
            {windows.map((win) => (
              <EntryWindow
                key={win.key}
                win={win}
                onFocus={() => focus(win.key)}
                onClose={() => close(win.key)}
                onGeom={(g) => patch(win.key, g)}
              />
            ))}
          </>,
          document.body,
        )}
    </EntryWindowContext.Provider>
  )
}

type DragMode = 'move' | 'resize'

function EntryWindow({
  win,
  onFocus,
  onClose,
  onGeom,
}: {
  win: WinState
  onFocus: () => void
  onClose: () => void
  onGeom: (geom: Partial<WinState>) => void
}) {
  const { t } = useT()
  const lang = useContentLang()
  const entries = useResolvedEntries()
  /** Tears down the listeners of an in-flight drag (also on unmount). */
  const stopDrag = useRef<(() => void) | null>(null)

  const entry = entries.find((e) => e.key === win.key)
  const title = entry ? resolveText(entry.name, lang) : win.key

  useEffect(() => () => stopDrag.current?.(), [])

  // Drag/resize track the pointer on `document`, so releasing outside the
  // window (or off-screen) always ends the gesture.
  const begin = (mode: DragMode) => (e: React.PointerEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    onFocus()
    stopDrag.current?.()
    const px = e.clientX
    const py = e.clientY
    const { x, y, w, h } = win

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - px
      const dy = ev.clientY - py
      if (mode === 'move') {
        // Keep a grabbable strip on screen instead of pinning the whole window.
        onGeom({
          x: clamp(x + dx, 8 - w + 80, window.innerWidth - 80),
          y: clamp(y + dy, 0, window.innerHeight - 40),
        })
      } else {
        onGeom({ w: Math.max(MIN_W, w + dx), h: Math.max(MIN_H, h + dy) })
      }
    }
    const onUp = () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', onUp)
      stopDrag.current = null
    }
    stopDrag.current = onUp
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    document.addEventListener('pointercancel', onUp)
  }

  return (
    <div
      style={{ left: win.x, top: win.y, width: win.w, height: win.h, zIndex: 80 + win.z }}
      onPointerDown={onFocus}
      className="fixed flex flex-col overflow-hidden rounded-lg border border-black/15 bg-parchment shadow-2xl dark:border-white/15 dark:bg-[#1c1815]"
    >
      <div
        onPointerDown={begin('move')}
        className="flex shrink-0 cursor-move touch-none select-none items-center gap-2 border-b border-black/10 bg-black/[0.04] px-2 py-1.5 dark:border-white/10 dark:bg-white/[0.06]"
      >
        <span className="truncate font-display text-sm font-semibold">{title}</span>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onClose}
          aria-label={t.encounters.close}
          title={t.encounters.close}
          className="ml-auto rounded px-1.5 leading-none hover:bg-black/10 dark:hover:bg-white/10"
        >
          ✕
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        <EntryView entryKey={win.key} />
      </div>

      <div
        onPointerDown={begin('resize')}
        className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize touch-none select-none"
        style={{
          background:
            'linear-gradient(135deg, transparent 50%, currentColor 50%, currentColor 60%, transparent 60%, transparent 70%, currentColor 70%, currentColor 80%, transparent 80%)',
          opacity: 0.35,
        }}
      />
    </div>
  )
}
