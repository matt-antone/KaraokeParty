import React from 'react'
import icons from './icons'

interface IconProps {
  className?: string
  icon: keyof typeof icons
  size?: number
}

/* Row actions are 22px on the icon scale (16/22/26/30). Defaulting to it
   matters because a sizeless <svg> has no intrinsic height and stretches to
   fill whatever box it lands in — a key with an unsized icon rendered a 240px
   glyph. Callers that size their icon in CSS still win: height here is a
   presentation attribute, which any stylesheet rule outranks. */
const DEFAULT_SIZE = 22

const Icon = (props: IconProps) => {
  const { size = DEFAULT_SIZE, icon, ...restProps } = props

  return (
    <svg
      height={`${size}px`}
      viewBox={icons[icon].viewBox}
      aria-hidden
      {...restProps}
    >
      <path fill='currentColor' d={icons[icon].d} />
    </svg>
  )
}

export default Icon
