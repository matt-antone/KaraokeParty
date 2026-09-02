import React, { useEffect, useRef } from 'react'
import createThreadField from './threadField'
import styles from './PlayerBackdrop.css'

interface PlayerBackdropProps {
  /** True while the media layer is on screen. The field is *not* hidden when
   *  covered — it stops drawing entirely, which is most of a night. */
  isCovered: boolean
}

const PlayerBackdrop = ({ isCovered }: PlayerBackdropProps) => {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (isCovered || !ref.current) return

    const field = createThreadField(ref.current)
    return () => field.stop()
  }, [isCovered])

  return <canvas ref={ref} className={styles.threads} aria-hidden />
}

export default PlayerBackdrop
