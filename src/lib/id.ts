/** Random id for locally-created objects (encounters, list items, ...). */
export function newId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `id_${Date.now()}_${Math.floor(Math.random() * 1e6)}`
  }
}
