export interface InputCheckboxProps {
  label?: React.ReactNode
  checked: boolean
  disabled?: boolean
  onChange?: (checked: boolean) => void
  className?: string
  style?: React.CSSProperties
}

export function InputCheckbox (props: InputCheckboxProps): JSX.Element
