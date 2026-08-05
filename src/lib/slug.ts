/** Normalize a name into a slug: lowercased, accent-stripped, hyphenated. */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // strip combining diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Build a canonical dedup key from type + name, e.g. "edge:alerta". */
export function canonicalKey(type: string, name: string): string {
  return `${type}:${slugify(name)}`
}
