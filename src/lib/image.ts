/**
 * Base64 image helpers. Everything the app stores lives in the browser, so
 * pictures travel inside the book JSON as `data:` URIs — never as file paths.
 */

/** Largest file the picker accepts, before downscaling. */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024

/** Longest side kept for an entry picture. */
const MAX_ENTRY_DIM = 512

/**
 * Ceiling for the stored data URI. Entry pictures are re-encoded to fit, so
 * this only trips on pathological input (a huge lossless photo of noise).
 */
const MAX_STORED_CHARS = 600 * 1024

export type ImageError = 'invalid' | 'tooBig'

export type ImageResult =
  | { ok: true; dataUrl: string }
  | { ok: false; error: ImageError }

/** Read any file as a `data:` URI. */
export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('decode failed'))
    img.src = src
  })
}

/**
 * Turn a picked file into a base64 picture suitable for storing on an entry:
 * downscaled to `MAX_ENTRY_DIM` and re-encoded, so a 4 MB photo becomes a few
 * dozen KB. Books can hold hundreds of entries, so the size discipline matters
 * more here than it does for a single book cover.
 *
 * SVGs are kept verbatim — they are already small and stay sharp at any size.
 */
export async function fileToEntryImage(file: File): Promise<ImageResult> {
  if (!file.type.startsWith('image/')) return { ok: false, error: 'invalid' }
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: 'tooBig' }

  let raw: string
  try {
    raw = await readAsDataUrl(file)
  } catch {
    return { ok: false, error: 'invalid' }
  }
  if (file.type === 'image/svg+xml') {
    return raw.length > MAX_STORED_CHARS
      ? { ok: false, error: 'tooBig' }
      : { ok: true, dataUrl: raw }
  }

  let img: HTMLImageElement
  try {
    img = await loadImage(raw)
  } catch {
    return { ok: false, error: 'invalid' }
  }

  const longest = Math.max(img.naturalWidth, img.naturalHeight)
  if (!longest) return { ok: false, error: 'invalid' }
  const scale = Math.min(1, MAX_ENTRY_DIM / longest)
  // Already small in both pixels and bytes: keep the original, no re-encode.
  if (scale === 1 && raw.length <= MAX_STORED_CHARS) {
    return { ok: true, dataUrl: raw }
  }

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) return { ok: false, error: 'invalid' }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  // WebP keeps transparency and is far smaller than PNG; browsers that cannot
  // encode it silently hand back a PNG instead.
  let out = canvas.toDataURL('image/webp', 0.85)
  if (!out.startsWith('data:image/webp')) out = canvas.toDataURL('image/png')
  if (out.length > MAX_STORED_CHARS) return { ok: false, error: 'tooBig' }
  return { ok: true, dataUrl: out }
}
