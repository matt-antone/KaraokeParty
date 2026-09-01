/**
 * @startingPoint section="Player" subtitle="Intermission, idle, empty and corner-panel states" viewport="960x540"
 */
export interface PlayerOverlayProps {
  /**
   * 'upNow'       — corner panel naming who is on stage; shown for the first seconds of a song.
   * 'upNextTease' — corner panel naming who is next; shown in the last seconds.
   * 'intermission'— full takeover between songs, with the countdown.
   * 'idle'        — a big knob-styled play key (browsers won't autoplay without a tap).
   * 'empty'       — nothing queued.
   * 'errored'     — media failed.
   */
  state?: 'upNow' | 'upNextTease' | 'intermission' | 'idle' | 'empty' | 'errored'
  /** Who the panel is about: the singer on stage, or the one coming next. */
  singer?: string
  singerImage?: string
  /** The song that goes with `singer`. Shown in the corner panel and at intermission. */
  nextTitle?: string
  nextArtist?: string
  /** Intermission countdown, whole seconds. */
  secondsLeft?: number
  /** The singer after this one. */
  comingUpSinger?: string
  /** Their song, shown as "Singer — Title". */
  comingUpTitle?: string
  /** Songs still to come. Drives the bottom queue-depth meter. */
  queueDepth?: number
  onPlay?: () => void
  className?: string
  style?: React.CSSProperties
}

export function PlayerOverlay (props: PlayerOverlayProps): JSX.Element
