export interface AccordionProps {
  /** One line. Text, or text plus an inline count. */
  heading: React.ReactNode
  children?: React.ReactNode
  initialExpanded?: boolean
  className?: string
  style?: React.CSSProperties
  contentStyle?: React.CSSProperties
}

export function Accordion (props: AccordionProps): JSX.Element
