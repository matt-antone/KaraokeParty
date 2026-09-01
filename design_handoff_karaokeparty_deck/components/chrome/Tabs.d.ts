export interface TabsProps {
  tabs: Array<{ id: string, label: string, count?: number }>
  active: string
  onChange?: (id: string) => void
  className?: string
  style?: React.CSSProperties
}

export function Tabs (props: TabsProps): JSX.Element
