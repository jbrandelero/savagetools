import { useEffect, useRef, useState } from 'react'
import { useLibrary } from '@/store/useLibrary'
import { useT } from '@/hooks'
import { useToast } from '@/store/useToast'
import { loadYoutubeApi, type YtPlayer } from '@/lib/youtubeApi'
import { fetchVideoTitle, parseVideoId } from '@/lib/youtube'

/**
 * Background-music card: playlists the GM builds from individual YouTube
 * videos, shared by every encounter. The player is API-driven, so the buttons
 * below it control playback and the track list doubles as a jump-to control.
 * Track names come from YouTube itself — only the link is asked for.
 *
 * Which playlist is loaded is owned by the caller (a scene). Whenever
 * `autoplayToken` changes — a new scene opened — playback starts on its own.
 */
export function MusicPlayer({
  playlistId,
  onSelect,
  autoplayToken,
}: {
  playlistId?: string
  onSelect: (playlistId?: string) => void
  autoplayToken?: string
}) {
  const { t } = useT()
  const playlists = useLibrary((s) => s.playlists)
  const createPlaylist = useLibrary((s) => s.createPlaylist)
  const removePlaylist = useLibrary((s) => s.removePlaylist)
  const addTrack = useLibrary((s) => s.addTrack)
  const setTrackTitle = useLibrary((s) => s.setTrackTitle)
  const removeTrack = useLibrary((s) => s.removeTrack)
  const showToast = useToast((s) => s.show)

  const [adding, setAdding] = useState(false)
  const [creating, setCreating] = useState(false)
  const [listName, setListName] = useState('')
  const [url, setUrl] = useState('')
  const [playing, setPlaying] = useState(false)
  const [index, setIndex] = useState(0)
  const [volume, setVolume] = useState(60)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const host = useRef<HTMLDivElement>(null)
  const player = useRef<YtPlayer | null>(null)
  /** Latest volume, readable from player callbacks without re-creating them. */
  const volumeRef = useRef(60)
  /** Timestamp of the last manual seek; polling stands back right after one. */
  const seekedAt = useRef(0)
  /** Set while a start is waiting to be unmuted (see `startPlayback`). */
  const unmuteOnPlay = useRef(false)
  /** Set when the caller switched scenes and the new playlist should roll. */
  const autoplay = useRef(false)

  const active = playlists.find((p) => p.id === playlistId)

  // A scene change arms playback: the effect below (re)creates the player and
  // starts it, and a scene that keeps the same playlist just rolls on.
  const firstToken = useRef(true)
  useEffect(() => {
    if (firstToken.current) {
      firstToken.current = false
      return
    }
    autoplay.current = true
    if (player.current) {
      autoplay.current = false
      startPlayback()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplayToken])
  const ids = active?.tracks.map((tr) => tr.ytId).join(',') ?? ''

  // One API-backed player per playlist. The videos are cued (not autoplayed),
  // so next/previous and jump-to work without the page making noise on load.
  useEffect(() => {
    if (!active || !ids) return
    const list = ids.split(',')
    let cancelled = false
    setPlaying(false)
    setIndex(0)
    void loadYoutubeApi().then((YT) => {
      if (cancelled || !host.current) return
      player.current = new YT.Player(host.current, {
        host: 'https://www.youtube-nocookie.com',
        playerVars: { rel: 0 },
        events: {
          onReady: () => {
            player.current?.setVolume(volumeRef.current)
            // `load` starts playing, `cue` only stages it. A scene change asks
            // for the first, a page load for the second.
            if (autoplay.current) {
              autoplay.current = false
              unmuteOnPlay.current = true
              player.current?.mute()
              player.current?.loadPlaylist({ playlist: list })
            } else {
              player.current?.cuePlaylist({ playlist: list })
            }
          },
          onStateChange: (e: { data: number }) => {
            setPlaying(e.data === YT.PlayerState.PLAYING)
            if (e.data === YT.PlayerState.PLAYING && unmuteOnPlay.current) {
              unmuteOnPlay.current = false
              player.current?.unMute()
              player.current?.setVolume(volumeRef.current)
            }
            const at = player.current?.getPlaylistIndex?.()
            if (typeof at === 'number' && at >= 0) setIndex(at)
          },
        },
      })
    })
    return () => {
      cancelled = true
      player.current?.destroy()
      player.current = null
    }
  }, [active?.id, ids])

  // Drives the seek bar: the embedded controls are tiny at this size, so the
  // card carries its own position slider.
  useEffect(() => {
    const timer = window.setInterval(() => {
      const p = player.current
      if (!p?.getDuration) return
      if (Date.now() - seekedAt.current < 700) return
      setDuration(p.getDuration() || 0)
      setPosition(p.getCurrentTime() || 0)
    }, 500)
    return () => window.clearInterval(timer)
  }, [])

  const seek = (seconds: number) => {
    seekedAt.current = Date.now()
    setPosition(seconds)
    player.current?.seekTo(seconds, true)
  }

  const submitPlaylist = () => {
    if (!listName.trim()) return
    onSelect(createPlaylist(listName))
    setListName('')
    setCreating(false)
  }

  const submitTrack = async () => {
    if (!active) return
    const trackId = addTrack(active.id, url)
    if (!trackId) {
      showToast(t.music.badUrl)
      return
    }
    const ytId = parseVideoId(url)
    setUrl('')
    // The row shows up right away; its real name lands when YouTube answers.
    const name = ytId && (await fetchVideoTitle(ytId))
    if (name) setTrackTitle(active.id, trackId, name)
  }

  // Chrome only lets a cross-origin frame start playing when it is muted (the
  // click happened on this page, not inside the YouTube frame), so playback
  // starts muted and unmutes itself as soon as it is actually running.
  function startPlayback() {
    const p = player.current
    if (!p) return
    unmuteOnPlay.current = true
    p.mute()
    p.playVideo()
  }

  const toggle = () => {
    if (playing) player.current?.pauseVideo()
    else startPlayback()
  }
  const changeVolume = (v: number) => {
    setVolume(v)
    volumeRef.current = v
    player.current?.unMute()
    player.current?.setVolume(v)
  }

  return (
    <div className="shrink-0 overflow-hidden rounded border border-black/10 dark:border-white/10">
      <div className="flex items-center gap-2 border-b border-black/10 px-2 py-1.5 dark:border-white/10">
        <span className="shrink-0 text-xs font-semibold uppercase tracking-wide opacity-70">
          ♪ {t.music.title}
        </span>
        {playlists.length > 0 && (
          <select
            value={active?.id ?? ''}
            onChange={(e) => onSelect(e.target.value || undefined)}
            className="min-w-0 flex-1 rounded border border-black/15 bg-transparent px-1 py-0.5 text-sm outline-none dark:border-white/15"
          >
            <option value="" className="text-ink">
              {t.music.none}
            </option>
            {playlists.map((p) => (
              <option key={p.id} value={p.id} className="text-ink">
                {p.name}
              </option>
            ))}
          </select>
        )}
        <button
          onClick={() => setCreating((c) => !c)}
          title={t.music.newPlaylist}
          className="ml-auto shrink-0 rounded px-1.5 text-sm text-blood hover:underline"
        >
          {t.music.add}
        </button>
        {active && (
          <button
            onClick={() => removePlaylist(active.id)}
            title={t.music.remove}
            className="shrink-0 px-1 text-xs opacity-30 hover:text-red-500 hover:opacity-100"
          >
            ✕
          </button>
        )}
      </div>

      {creating && (
        <div className="flex gap-2 border-b border-black/10 p-2 dark:border-white/10">
          <input
            autoFocus
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitPlaylist()}
            placeholder={t.music.playlistNamePlaceholder}
            className="min-w-0 flex-1 rounded border border-black/15 bg-transparent px-2 py-1 text-sm outline-none focus:border-blood dark:border-white/15"
          />
          <button
            onClick={submitPlaylist}
            className="shrink-0 rounded bg-blood px-2 py-1 text-xs font-semibold text-white"
          >
            {t.music.save}
          </button>
          <button
            onClick={() => setCreating(false)}
            className="shrink-0 px-1 text-xs opacity-60 hover:opacity-100"
          >
            {t.music.cancel}
          </button>
        </div>
      )}

      {!active ? (
        <p className="p-3 text-sm opacity-50">
          {playlists.length === 0 ? t.music.empty : t.music.pick}
        </p>
      ) : (
        <>
          {ids && (
            <>
              {/* The player must stay in the page to keep playing, but this is
                  background music: park the video offscreen. */}
              <div
                key={active.id}
                aria-hidden
                className="pointer-events-none fixed -left-[9999px] top-0 h-[200px] w-[200px]"
              >
                <div ref={host} className="h-full w-full" />
              </div>
              <div className="flex items-center gap-1 border-t border-black/10 px-2 py-1.5 text-[11px] dark:border-white/10">
                <button
                  onClick={() => player.current?.previousVideo()}
                  title={t.music.previous}
                  aria-label={t.music.previous}
                  className="shrink-0 rounded px-1 text-sm hover:bg-black/10 dark:hover:bg-white/10"
                >
                  ⏮
                </button>
                <button
                  onClick={toggle}
                  title={playing ? t.music.pause : t.music.play}
                  aria-label={playing ? t.music.pause : t.music.play}
                  className="shrink-0 rounded px-1 text-sm hover:bg-black/10 dark:hover:bg-white/10"
                >
                  {playing ? '⏸' : '▶'}
                </button>
                <button
                  onClick={() => player.current?.nextVideo()}
                  title={t.music.next}
                  aria-label={t.music.next}
                  className="shrink-0 rounded px-1 text-sm hover:bg-black/10 dark:hover:bg-white/10"
                >
                  ⏭
                </button>
                <span className="shrink-0 tabular-nums opacity-60">
                  {clock(position)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={Math.max(duration, 1)}
                  step={1}
                  value={Math.min(position, duration || 0)}
                  onChange={(e) => seek(Number(e.target.value))}
                  title={t.music.seek}
                  aria-label={t.music.seek}
                  className="min-w-0 flex-1 accent-blood"
                />
                <span className="shrink-0 tabular-nums opacity-60">
                  {clock(duration)}
                </span>
                <span className="shrink-0 select-none opacity-50" aria-hidden>
                  {volume === 0 ? '🔇' : '🔊'}
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  onChange={(e) => changeVolume(Number(e.target.value))}
                  title={t.music.volume}
                  aria-label={t.music.volume}
                  className="w-14 shrink-0 accent-blood"
                />
              </div>
            </>
          )}

          <ul className="max-h-32 divide-y divide-black/5 overflow-auto border-t border-black/10 dark:divide-white/5 dark:border-white/10">
            {active.tracks.length === 0 && (
              <li className="px-2 py-2 text-sm opacity-50">{t.music.noTracks}</li>
            )}
            {active.tracks.map((track, i) => (
              <li
                key={track.id}
                className={`flex items-center hover:bg-black/5 dark:hover:bg-white/5 ${
                  i === index && playing ? 'text-brass' : ''
                }`}
              >
                <button
                  onClick={() => player.current?.playVideoAt(i)}
                  className="min-w-0 flex-1 truncate px-2 py-1 text-left text-sm"
                >
                  <span className="mr-1 opacity-40">{i + 1}.</span>
                  {track.title}
                </button>
                <button
                  onClick={() => removeTrack(active.id, track.id)}
                  title={t.music.removeTrack}
                  className="shrink-0 px-1.5 text-xs opacity-30 hover:text-red-500 hover:opacity-100"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>

          {adding ? (
            <div className="flex gap-2 border-t border-black/10 p-2 dark:border-white/10">
              <input
                autoFocus
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void submitTrack()}
                placeholder={t.music.urlPlaceholder}
                className="min-w-0 flex-1 rounded border border-black/15 bg-transparent px-2 py-1 text-sm outline-none focus:border-blood dark:border-white/15"
              />
              <button
                onClick={() => void submitTrack()}
                className="shrink-0 rounded bg-blood px-2 py-1 text-xs font-semibold text-white"
              >
                {t.music.save}
              </button>
              <button
                onClick={() => setAdding(false)}
                className="shrink-0 px-1 text-xs opacity-60 hover:opacity-100"
              >
                {t.music.cancel}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full border-t border-black/10 px-2 py-1.5 text-left text-xs text-blood hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
            >
              {t.music.addTrack}
            </button>
          )}
        </>
      )}
    </div>
  )
}

/** Seconds as m:ss (or h:mm:ss for long streams). */
function clock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
  const total = Math.floor(seconds)
  const s = String(total % 60).padStart(2, '0')
  const m = Math.floor(total / 60) % 60
  const h = Math.floor(total / 3600)
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}
