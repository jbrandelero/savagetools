import { DeadIcon, JokerIcon, ShakenIcon, StatesIcon } from './icons'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useContentLang, useT } from '@/hooks'
import { resolveText } from '@/lib/localized'
import type { Dict } from '@/i18n'
import type { Scene } from '@/store/useLibrary'
import type { SourcedEntry } from '@/types/entry'

/** Default size of a wound track: Wild Cards last longer than Extras. */
const WILD_CARD_WOUNDS = 3
const EXTRA_WOUNDS = 1

/** Fatigue runs to two levels for everyone. */
const FATIGUE_LEVELS = 2

/**
 * States a combatant can pick up in play. Shaken and Incapacitated have their
 * own buttons on the card, so they are not repeated here.
 */
const STATE_IDS = [
  'distracted',
  'vulnerable',
  'stunned',
  'entangled',
  'bound',
  'prone',
  'bleeding',
] as const

/**
 * Combat column: one card per copy in play (an item with qty 3 yields three
 * cards), each with a wound counter sized for what it is — one wound puts an
 * Extra out, a Wild Card takes three.
 */
export function CombatTracker({
  scene,
  byKey,
  onWounds,
  onFatigue,
  onMaxWounds,
  onIncapacitated,
  onToggleState,
  onShaken,
  onReset,
}: {
  scene: Scene
  byKey: Map<string, SourcedEntry>
  onWounds: (itemId: string, copy: number, wounds: number) => void
  onFatigue: (itemId: string, copy: number, fatigue: number) => void
  onMaxWounds: (itemId: string, copy: number, max: number) => void
  onIncapacitated: (itemId: string, copy: number, value: boolean) => void
  onToggleState: (itemId: string, copy: number, state: string) => void
  onShaken: (itemId: string, copy: number, shaken: boolean) => void
  onReset: () => void
}) {
  const { t } = useT()
  const lang = useContentLang()

  const cards = scene.items.flatMap((item) => {
    const entry = byKey.get(item.key)
    const name = entry ? resolveText(entry.name, lang) : item.key
    const fallback = item.starred ? WILD_CARD_WOUNDS : EXTRA_WOUNDS
    const copies = Math.max(1, item.qty ?? 1)
    return Array.from({ length: copies }, (_, copy) => ({
      id: `${item.id}:${copy}`,
      itemId: item.id,
      copy,
      label: copies > 1 ? `${name} ${copy + 1}` : name,
      starred: !!item.starred,
      max: item.maxWounds?.[copy] || fallback,
      wounds: item.wounds?.[copy] ?? 0,
      fatigue: item.fatigue?.[copy] ?? 0,
      shaken: !!item.shaken?.[copy],
      incapacitated: !!item.incapacitated?.[copy],
      states: item.states?.[copy] ?? [],
    }))
  })

  return (
    <div className="flex min-h-0 flex-col rounded border border-black/10 dark:border-white/10">
      <div className="flex shrink-0 items-center gap-2 border-b border-black/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide opacity-70 dark:border-white/10">
        {t.combat.title}
        {cards.length > 0 && (
          <button
            onClick={onReset}
            className="ml-auto font-normal normal-case text-blood hover:underline"
          >
            {t.combat.reset}
          </button>
        )}
      </div>

      {cards.length === 0 ? (
        <p className="p-3 text-sm opacity-50">{t.combat.empty}</p>
      ) : (
        <ul className="min-h-0 flex-1 space-y-1.5 overflow-auto p-2">
          {cards.map((card) => {
            // Only the Incapacitated mark puts a combatant out; a full wound
            // track on its own does not.
            const down = card.incapacitated
            return (
              <li
                key={card.id}
                className={`rounded border px-2 py-1.5 ${
                  down
                    ? 'border-blood/40 bg-blood/10'
                    : card.shaken
                      ? 'border-brass/60 bg-brass/10'
                      : 'border-black/10 dark:border-white/10'
                }`}
              >
                <div className="flex items-center gap-1">
                  {card.starred && (
                    <JokerIcon className="h-[18px] w-[18px] shrink-0 text-brass" />
                  )}
                  <span
                    className={`min-w-0 flex-1 truncate text-sm font-medium ${
                      down ? 'line-through opacity-60' : ''
                    }`}
                  >
                    {card.label}
                  </span>
                  <span className="ml-auto flex shrink-0 items-center gap-1">
                    <StatesButton
                      active={card.states}
                      onPick={(state) => onToggleState(card.itemId, card.copy, state)}
                    />
                    <button
                      onClick={() => onShaken(card.itemId, card.copy, !card.shaken)}
                      title={t.combat.shaken}
                      aria-label={t.combat.shaken}
                      aria-pressed={card.shaken}
                      className={
                        card.shaken ? 'text-brass' : 'opacity-25 hover:opacity-70'
                      }
                    >
                      <ShakenIcon className="h-[22px] w-[22px]" />
                    </button>
                    <button
                      onClick={() =>
                        onIncapacitated(card.itemId, card.copy, !card.incapacitated)
                      }
                      title={t.combat.incapacitated}
                      aria-label={t.combat.incapacitated}
                      aria-pressed={card.incapacitated}
                      className={
                        card.incapacitated
                          ? 'text-blood'
                          : 'opacity-25 hover:opacity-70'
                      }
                    >
                      <DeadIcon className="h-[22px] w-[22px]" />
                    </button>
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1">
                  {Array.from({ length: FATIGUE_LEVELS }, (_, i) => {
                    const filled = card.fatigue > i
                    return (
                      <button
                        key={`f${i}`}
                        // Clicking the last filled level takes one back off.
                        onClick={() =>
                          onFatigue(
                            card.itemId,
                            card.copy,
                            card.fatigue === i + 1 ? i : i + 1,
                          )
                        }
                        title={`${t.combat.fatigue} ${i + 1}`}
                        aria-label={`${t.combat.fatigue} ${i + 1}`}
                        aria-pressed={filled}
                        className={`h-[22px] w-[22px] rounded-full border text-xs leading-none ${
                          filled
                            ? 'border-brass bg-brass text-ink'
                            : 'border-black/25 hover:border-brass dark:border-white/25'
                        }`}
                      >
                        {filled ? '✕' : ''}
                      </button>
                    )
                  })}
                  <span aria-hidden className="mx-0.5 h-4 w-px bg-current opacity-20" />
                  {Array.from({ length: card.max }, (_, i) => {
                    const filled = card.wounds > i
                    return (
                      <button
                        key={i}
                        // Clicking the last filled pip heals back one wound.
                        onClick={() =>
                          onWounds(
                            card.itemId,
                            card.copy,
                            card.wounds === i + 1 ? i : i + 1,
                          )
                        }
                        title={`${t.combat.wound} ${i + 1}`}
                        aria-label={`${t.combat.wound} ${i + 1}`}
                        aria-pressed={filled}
                        className={`h-[22px] w-[22px] rounded-full border text-xs leading-none ${
                          filled
                            ? 'border-blood bg-blood text-white'
                            : 'border-black/25 hover:border-blood dark:border-white/25'
                        }`}
                      >
                        {filled ? '✕' : ''}
                      </button>
                    )
                  })}
                  {/* Track size lives in its own corner, clear of the pips. */}
                  <span className="ml-auto flex shrink-0 items-center">
                    <button
                      onClick={() => onMaxWounds(card.itemId, card.copy, card.max - 1)}
                      disabled={card.max <= 1}
                      title={t.combat.fewerWounds}
                      aria-label={t.combat.fewerWounds}
                      className="rounded px-1 leading-none hover:bg-black/10 disabled:opacity-20 dark:hover:bg-white/10"
                    >
                      −
                    </button>
                    <button
                      onClick={() => onMaxWounds(card.itemId, card.copy, card.max + 1)}
                      title={t.combat.moreWounds}
                      aria-label={t.combat.moreWounds}
                      className="rounded px-1 leading-none hover:bg-black/10 dark:hover:bg-white/10"
                    >
                      +
                    </button>
                  </span>
                </div>
                {card.states.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {card.states.map((state) => (
                      <button
                        key={state}
                        onClick={() => onToggleState(card.itemId, card.copy, state)}
                        title={t.combat.removeState}
                        className="rounded-full border border-brass/50 bg-brass/15 px-1.5 py-0.5 text-[11px] leading-none text-brass hover:border-blood hover:text-blood"
                      >
                        {stateLabel(t, state)}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/** Label for a state id, falling back to the raw id for unknown ones. */
function stateLabel(t: Dict, state: string): string {
  return (t.combat.states as Record<string, string>)[state] ?? state
}

/** Handle + dropdown for the states a combatant can pick up mid-fight. */
function StatesButton({
  active,
  onPick,
}: {
  active: string[]
  onPick: (state: string) => void
}) {
  const { t } = useT()
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  const anchor = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)

  const WIDTH = 160

  useEffect(() => {
    if (!pos) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (!anchor.current?.contains(target) && !menu.current?.contains(target))
        setPos(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPos(null)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [pos])

  // Fixed positioning keeps the menu out of the column's own scroll clipping.
  const open = () => {
    const box = anchor.current?.getBoundingClientRect()
    if (!box) return
    setPos({
      left: Math.min(box.left, window.innerWidth - WIDTH - 8),
      top: box.bottom + 4,
    })
  }

  return (
    <>
      <button
        ref={anchor}
        onClick={() => (pos ? setPos(null) : open())}
        title={t.combat.addState}
        aria-label={t.combat.addState}
        aria-expanded={!!pos}
        className={active.length > 0 ? 'text-brass' : 'opacity-25 hover:opacity-70'}
      >
        <StatesIcon className="h-[22px] w-[22px]" />
      </button>
      {pos &&
        createPortal(
          <div
            ref={menu}
            style={{ position: 'fixed', left: pos.left, top: pos.top, width: WIDTH }}
            className="z-[90] overflow-hidden rounded border border-black/15 bg-parchment py-1 text-sm shadow-xl dark:border-white/15 dark:bg-[#1c1815]"
          >
            {STATE_IDS.map((state) => (
              <button
                key={state}
                onClick={() => onPick(state)}
                className="flex w-full items-center gap-2 px-2 py-1 text-left hover:bg-black/5 dark:hover:bg-white/10"
              >
                <span className="w-3 shrink-0 text-brass">
                  {active.includes(state) ? '✓' : ''}
                </span>
                {stateLabel(t, state)}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}
