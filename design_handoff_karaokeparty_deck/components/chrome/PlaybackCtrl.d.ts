/**
 * @startingPoint section="Chrome" subtitle="Room transport — Settings > Player only" viewport="700x120"
 */
export interface PlaybackCtrlProps {
  isPlaying: boolean
  /** 0-1. */
  volume?: number
  /** 0-1 room output level for the meter. Falls back to a volume-derived value. */
  level?: number
  /** Only on the player screen itself. */
  showFullscreen?: boolean
  /** Opens the display options. Omit where the panel already shows them inline. */
  onDisplayCtrl?: () => void
  onPlay?: () => void
  onPause?: () => void
  onPlayNext?: () => void
  onVolumeChange?: (value: number) => void
  onDisplayCtrl?: () => void
  onFullscreen?: () => void
  className?: string
  style?: React.CSSProperties
}

export function PlaybackCtrl (props: PlaybackCtrlProps): JSX.Element
