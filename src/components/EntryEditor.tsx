import { useMemo, useRef, useState } from 'react'
import { useLibrary, EXAMPLE_ID } from '@/store/useLibrary'
import { useToast } from '@/store/useToast'
import { useContentLang, useT } from '@/hooks'
import { langShort } from '@/i18n'
import { resolveText } from '@/lib/localized'
import { canonicalKey } from '@/lib/slug'
import { fileToEntryImage } from '@/lib/image'
import { Modal } from './Modal'
import {
  ENTRY_TYPES,
  RANKS,
  type EntryType,
  type Entry,
  type LocalizedText,
} from '@/types/entry'

// Type-specific `fields` inputs. Common name/summary/description/etc. are always shown.
const TYPE_FIELDS: Partial<Record<EntryType, string[]>> = {
  weapon: ['damage', 'ap', 'rof', 'shots', 'range', 'minStr', 'weight', 'cost', 'notes'],
  armor: ['armor', 'parry', 'cover', 'minStr', 'weight', 'cost'],
  gear: ['cost', 'weight', 'size', 'handling', 'topSpeed', 'toughness', 'crew', 'notes'],
  power: ['pp', 'range', 'duration', 'cost'],
  skill: ['attribute'],
  bestiary: ['attributes', 'skills', 'pace', 'parry', 'toughness', 'specialAbilities'],
}
const HAS_RANK: EntryType[] = ['edge', 'power']

function localToStr(v: LocalizedText | undefined, lang: string): string {
  return v == null ? '' : typeof v === 'string' ? v : resolveText(v, lang)
}
/** Merge an edited single-language value back into a localized map. */
function mergeLocal(
  prev: LocalizedText | undefined,
  lang: string,
  val: string,
): LocalizedText | undefined {
  const base: Record<string, string> =
    prev && typeof prev === 'object' ? { ...prev } : prev ? { 'pt-BR': prev } : {}
  if (val) base[lang] = val
  else delete base[lang]
  return Object.keys(base).length ? base : undefined
}

