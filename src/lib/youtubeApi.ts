/**
 * Loader for the YouTube IFrame Player API, so the music card can drive
 * playback (play/pause, track skipping, volume) instead of only embedding it.
 * The script is injected once and shared by every player on the page.
 */

/** Minimal shape of the bits of the API this app uses. */
export interface YtPlayer {
  playVideo: () => void
  pauseVideo: () => void
  nextVideo: () => void
  previousVideo: () => void
  playVideoAt: (index: number) => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  getCurrentTime: () => number
  getDuration: () => number
  cuePlaylist: (options: { playlist: string[]; index?: number }) => void
  loadPlaylist: (options: { playlist: string[]; index?: number }) => void
  getPlaylistIndex?: () => number
  setVolume: (volume: number) => void
  mute: () => void
  unMute: () => void
  destroy: () => void
}

export interface YtApi {
  Player: new (el: HTMLElement, options: unknown) => YtPlayer
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number }
}

declare global {
  interface Window {
    YT?: YtApi
    onYouTubeIframeAPIReady?: () => void
  }
}

let pending: Promise<YtApi> | null = null

export function loadYoutubeApi(): Promise<YtApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (!pending) {
    pending = new Promise<YtApi>((resolve) => {
      const previous = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        previous?.()
        resolve(window.YT as YtApi)
      }
      if (!document.getElementById('yt-iframe-api')) {
        const script = document.createElement('script')
        script.id = 'yt-iframe-api'
        script.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(script)
      }
    })
  }
  return pending
}
