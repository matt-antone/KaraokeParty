/**
 * @startingPoint section="Core" subtitle="Segmented level meter, horizontal or vertical" viewport="700x160"
 */
export interface VuMeterProps {
  /** 0-1. */
  value?: number
  /** Segment count. 24 in the transport, 12 in a tight row, 34 across the player stage. */
  segments?: number
  /** Fraction above which segments light red instead of amber. */
  peakFrom?: number
  /** Bar thickness in px. */
  height?: number
  /** Stack bottom-up instead of left-right. */
  vertical?: boolean
  className?: string
  style?: React.CSSProperties
}

export function VuMeter (props: VuMeterProps): JSX.Element
