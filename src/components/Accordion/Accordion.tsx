import React, { cloneElement, useId, useState } from 'react'
import clsx from 'clsx'
import Icon from 'components/Icon/Icon'
import styles from './Accordion.module.css'

export type AccordionProps = {
  className?: string
  children: React.ReactNode
  headingComponent: React.ReactElement<{ children?: React.ReactNode }>
  iconClassName?: string
  initialExpanded?: boolean
}

const Accordion = ({
  className,
  children,
  headingComponent,
  iconClassName,
  initialExpanded = false,
}: AccordionProps) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded)
  const id = useId()

  const handleOnClick = () => {
    setIsExpanded(!isExpanded)
  }

  const a11yHeadingComponent = cloneElement(headingComponent, {
    children: (
      <button
        type='button'
        id={`accordion-header-${id}`}
        aria-controls={`accordion-panel-${id}`}
        aria-expanded={isExpanded}
      >
        {headingComponent.props.children}
      </button>
    ),
  })

  return (
    <div className={clsx(styles.container, className)} {...(isExpanded && { 'data-expanded': '' })}>
      <div className={clsx(styles.headingContainer)} onClick={handleOnClick}>
        {a11yHeadingComponent}
        <Icon icon='CHEVRON_RIGHT' className={clsx(styles.icon, iconClassName)} />
      </div>
      <section
        id={`accordion-panel-${id}`}
        aria-labelledby={`accordion-header-${id}`}
        className={styles.content}
        hidden={!isExpanded}
      >
        {children}
      </section>
    </div>
  )
}

export default Accordion
