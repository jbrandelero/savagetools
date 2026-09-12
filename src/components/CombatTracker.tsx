import { JokerIcon, ShakenIcon } from './icons'
import { useContentLang, useT } from '@/hooks'
import { resolveText } from '@/lib/localized'
import type { Scene } from '@/store/useLibrary'
import type { SourcedEntry } from '@/types/entry'

/** Wounds a combatant can take before going down: Wild Cards last longer. */
const WILD_CARD_WOUNDS = 3
const EXTRA_WOUNDS = 1

/**
 * Combat column: one card per copy in play (an item with qty 3 yields three
 * cards), each with a wound counter sized for what it is — one wound puts an
 * Extra out, a Wild Card takes three.
 */
export function CombatTracker({
  scene,
  byKey,
  onWounds,
  onShaken,
  onReset,
}: {
  scene: Scene
  byKey: Map<string, SourcedEntry>
  onWounds: (itemId: string, copy: number, wounds: number) => void
  onShaken: (itemId: string, copy: number, shaken: boolean) => void
  onReset: () => void
}) {
  const { t } = useT()
  const lang = useContentLang()

  const cards = scene.items.flatMap((item) => {
    const entry = byKey.get(item.key)
    const name = entry ? resolveText(entry.name, lang) : item.key
    const max = item.starred ? WILD_CARD_WOUNDS : EXTRA_WOUNDS
    const copies = Math.max(1, item.qty ?? 1)
    return Array.from({ length: copies }, (_, copy) => ({
      id: `${item.id}:${copy}`,
      itemId: item.id,
      copy,
      label: copies > 1 ? `${name} ${copy + 1}` : name,
      starred: !!item.starred,
      max,
      wounds: item.wounds?.[copy] ?? 0,
      shaken: !!item.shaken?.[copy],
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
            const down = card.wounds >= card.max
            return (
              <li
                key={card.id}
                className={`rounded border px-2 py-1.5 ${
                  down
                    ? 'border-blood/40 bg-blood/10'
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
                </div>
                <div className="mt-1 flex items-center gap-1">
                  <button
                    onClick={() => onShaken(card.itemId, card.copy, !card.shaken)}
                    title={t.combat.shaken}
                    aria-label={t.combat.shaken}
                    aria-pressed={card.shaken}
                    className={`mr-1 shrink-0 ${
                      card.shaken
                        ? 'text-brass'
                        : 'opacity-25 hover:opacity-70'
                    }`}
                  >
                    <ShakenIcon className="h-[22px] w-[22px]" />
                  </button>
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
                        className={`h-4 w-4 rounded-full border text-[10px] leading-none ${
                          filled
                            ? 'border-blood bg-blood text-white'
                            : 'border-black/25 hover:border-blood dark:border-white/25'
                        }`}
                      >
                        {filled ? '✕' : ''}
                      </button>
                    )
                  })}
                  {down && (
                    <span className="ml-1 text-[11px] font-semibold uppercase tracking-wide text-blood">
                      {t.combat.down}
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
