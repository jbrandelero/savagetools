import { en, type Dict } from './en'
import { ptBR } from './pt-BR'

export type UiLang = 'en' | 'pt-BR'

export const UI_LANGS: UiLang[] = ['pt-BR', 'en']

const dicts: Record<UiLang, Dict> = {
  en,
  'pt-BR': ptBR,
}

export function getDict(lang: UiLang): Dict {
  return dicts[lang] ?? en
}

/** Short badge label for a language code: "pt-BR" -> "PT", "en" -> "EN". */
export function langShort(code: string): string {
  return code.toLowerCase().startsWith('pt') ? 'PT' : code.slice(0, 2).toUpperCase()
}

/** Compact multi-language badge, e.g. ["pt-BR","en"] -> "PT·EN". */
export function langBadge(codes: string[]): string {
  return [...new Set(codes.map(langShort))].join('·')
}

export type { Dict }
