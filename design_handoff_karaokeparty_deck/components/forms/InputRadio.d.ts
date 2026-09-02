export interface InputRadioProps {
  name: string
  value: string | number
  label?: React.ReactNode
  checked: boolean
  onChange?: (value: string | number) => void
  className?: string
  style?: React.CSSProperties
}

export function InputRadio (props: InputRadioProps): JSX.Element
