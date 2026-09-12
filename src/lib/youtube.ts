/**
 * Pulls a YouTube video id out of anything a user is likely to paste: a watch
 * URL (with or without a `list=` tail), a share link, an embed/shorts URL, or
 * the bare id. Returns null when the input names no single video.
 */
export function parseVideoId(input: string): string | null {
  const raw = input.trim()
  if (!raw) return null
  if (/^[\w-]{11}$/.test(raw)) return raw

  let url: URL
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
  } catch {
    return null
  }
  if (!/(^|\.)(youtube\.com|youtube-nocookie\.com|youtu\.be)$/i.test(url.hostname))
    return null

  const v = url.searchParams.get('v')
  if (v) return v

  const path = url.pathname.replace(/^\/+/, '')
  if (/youtu\.be$/i.test(url.hostname) && path) return path.split('/')[0]
  if (path.startsWith('embed/')) return path.slice(6).split('/')[0]
  if (path.startsWith('shorts/')) return path.slice(7).split('/')[0]
  return null
}

/** Watch URL for a video id, for "open on YouTube" links. */
export function watchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`
}

/**
 * The video's own title, via YouTube's public oEmbed endpoint (no API key, and
 * it allows cross-origin reads). Null when the video is unknown or offline.
 */
export async function fetchVideoTitle(videoId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(
        watchUrl(videoId),
      )}`,
    )
    if (!res.ok) return null
    const data = (await res.json()) as { title?: string }
    return data.title?.trim() || null
  } catch {
    return null
  }
}
