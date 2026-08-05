import type { LocalizedText } from '@/types/entry'

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

/** Languages a LocalizedText actually provides. */
export function textLangs(text: LocalizedText | undefined): string[] {
  if (text == null) return []
  if (typeof text === 'string') return []
  return Object.keys(text)
}
