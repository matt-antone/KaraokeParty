/**
 * @startingPoint section="Queue" subtitle="Queue / Me / History tabs" viewport="700x140"
 */
export interface QueueHeaderProps {
  tab?: 'queue' | 'me' | 'history'
  onTabChange?: (tab: string) => void
  queueCount?: number
  myCount?: number
  historyCount?: number
  className?: string
  style?: React.CSSProperties
}

export function QueueHeader (props: QueueHeaderProps): JSX.Element