export function EntryEditor({
  initial,
  defaultType,
  defaultBookId,
  onClose,
}: {
  initial?: Entry
  defaultType?: EntryType
  defaultBookId?: string
  onClose: () => void
}) {
  const { t } = useT()
  const contentLang = useContentLang()
  const manifest = useLibrary((s) => s.manifest)
  const addEntry = useLibrary((s) => s.addEntry)
  const updateEntry = useLibrary((s) => s.updateEntry)
  const showToast = useToast((s) => s.show)

  const editableBooks = useMemo(
    () => manifest.filter((m) => m.id !== EXAMPLE_ID),
    [manifest],
  )
  const bookLangs = (id: string) =>
    manifest.find((m) => m.id === id)?.languages ?? ['pt-BR']

  const [bookId, setBookId] = useState(
    defaultBookId ?? editableBooks[0]?.id ?? '',
  )
  const [type, setType] = useState<EntryType>(initial?.type ?? defaultType ?? 'edge')
  const [lang, setLang] = useState(bookLangs(bookId)[0] ?? contentLang)

  // Localized fields kept as full maps; edited one language at a time.
  const [name, setName] = useState<LocalizedText | undefined>(initial?.name)
  const [summary, setSummary] = useState<LocalizedText | undefined>(initial?.summary)
  const [description, setDescription] = useState<LocalizedText | undefined>(initial?.description)
  const [requirements, setRequirements] = useState<LocalizedText | undefined>(initial?.requirements)
  const [category, setCategory] = useState(initial?.category ?? '')
  const [rank, setRank] = useState(initial?.rank ?? '')
  const [tags, setTags] = useState((initial?.tags ?? []).join(', '))
  const [image, setImage] = useState<string | undefined>(initial?.image)
  const [imageError, setImageError] = useState<string | null>(null)
  const imageRef = useRef<HTMLInputElement>(null)
  const [keyOverride, setKeyOverride] = useState(initial?.key ?? '')
  const [fields, setFields] = useState<Record<string, string>>(() => {
    const f: Record<string, string> = {}
    for (const k of TYPE_FIELDS[initial?.type ?? type] ?? [])
      f[k] = localToStr(initial?.fields?.[k] as LocalizedText, contentLang)
    if ((initial?.type ?? type) === 'bestiary')
      f._wildCard = initial?.fields?.wildCard ? '1' : ''
    return f
  })

  if (editableBooks.length === 0) {
    return (
      <Modal onClose={onClose} title={t.editor.newItem}>
        <p className="opacity-70">{t.editor.noBook}</p>
      </Modal>
    )
  }

  const setField = (k: string, v: string) =>
    setFields((s) => ({ ...s, [k]: v }))

  async function pickImage(files: FileList | null) {
    const file = files?.[0]
    if (imageRef.current) imageRef.current.value = ''
    if (!file) return
    const result = await fileToEntryImage(file)
    if (!result.ok) {
      setImageError(
        result.error === 'tooBig' ? t.editor.imageTooBig : t.editor.imageInvalid,
      )
      return
    }
    setImageError(null)
    setImage(result.dataUrl)
  }

  function save() {
    const nameStr = localToStr(name, lang) || localToStr(name, 'en')
    if (!nameStr.trim() || !bookId) return
    const key =
      keyOverride.trim() ||
      canonicalKey(type, localToStr(name, 'en') || nameStr)
    const outFields: Record<string, unknown> = {}
    for (const k of TYPE_FIELDS[type] ?? []) {
      const v = fields[k]?.trim()
      if (v) outFields[k] = v
    }
    if (type === 'bestiary') outFields.wildCard = fields._wildCard === '1'

    const entry: Entry = {
      id: initial?.id ?? key.replace(':', '.'),
      key,
      type,
      name: name ?? { [lang]: nameStr },
      ...(category.trim() ? { category: category.trim() } : {}),
      ...(rank && HAS_RANK.includes(type) ? { rank: rank as Entry['rank'] } : {}),
      ...(requirements ? { requirements } : {}),
      ...(summary ? { summary } : {}),
      ...(description ? { description } : {}),
      ...(image ? { image } : {}),
      ...(Object.keys(outFields).length ? { fields: outFields } : {}),
      tags: tags.split(',').map((x) => x.trim()).filter(Boolean),
    }

    if (initial) updateEntry(bookId, entry)
    else addEntry(bookId, entry)
    showToast(t.editor.savedToast)
    onClose()
  }

  const langs = bookLangs(bookId)

  return (
    <Modal onClose={onClose} title={initial ? t.editor.editItem : t.editor.newItem}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Book + type + language */}
        <Field label={t.editor.targetBook}>
          <select
            value={bookId}
            onChange={(e) => {
              setBookId(e.target.value)
              setLang(bookLangs(e.target.value)[0] ?? lang)
            }}
            disabled={!!initial}
            className={inputCls}
          >
            {editableBooks.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t.editor.type}>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as EntryType)}
            disabled={!!initial}
            className={inputCls}
          >
            {ENTRY_TYPES.map((ty) => (
              <option key={ty} value={ty}>
                {t.types[ty]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {langs.length > 1 && (
        <div className="mt-2 flex items-center gap-1 text-xs">
          {langs.map((code) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              className={`rounded px-2 py-0.5 ${
                lang === code ? 'bg-blood text-white' : 'bg-black/5 dark:bg-white/10'
              }`}
            >
              {langShort(code)}
            </button>
          ))}
        </div>
      )}

      <div className="mt-2 space-y-2">
        <Field label={t.entry.name}>
          <input
            value={localToStr(name, lang)}
            onChange={(e) => setName(mergeLocal(name, lang, e.target.value))}
            className={inputCls}
          />
        </Field>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Field label={t.entry.category}>
            <input value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls} />
          </Field>
          {HAS_RANK.includes(type) && (
            <Field label={t.entry.rank}>
              <select value={rank} onChange={(e) => setRank(e.target.value)} className={inputCls}>
                <option value="">—</option>
                {RANKS.map((r) => (
                  <option key={r} value={r}>
                    {t.ranks[r]}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>
        {HAS_RANK.includes(type) && (
          <Field label={t.entry.requirements}>
            <input
              value={localToStr(requirements, lang)}
              onChange={(e) => setRequirements(mergeLocal(requirements, lang, e.target.value))}
              className={inputCls}
            />
          </Field>
        )}
        <Field label={t.entry.summary}>
          <input
            value={localToStr(summary, lang)}
            onChange={(e) => setSummary(mergeLocal(summary, lang, e.target.value))}
            className={inputCls}
          />
        </Field>
        <Field label={t.entry.description}>
          <textarea
            value={localToStr(description, lang)}
            onChange={(e) => setDescription(mergeLocal(description, lang, e.target.value))}
            rows={5}
            className={inputCls}
          />
        </Field>

        <div className="block text-xs">
          <span className="mb-0.5 block opacity-60">{t.editor.image}</span>
          <div className="flex items-center gap-2">
            {image && (
              <img
                src={image}
                alt=""
                className="h-16 w-16 rounded border border-black/10 object-cover dark:border-white/10"
              />
            )}
            <input
              ref={imageRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => void pickImage(e.target.files)}
            />
            <button
              onClick={() => imageRef.current?.click()}
              className="rounded border border-black/15 px-2 py-1 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
            >
              {t.editor.imagePick}
            </button>
            {image && (
              <button
                onClick={() => {
                  setImage(undefined)
                  setImageError(null)
                }}
                className="opacity-60 hover:text-red-500 hover:opacity-100"
              >
                {t.editor.imageRemove}
              </button>
            )}
            <span className="opacity-50">{t.editor.imageHint}</span>
          </div>
          {imageError && (
            <p className="mt-1 text-red-600 dark:text-red-400">{imageError}</p>
          )}
        </div>

        {/* Type-specific fields */}
        {(TYPE_FIELDS[type]?.length ?? 0) > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {type === 'bestiary' && (
              <label className="col-span-2 flex items-center gap-2 text-sm sm:col-span-3">
                <input
                  type="checkbox"
                  checked={fields._wildCard === '1'}
                  onChange={(e) => setField('_wildCard', e.target.checked ? '1' : '')}
                />
                {t.fields.wildCard}
              </label>
            )}
            {(TYPE_FIELDS[type] ?? []).map((k) => (
              <Field key={k} label={fieldLabel(k, t)}>
                <input value={fields[k] ?? ''} onChange={(e) => setField(k, e.target.value)} className={inputCls} />
              </Field>
            ))}
          </div>
        )}

        <Field label={t.editor.tags}>
          <input value={tags} onChange={(e) => setTags(e.target.value)} className={inputCls} />
        </Field>
        <Field label={t.editor.keyAdvanced}>
          <input
            value={keyOverride}
            onChange={(e) => setKeyOverride(e.target.value)}
            placeholder={canonicalKey(type, localToStr(name, 'en') || localToStr(name, lang) || '…')}
            className={inputCls}
          />
        </Field>
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <button onClick={onClose} className="rounded border border-black/15 px-3 py-1.5 text-sm dark:border-white/15">
          {t.editor.cancel}
        </button>
        <button onClick={save} className="rounded bg-blood px-3 py-1.5 text-sm text-white hover:opacity-90">
          {t.editor.save}
        </button>
      </div>
    </Modal>
  )
}

const inputCls =
  'w-full rounded border border-black/15 bg-white px-2 py-1 text-sm outline-none focus:border-blood dark:border-white/15 dark:bg-black/30'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs">
      <span className="mb-0.5 block opacity-60">{label}</span>
      {children}
    </label>
  )
}

function fieldLabel(k: string, t: ReturnType<typeof useT>['t']): string {
  const f = t.fields as Record<string, string>
  return f[k] ?? k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
}

