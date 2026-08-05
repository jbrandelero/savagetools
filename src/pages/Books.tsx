import { useRef, useState } from 'react'
import { useLibrary } from '@/store/useLibrary'
import { useT, useVisibleManifest } from '@/hooks'
import { EXAMPLE_BOOK } from '@/data/exampleBook'
import { Disclaimer } from '@/components/Disclaimer'
import { langBadge } from '@/i18n'
import { downloadText } from '@/lib/download'

export function Books() {
  const { t } = useT()
  const manifest = useVisibleManifest()
  const books = useLibrary((s) => s.books)
  const origins = useLibrary((s) => s.origins)
  const activeBookIds = useLibrary((s) => s.activeBookIds)
  const toggleBook = useLibrary((s) => s.toggleBook)
  const addBook = useLibrary((s) => s.addBook)
  const removeBook = useLibrary((s) => s.removeBook)
  const createBook = useLibrary((s) => s.createBook)
  const exportBook = useLibrary((s) => s.exportBook)

  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [nbTitle, setNbTitle] = useState('')
  const [nbAbbrev, setNbAbbrev] = useState('')
  const [nbLangs, setNbLangs] = useState<string[]>(['pt-BR'])

  function submitCreate() {
    const title = nbTitle.trim()
    if (!title) return
    createBook({ title, abbrev: nbAbbrev.trim(), languages: nbLangs })
    setNbTitle('')
    setNbAbbrev('')
    setNbLangs(['pt-BR'])
    setShowCreate(false)
  }
  const download = (id: string) =>
    downloadText(`${id}.json`, exportBook(id))

  async function copyExample() {
    try {
      await navigator.clipboard.writeText(EXAMPLE_BOOK)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError(null)
    setBusy(true)
    try {
      for (const file of Array.from(files)) {
        const text = await file.text()
        let parsed: unknown
        try {
          parsed = JSON.parse(text)
        } catch {
          throw new Error(`${file.name}: ${t.books.uploadBadJson}`)
        }
        await addBook(parsed)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold">{t.books.title}</h1>
          <p className="text-sm opacity-60">{t.books.enableHint}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            multiple
            hidden
            onChange={(e) => onFiles(e.target.files)}
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreate((v) => !v)}
              className="rounded border border-blood px-3 py-1.5 text-sm text-blood hover:bg-blood/10"
            >
              {t.books.newBook}
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="rounded bg-blood px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50"
            >
              {busy ? t.loading : t.books.upload}
            </button>
          </div>
          <span className="text-[11px] opacity-50">{t.books.uploadHint}</span>
        </div>
      </div>

      {showCreate && (
        <div className="flex flex-wrap items-end gap-2 rounded border border-brass/40 bg-brass/5 p-3">
          <label className="text-xs">
            <span className="mb-0.5 block opacity-60">{t.books.fTitle}</span>
            <input
              value={nbTitle}
              onChange={(e) => setNbTitle(e.target.value)}
              className="w-52 rounded border border-black/15 bg-white px-2 py-1 text-sm dark:border-white/15 dark:bg-black/30"
            />
          </label>
          <label className="text-xs">
            <span className="mb-0.5 block opacity-60">{t.books.fAbbrev}</span>
            <input
              value={nbAbbrev}
              onChange={(e) => setNbAbbrev(e.target.value)}
              className="w-20 rounded border border-black/15 bg-white px-2 py-1 text-sm dark:border-white/15 dark:bg-black/30"
            />
          </label>
          <div className="text-xs">
            <span className="mb-0.5 block opacity-60">{t.books.fLangs}</span>
            <div className="flex gap-1">
              {['pt-BR', 'en'].map((code) => (
                <button
                  key={code}
                  onClick={() =>
                    setNbLangs((s) =>
                      s.includes(code) ? s.filter((x) => x !== code) : [...s, code],
                    )
                  }
                  className={`rounded px-2 py-1 ${
                    nbLangs.includes(code)
                      ? 'bg-blood text-white'
                      : 'bg-black/5 dark:bg-white/10'
                  }`}
                >
                  {langBadge([code])}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={submitCreate}
            className="rounded bg-blood px-3 py-1.5 text-sm text-white hover:opacity-90"
          >
            {t.books.create}
          </button>
        </div>
      )}

      <Disclaimer dismissible={false} />

      {error && (
        <p className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <details className="rounded border border-black/10 bg-black/[0.03] px-3 py-2 text-sm dark:border-white/10 dark:bg-white/[0.04]">
        <summary className="cursor-pointer font-medium">
          {t.books.howToTitle}
        </summary>
        <div className="mt-2 space-y-2">
          <p className="opacity-80">{t.books.howToIntro}</p>
          <div className="flex justify-end">
            <button
              onClick={copyExample}
              className="rounded border border-black/15 px-2 py-0.5 text-xs hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
            >
              {copied ? t.books.howToCopied : t.books.howToCopy}
            </button>
          </div>
          <pre className="max-h-96 overflow-auto rounded bg-black/80 p-3 text-[11px] leading-relaxed text-green-100">
            <code>{EXAMPLE_BOOK}</code>
          </pre>
        </div>
      </details>

      <details className="rounded border border-black/10 bg-black/[0.03] px-3 py-2 text-sm dark:border-white/10 dark:bg-white/[0.04]">
        <summary className="cursor-pointer font-medium">
          {t.books.whereTitle}
        </summary>
        <p className="mt-2 opacity-80">{t.books.whereText}</p>
      </details>

      {manifest.length === 0 ? (
        <p className="opacity-60">{t.books.empty}</p>
      ) : (
        <ul className="space-y-2">
          {manifest.map((m) => {
            const active = activeBookIds.includes(m.id)
            const count = books[m.id]?.entries.length ?? 0
            const cover = books[m.id]?.cover ?? m.cover
            const userAdded = origins[m.id] === 'user'
            return (
              <li
                key={m.id}
                className="flex items-center justify-between gap-3 rounded border border-black/10 bg-white/50 p-3 dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  {cover && (
                    <img
                      src={cover}
                      alt=""
                      className="h-20 w-auto rounded border border-black/10 shadow-sm dark:border-white/10"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-semibold">{m.title}</span>
                      {m.category && (
                        <span className="rounded bg-black/10 px-1.5 py-0.5 text-[11px] uppercase tracking-wide dark:bg-white/15">
                          {(t.books.cats as Record<string, string>)[m.category] ??
                            m.category}
                        </span>
                      )}
                      {userAdded && (
                        <span className="rounded bg-brass/20 px-1.5 py-0.5 text-[11px] uppercase text-brass">
                          {t.books.uploaded}
                        </span>
                      )}
                      <span className="rounded bg-black/10 px-1.5 py-0.5 text-[11px] font-medium dark:bg-white/15">
                        {langBadge(m.languages)}
                      </span>
                    </div>
                    <div className="text-sm opacity-60">
                      {m.abbrev} · {count} {t.books.entries} · {t.books.languages}:{' '}
                      {m.languages.join(', ')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => download(m.id)}
                    title={t.books.download}
                    className="rounded border border-black/15 px-2 py-1 text-sm opacity-70 hover:opacity-100 dark:border-white/15"
                  >
                    ⭳
                  </button>
                  <button
                    onClick={() => toggleBook(m.id)}
                    className={`rounded px-3 py-1 text-sm ${
                      active
                        ? 'bg-blood text-white'
                        : 'border border-black/15 hover:bg-black/5 dark:border-white/15'
                    }`}
                  >
                    {active ? t.books.active : t.books.inactive}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(t.books.removeConfirm)) void removeBook(m.id)
                    }}
                    title={t.books.remove}
                    className="rounded border border-black/15 px-2 py-1 text-sm opacity-60 hover:border-red-500 hover:text-red-500 dark:border-white/15"
                  >
                    ✕
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
