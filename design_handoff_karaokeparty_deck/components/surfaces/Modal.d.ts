export interface ModalProps {
  title: string
  children?: React.ReactNode
  /** Actions, stacked full-width. Pass `block` Buttons, amber first. */
  buttons?: React.ReactNode
  onClose: () => void
  scrollable?: boolean
  className?: string
  style?: React.CSSProperties
}

export function Modal (props: ModalProps): JSX.Element
