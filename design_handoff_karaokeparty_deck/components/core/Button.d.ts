import type { IconName } from './Icon'

/**
 * @startingPoint section="Core" subtitle="Faceplate keys — panel, amber, alert, flush" viewport="700x200"
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Render as a <span> when the key sits inside an anchor. */
  as?: 'button' | 'span'
  /**
   * 'panel' — graphite key, the default.
   * 'vu'    — amber key: the one primary action on a screen, and the transport.
   * 'alert' — red key: destructive only.
   * 'flush' — no key face, just a glyph on the panel. Row actions and close buttons.
   */
  tone?: 'panel' | 'vu' | 'alert' | 'flush'
  icon?: IconName
  /** Icon height in px. Defaults to the glyph's CSS size. */
  iconSize?: number
  /** Full width. Use for form and modal actions. */
  block?: boolean
}

export function Button (props: ButtonProps): JSX.Element
