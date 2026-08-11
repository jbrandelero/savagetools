import type { Entry, LocalizedText } from '@/types/entry'

/**
 * Resolve a LocalizedText to a string for the preferred language.
 * Order: exact match -> same base language (pt-BR ~ pt) -> first available.
 */
export function resolveText(
  text: LocalizedText | undefined,
  lang: string,
): string {
  if (text == null) return ''
  if (typeof text === 'string') return text

  const keys = Object.keys(text)
  if (keys.length === 0) return ''

  if (text[lang]) return text[lang]

  const base = lang.split('-')[0]
  const baseHit = keys.find((k) => k.split('-')[0] === base)
  if (baseHit) return text[baseHit]

  return text[keys[0]]
}

/**
 * Read one of an entry's type-specific `fields` as display text. Arrays are
 * joined, localized maps resolved, everything else stringified.
 */
export function entryField(
  entry: Entry,
  name: string,
  lang: string,
): string {
  const v = entry.fields?.[name]
  if (v == null) return ''
  if (Array.isArray(v)) return v.join(', ')
  if (typeof v === 'object') return resolveText(v as Record<string, string>, lang)
  return String(v)
}

/** Languages a LocalizedText actually provides. */
export function textLangs(text: LocalizedText | undefined): string[] {
  if (text == null) return []
  if (typeof text === 'string') return []
  return Object.keys(text)
}
