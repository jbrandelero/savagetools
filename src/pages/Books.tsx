import { useRef, useState } from 'react'
import { useLibrary, EXAMPLE_ID } from '@/store/useLibrary'
import { useToast } from '@/store/useToast'
import { useT, useVisibleManifest } from '@/hooks'
import { EXAMPLE_BOOK } from '@/data/exampleBook'
import { Disclaimer } from '@/components/Disclaimer'
import { langBadge } from '@/i18n'
import { downloadText } from '@/lib/download'

/** Editable book metadata — the shape the create/edit form works with. */
interface BookMetaDraft {
  title: string
  abbrev: string
  languages: string[]
  category: string
  /** Base64 data URI; undefined means "generate a placeholder". */
  cover?: string
}

const BOOK_CATEGORIES = ['homebrew', 'core', 'compendium'] as const
const MAX_COVER_BYTES = 4 * 1024 * 1024

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

const fieldCls =
  'rounded border border-black/15 bg-white px-2 py-1 text-sm dark:border-white/15 dark:bg-black/30'

/**
 * Title / abbrev / languages / category / cover form, shared by "new book" and
 * by editing a book already in the library.
 */
function BookForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: BookMetaDraft
  submitLabel: string
  onSubmit: (draft: BookMetaDraft) => void
  onCancel: () => void
}) {
  const { t } = useT()
  const coverRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState(initial?.title ?? '')
  const [abbrev, setAbbrev] = useState(initial?.abbrev ?? '')
  const [langs, setLangs] = useState<string[]>(initial?.languages ?? ['pt-BR'])
  const [category, setCategory] = useState(initial?.category ?? 'homebrew')
  const [cover, setCover] = useState<string | undefined>(initial?.cover)
  const [error, setError] = useState<string | null>(null)

  async function pickCover(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    if (file.size > MAX_COVER_BYTES) {
      setError(t.books.coverTooBig)
      return
    }
    setError(null)
    setCover(await readAsDataUrl(file))
    if (coverRef.current) coverRef.current.value = ''
  }

  function submit() {
    if (!title.trim()) return
    onSubmit({
      title: title.trim(),
      abbrev: abbrev.trim(),
      languages: langs,
      category,
      cover,
    })
  }

  return (
    <div className="rounded border border-brass/40 bg-brass/5 p-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs">
          <span className="mb-0.5 block opacity-60">{t.books.fTitle}</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-52 ${fieldCls}`}
          />
        </label>
        <label className="text-xs">
          <span className="mb-0.5 block opacity-60">{t.books.fAbbrev}</span>
          <input
            value={abbrev}
            onChange={(e) => setAbbrev(e.target.value)}
            className={`w-20 ${fieldCls}`}
          />
        </label>
        <label className="text-xs">
          <span className="mb-0.5 block opacity-60">{t.books.fCategory}</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={fieldCls}
          >
            {BOOK_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {(t.books.cats as Record<string, string>)[c] ?? c}
              </option>
            ))}
          </select>
        </label>
        <div className="text-xs">
          <span className="mb-0.5 block opacity-60">{t.books.fLangs}</span>
          <div className="flex gap-1">
            {['pt-BR', 'en'].map((code) => (
              <button
                key={code}
                onClick={() =>
                  setLangs((s) =>
                    s.includes(code) ? s.filter((x) => x !== code) : [...s, code],
                  )
                }
                className={`rounded px-2 py-1 transition-colors ${
                  langs.includes(code)
                    ? 'bg-blood text-white'
                    : 'bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20'
                }`}
              >
                {langBadge([code])}
              </button>
            ))}
          </div>
        </div>
        <div className="text-xs">
          <span className="mb-0.5 block opacity-60">{t.books.fCover}</span>
          <div className="flex items-center gap-2">
            {cover && (
              <img
                src={cover}
                alt=""
                className="h-14 w-auto rounded border border-black/10 dark:border-white/10"
              />
            )}
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => void pickCover(e.target.files)}
            />
            <button
              onClick={() => coverRef.current?.click()}
              className="rounded border border-black/15 px-2 py-1 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
            >
              {t.books.coverPick}
            </button>
            {cover && (
              <button
                onClick={() => setCover(undefined)}
                className="opacity-60 hover:text-red-500 hover:opacity-100"
              >
                {t.books.coverRemove}
              </button>
            )}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onCancel}
            className="rounded border border-black/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          >
            {t.books.cancel}
          </button>
          <button
            onClick={submit}
            disabled={!title.trim()}
            className="rounded bg-blood px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50"
          >
            {submitLabel}
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}

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
  const updateBookMeta = useLibrary((s) => s.updateBookMeta)
  const exportBook = useLibrary((s) => s.exportBook)
  const showToast = useToast((s) => s.show)

  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

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
              onClick={() => {
                setEditingId(null)
                setShowCreate((v) => !v)
              }}
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
        <BookForm
          submitLabel={t.books.create}
          onCancel={() => setShowCreate(false)}
          onSubmit={(draft) => {
            createBook(draft)
            setShowCreate(false)
          }}
        />
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
            const book = books[m.id]
            const count = book?.entries.length ?? 0
            const cover = book?.cover ?? m.cover
            const userAdded = origins[m.id] === 'user'
            // The bundled example book is read-only, like its entries.
            const editable = m.id !== EXAMPLE_ID
            const editing = editingId === m.id
            return (
              <li
                key={m.id}
                className="space-y-3 rounded border border-black/10 bg-white/50 p-3 dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex items-center justify-between gap-3">
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
                    {editable && (
                      <button
                        onClick={() => {
                          setShowCreate(false)
                          setEditingId(editing ? null : m.id)
                        }}
                        title={t.books.edit}
                        className={`rounded border px-2 py-1 text-sm transition-colors ${
                          editing
                            ? 'border-blood bg-blood/10 text-blood'
                            : 'border-black/15 opacity-70 hover:opacity-100 dark:border-white/15'
                        }`}
                      >
                        ✎
                      </button>
                    )}
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
                </div>

                {editing && book && (
                  <BookForm
                    // Remount when switching books so the fields reload.
                    key={m.id}
                    initial={{
                      title: book.title,
                      abbrev: book.abbrev,
                      languages: book.languages,
                      category: book.category ?? 'homebrew',
                      cover: book.cover,
                    }}
                    submitLabel={t.books.save}
                    onCancel={() => setEditingId(null)}
                    onSubmit={(draft) => {
                      updateBookMeta(m.id, draft)
                      setEditingId(null)
                      showToast(t.books.savedToast)
                    }}
                  />
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
