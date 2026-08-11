import { useState } from 'react'
import { VariationPicker } from './VariationPicker'
import { FavoriteStar } from './FavoriteStar'
import { EntryEditor } from './EntryEditor'
import { useGroups, useResolvedEntries, useContentLang, useT, useSourceName } from '@/hooks'
import { useLibrary, EXAMPLE_ID } from '@/store/useLibrary'
import { resolveText } from '@/lib/localized'
import { sourceBadgeStyle } from '@/lib/sources'
import { categoryLabel } from '@/i18n/categories'
import { softBreaks, splitOutModifiers, splitModifiers } from '@/lib/powerBuild'
import { LinkedText } from './LinkedText'

/**
 * Full detail / stat block for one game object, resolved by canonical `key`.
 * Shared by the browse right-pane and the standalone /entry/:key route.
 */
export function EntryView({ entryKey }: { entryKey: string }) {
  const groups = useGroups()
  const resolved = useResolvedEntries()
  const lang = useContentLang()
  const { t } = useT()
  const sourceName = useSourceName()
  const deleteEntry = useLibrary((s) => s.deleteEntry)
  const books = useLibrary((s) => s.books)
  const [editing, setEditing] = useState(false)

  const group = groups.get(entryKey)
  const entry = resolved.find((e) => e.key === entryKey)

  if (!group || !entry) {
    return <p className="opacity-60">{t.browse.empty}</p>
  }

  const name = resolveText(entry.name, lang)
  const requirements = softBreaks(resolveText(entry.requirements, lang))
  const fullDescription = softBreaks(resolveText(entry.description, lang))
  const { body: description, mods: modifiersText } =
    splitOutModifiers(fullDescription)
  const modifierItems = splitModifiers(modifiersText)

  return (
    <article className="space-y-4">
      <header className="space-y-1 border-b border-black/10 pb-2 dark:border-white/10">
        <div className="flex flex-wrap items-center gap-2">
          <FavoriteStar entryKey={entry.key} className="text-2xl" />
          <h1 className="font-display text-2xl font-bold text-blood">{name}</h1>
          {entry.rank && (
            <span className="rounded bg-brass/20 px-2 py-0.5 text-xs uppercase tracking-wide">
              {t.ranks[entry.rank]}
            </span>
          )}
          <span
            style={sourceBadgeStyle(entry.sourceAbbrev)}
            title={sourceName(entry.sourceAbbrev)}
            className="rounded px-1.5 py-0.5 text-[11px] font-medium"
          >
            {entry.sourceAbbrev}
            {entry.page ? ` ${t.entry.page}${entry.page}` : ''}
          </span>
          {entry.source !== EXAMPLE_ID && (
            <span className="ml-auto flex items-center gap-2 text-xs">
              <button onClick={() => setEditing(true)} className="text-blood hover:underline">
                {t.editor.editItem}
              </button>
              <button
                onClick={() => {
                  if (confirm(t.editor.deleteConfirm)) deleteEntry(entry.source, entry.id)
                }}
                className="opacity-50 hover:text-red-500 hover:opacity-100"
              >
                {t.editor.delete}
              </button>
            </span>
          )}
        </div>
        <p className="text-sm opacity-60">
          {t.types[entry.type]}
          {entry.category ? ` · ${categoryLabel(entry.category, lang)}` : ''}
        </p>
      </header>

      {entry.image && (
        <img
          src={entry.image}
          alt={name}
          className="max-h-56 w-auto max-w-full rounded border border-black/10 object-contain dark:border-white/10"
        />
      )}

      <VariationPicker group={group} currentSource={entry.source} />

      {requirements && (
        <section>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide opacity-70">
            {t.entry.requirements}
          </h2>
          <p>
            <LinkedText text={requirements} selfKey={entry.key} sourceId={entry.source} />
          </p>
        </section>
      )}

      {description && (
        <section className="space-y-2 leading-relaxed">
          {splitProse(description).map((para, i) => {
            const m = para.match(/^([A-ZÀ-Ú][^:]{1,34}):\s+([\s\S]*)$/)
            return (
              <p key={i}>
                {m ? (
                  <>
                    <strong className="font-semibold">{m[1]}:</strong>{' '}
                    <LinkedText text={m[2]} selfKey={entry.key} sourceId={entry.source} />
                  </>
                ) : (
                  <LinkedText text={para} selfKey={entry.key} sourceId={entry.source} />
                )}
              </p>
            )
          })}
        </section>
      )}

      {modifierItems.length > 0 && (
        <section>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide opacity-70">
            {t.entry.modifiers}
          </h2>
          <ul className="mt-1 space-y-1">
            {modifierItems.map((item, i) => {
              const m = item.match(/^([\s\S]*?\([+\-][^)]*\))\s*:?\s*([\s\S]*)$/)
              return (
                <li key={i} className="flex gap-2 text-sm leading-relaxed">
                  <span className="select-none text-brass">▸</span>
                  <span>
                    {m ? (
                      <>
                        <strong className="font-semibold">{m[1]}</strong>{' '}
                        <LinkedText text={m[2]} selfKey={entry.key} sourceId={entry.source} />
                      </>
                    ) : (
                      <LinkedText text={item} selfKey={entry.key} sourceId={entry.source} />
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <FieldTable
        fields={entry.fields}
        lang={lang}
        selfKey={entry.key}
        sourceId={entry.source}
      />

      {editing && (
        <EntryEditor
          initial={books[entry.source]?.entries.find((e) => e.id === entry.id) ?? entry}
          defaultBookId={entry.source}
          onClose={() => setEditing(false)}
        />
      )}
    </article>
  )
}

/**
 * Break a run-on description into readable paragraphs: at explicit line breaks,
 * before inline "Label:" sub-rules, and by grouping sentences in long walls.
 */
function splitProse(text: string): string[] {
  const t = softBreaks(text).trim()
  if (!t) return []
  const out: string[] = []
  for (const raw of t.split(/\n+/)) {
    // Break before a capitalized "Label:" that starts after a sentence end.
    const segments = raw.split(
      /(?<=[.!?"”)])\s+(?=[A-ZÀ-Ú][^.:!?]{1,34}:\s)/u,
    )
    for (const seg of segments) {
      const s = seg.trim()
      if (!s) continue
      const hasLabel = /^[A-ZÀ-Ú][^:]{1,34}:\s/.test(s)
      if (hasLabel || s.length <= 300) {
        out.push(s)
        continue
      }
      // Long unlabeled wall: group into paragraphs of two sentences.
      const sentences = s.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ú"“])/u)
      for (let i = 0; i < sentences.length; i += 2) {
        out.push(sentences.slice(i, i + 2).join(' ').trim())
      }
    }
  }
  return out.filter(Boolean)
}

/** Split a special-abilities blob into "Label: text" items for list rendering. */
function splitAbilities(text: string): string[] {
  const t = softBreaks(text).trim()
  if (!t) return []
  // Prefer explicit line breaks / bullets.
  let parts = t
    .split(/\n+|(?:^|\s)[•·]\s*/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (parts.length > 1) return parts
  // Otherwise split before a "Capitalized Label (…):" that starts an ability.
  parts = t
    .split(/(?=(?:[A-ZÀ-Ú][\wÀ-ÿ'/-]*(?:\s[\wÀ-ÿ'/()+-]+){0,4})\s*(?:\([^)]*\))?\s*:)/u)
    .map((s) => s.trim())
    .filter(Boolean)
  return parts
}

function FieldTable({
  fields,
  lang,
  selfKey,
  sourceId,
}: {
  fields?: Record<string, unknown>
  lang: string
  selfKey?: string
  sourceId?: string
}) {
  const { t } = useT()
  const fieldLabel = (k: string) =>
    (t.fields as Record<string, string>)[k] ??
    k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
  if (!fields || Object.keys(fields).length === 0) return null
  const entries = Object.entries(fields)
  const special = fields.specialAbilities
  const rows = entries.filter(([k]) => k !== 'specialAbilities')

  const abilityItems =
    special != null
      ? splitAbilities(resolveText(special as Record<string, string>, lang))
      : []

  return (
    <div className="space-y-3">
      {rows.length > 0 && (
        <table className="w-full max-w-md border-collapse text-sm">
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k} className="border-b border-black/10 dark:border-white/10">
                <th className="py-1 pr-4 text-left align-top font-medium opacity-70">
                  {fieldLabel(k)}
                </th>
                <td className="py-1 whitespace-pre-line">
                  <LinkedText
                    text={formatValue(v, lang)}
                    selfKey={selfKey}
                    sourceId={sourceId}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {abilityItems.length > 0 && (
        <section>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide opacity-70">
            {fieldLabel('specialAbilities')}
          </h2>
          <ul className="mt-1 space-y-1">
            {abilityItems.map((item, i) => {
              const m = item.match(/^([^:]{1,48}):\s*([\s\S]*)$/)
              return (
                <li key={i} className="flex gap-2 text-sm leading-relaxed">
                  <span className="select-none text-brass">▸</span>
                  <span>
                    {m ? (
                      <>
                        <strong className="font-semibold">
                          <LinkedText text={m[1]} selfKey={selfKey} sourceId={sourceId} />
                        </strong>
                        {m[2] ? (
                          <>
                            :{' '}
                            <LinkedText text={m[2]} selfKey={selfKey} sourceId={sourceId} />
                          </>
                        ) : (
                          ''
                        )}
                      </>
                    ) : (
                      <LinkedText text={item} selfKey={selfKey} sourceId={sourceId} />
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}

function formatValue(v: unknown, lang: string): string {
  if (v == null) return '—'
  if (typeof v === 'boolean') return v ? '✔' : '—'
  if (Array.isArray(v)) return v.join(', ')
  if (typeof v === 'object') return resolveText(v as Record<string, string>, lang)
  return String(v)
}
