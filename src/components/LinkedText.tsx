import { Fragment, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { useNameIndex, useContentLang, useT } from '@/hooks'
import { useLibrary } from '@/store/useLibrary'
import { resolveText } from '@/lib/localized'
import { sourceBadgeStyle } from '@/lib/sources'
import { categoryLabel } from '@/i18n/categories'
import type { SourcedEntry } from '@/types/entry'

/**
 * Renders plain text, auto-linking any substring that matches a known entry
 * name (in the current content language). Link target preference: an entry in
 * the SAME book as the current record first, then any Core-category book; never
 * other books. No markup is required in the JSON. `selfKey` avoids self-links.
 */
export function LinkedText({
  text,
  selfKey,
  sourceId,
}: {
  text: string
  selfKey?: string
  sourceId?: string
}): JSX.Element {
  const { regex, byName, coreBookIds } = useNameIndex()
  const lang = useContentLang()

  if (!regex || !text) return <>{text}</>

  const nodes: ReactNode[] = []
  regex.lastIndex = 0
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = regex.exec(text)) !== null) {
    const matchText = m[0]
    const start = m.index
    if (start > last) nodes.push(text.slice(last, start))

    const candidates = byName.get(matchText.toLowerCase()) ?? []
    const target =
      candidates.find((c) => sourceId && c.source === sourceId) ??
      candidates.find((c) => coreBookIds.has(c.source))

    // Only link when the occurrence starts with an uppercase letter
    // ("Agrupar" links, "capa" does not).
    const startsUpper = /^\p{Lu}/u.test(matchText)

    if (startsUpper && target && target.key !== selfKey) {
      nodes.push(
        <EntryLink key={i++} entry={target} label={matchText} lang={lang} />,
      )
    } else {
      nodes.push(matchText)
    }
    last = start + matchText.length
    if (matchText.length === 0) regex.lastIndex++
  }
  if (last < text.length) nodes.push(text.slice(last))

  return (
    <>
      {nodes.map((n, idx) => (
        <Fragment key={idx}>{n}</Fragment>
      ))}
    </>
  )
}

interface Pos {
  left: number
  top: number
  above: boolean
}

function EntryLink({
  entry,
  label,
  lang,
}: {
  entry: SourcedEntry
  label: string
  lang: string
}) {
  const { t } = useT()
  const navigate = useNavigate()
  const ignoreLink = useLibrary((s) => s.ignoreLink)
  const [pos, setPos] = useState<Pos | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const anchorRef = useRef<HTMLSpanElement>(null)

  const WIDTH = 288
  const summary = resolveText(entry.summary ?? entry.description, lang)

  function open() {
    window.clearTimeout(timer.current)
    const el = anchorRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const above = r.top > 200
    const left = Math.min(
      Math.max(8, r.left + r.width / 2 - WIDTH / 2),
      window.innerWidth - WIDTH - 8,
    )
    setPos({ left, top: above ? r.top - 6 : r.bottom + 6, above })
  }
  function scheduleClose() {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setPos(null), 160)
  }

  return (
    <span
      ref={anchorRef}
      className="relative inline"
      onMouseEnter={open}
      onMouseLeave={scheduleClose}
    >
      <Link
        to={`/entry/${encodeURIComponent(entry.key)}`}
        className="text-sky-700 underline decoration-dotted underline-offset-2 hover:decoration-solid dark:text-sky-300"
      >
        {label}
      </Link>
      {pos &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              left: pos.left,
              top: pos.top,
              width: WIDTH,
              transform: pos.above ? 'translateY(-100%)' : undefined,
            }}
            className="z-[100]"
            onMouseEnter={() => window.clearTimeout(timer.current)}
            onMouseLeave={scheduleClose}
          >
            <div className="rounded border border-black/10 bg-white p-2 text-left text-xs shadow-xl dark:border-white/15 dark:bg-[#1c1815]">
              <div className="flex gap-2">
                {entry.image && (
                  <img
                    src={entry.image}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded border border-black/10 object-cover dark:border-white/10"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        navigate(`/entry/${encodeURIComponent(entry.key)}`)
                        setPos(null)
                      }}
                      className="font-display font-semibold text-sky-700 hover:underline dark:text-sky-300"
                    >
                      {resolveText(entry.name, lang)}
                    </button>
                    <span
                      style={sourceBadgeStyle(entry.sourceAbbrev)}
                      className="ml-auto rounded px-1 text-[10px] font-medium"
                    >
                      {entry.sourceAbbrev}
                    </span>
                  </div>
                  <div className="mt-0.5 opacity-60">
                    {t.types[entry.type]}
                    {entry.category ? ` · ${categoryLabel(entry.category, lang)}` : ''}
                    {entry.rank ? ` · ${t.ranks[entry.rank]}` : ''}
                  </div>
                  {summary && (
                    <div className="mt-1 line-clamp-5 opacity-90">{summary}</div>
                  )}
                </div>
              </div>
              <div className="mt-1 flex justify-end border-t border-black/5 pt-1 dark:border-white/10">
                <button
                  onClick={() => {
                    ignoreLink(label)
                    setPos(null)
                  }}
                  className="text-[10px] opacity-50 hover:text-blood hover:opacity-100"
                  title={t.link.ignoreHint}
                >
                  {t.link.ignore}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </span>
  )
}
