/**
 * @startingPoint section="Chrome" subtitle="Bottom transport strip, admin tab optional" viewport="700x120"
 */
export interface NavigationProps {
  active: 'library' | 'queue' | 'account' | 'settings'
  /** Reveals the fourth (Settings) tab. Guests and standard singers see three. */
  isAdmin?: boolean
  onNavigate?: (id: string) => void
  className?: string
  style?: React.CSSProperties
}

export function Navigation (props: NavigationProps): JSX.Element
