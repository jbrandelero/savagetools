// Per-source accent colors, 5etools-style (each book gets a stable color used
// for its abbreviation badge). Known SWADE books are mapped; unknown books get
// a deterministic hue from their abbreviation hash.

const KNOWN: Record<string, string> = {
  SWADE: '#8a1f1f', // core — blood red
  SWCC: '#2f6f4f', // companion — green
  FC: '#3a5c8a', // fantasy companion — blue
  SFC: '#5a3a8a', // science fiction companion — violet
  SSF: '#8a6a1f', // super powers — amber
  HR: '#7a2f5a', // horror
}

function hashHue(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360
  return h
}

export function sourceColor(abbrev: string): string {
  return KNOWN[abbrev] ?? `hsl(${hashHue(abbrev)} 45% 40%)`
}

/** Inline style for a source badge. */
export function sourceBadgeStyle(abbrev: string): React.CSSProperties {
  const c = sourceColor(abbrev)
  return { color: '#fff', backgroundColor: c }
}
