// Helpers for the Power Builder: parse a power's own modifiers out of its text,
// parse PP costs, and total up a combination.

export interface ParsedMod {
  name: string
  cost: string
  desc?: string
}

/** Convert literal "\n" escape sequences (as text) into real line breaks. */
export function softBreaks(s: string): string {
  return s.replace(/\\n/g, '\n')
}

/** Split a description into its main body and its "Modificadores" block (if any). */
export function splitOutModifiers(desc: string): { body: string; mods: string } {
  const m = desc.match(/(^|\n|[.;)]\s+)Modificadores?\b\s*:?\s*/i)
  if (!m || m.index == null) return { body: desc, mods: '' }
  const bodyEnd = m.index + (m[1] ? m[1].length : 0)
  const modsStart = m.index + m[0].length
  return { body: desc.slice(0, bodyEnd).trim(), mods: desc.slice(modsStart).trim() }
}

// A new modifier item begins at a "Name (+N)/(-N)" head that follows a sentence
// end (or a line start), so ALL-CAPS names never split mid-word.
const MOD_SPLIT =
  /(?<=[.!?)"”]\s)(?=[A-ZÀ-Ú★][\p{L}'’/-]*(?:\s+[\p{L}'’/-]+){0,5}\s*\([+\-]\d)/u

/** Split a modifiers blob into "Name (+N) …" item strings. */
export function splitModifiers(text: string): string[] {
  const t = text.trim()
  if (!t) return []
  const parts: string[] = []
  for (const line of t.split(/\n+/)) {
    for (const seg of line.split(MOD_SPLIT)) {
      const s = seg.trim()
      if (s) parts.push(s)
    }
  }
  return parts.length ? parts : [t]
}

/**
 * A power's OWN modifiers, taken ONLY from its "Modificadores" block — the same
 * items shown in the description's bullet list — so body text like "Exausto
 * (-2)" is never mistaken for a modifier.
 */
export function extractBlockModifiers(desc: string): ParsedMod[] {
  const { mods } = splitOutModifiers(softBreaks(desc))
  if (!mods) return []
  const out: ParsedMod[] = []
  const seen = new Set<string>()
  for (const item of splitModifiers(mods)) {
    const m = item.match(/^([\s\S]*?)\s*\(([+\-][^)]*)\)\s*:?\s*([\s\S]*)$/)
    if (!m) continue
    const name = m[1].trim()
    const cost = m[2].trim()
    const desc = m[3].trim()
    const key = name.toLowerCase()
    if (name.length < 2 || seen.has(key)) continue
    seen.add(key)
    out.push({ name, cost, desc: desc || undefined })
  }
  return out
}

/** Signed first integer in a cost string: "+2"->2, "-1"->-1, "+1/+2"->1. */
export function costMin(cost: string | undefined): number {
  if (!cost) return 0
  const m = cost.match(/-?\d+/)
  return m ? parseInt(m[0], 10) : 0
}

/** Whether a cost is a range/variable ("+1/+2", "+1 a +3"). */
export function costVariable(cost: string | undefined): boolean {
  return !!cost && /[/a–-]|\+.*\+/i.test(cost.replace(/^\+/, ''))
}

/**
 * Selectable numeric options for a cost. "+1/+2/+4/+8" -> [1,2,4,8];
 * "+1 a +3" -> [1,2,3]; "+2" -> [2].
 */
export function parseCostOptions(cost: string | undefined): number[] {
  if (!cost) return []
  if (cost.includes('/')) {
    return cost
      .split('/')
      .map((s) => {
        const m = s.match(/-?\d+/)
        return m ? parseInt(m[0], 10) : NaN
      })
      .filter((n) => !Number.isNaN(n))
  }
  const range = cost.match(/(-?\d+)\s*(?:a|–|-)\s*(-?\d+)/i)
  if (range) {
    const a = parseInt(range[1], 10)
    const b = parseInt(range[2], 10)
    const out: number[] = []
    for (let i = a; i <= b; i++) out.push(i)
    return out
  }
  const one = cost.match(/-?\d+/)
  return one ? [parseInt(one[0], 10)] : []
}

export function computeTotalPP(
  basePP: string | undefined,
  mods: { cost: string | undefined }[],
): { total: number; variable: boolean } {
  let total = costMin(basePP)
  let variable = costVariable(basePP) || /\D/.test((basePP ?? '').replace(/^\+/, ''))
  for (const mod of mods) {
    total += costMin(mod.cost)
    if (costVariable(mod.cost)) variable = true
  }
  // SWADE: limitations reduce the total to a minimum of 1 PP.
  if (total < 1) total = 1
  return { total, variable }
}
