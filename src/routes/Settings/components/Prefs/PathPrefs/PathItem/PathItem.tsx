import React from 'react'
import clsx from 'clsx'
import { Draggable } from '@hello-pangea/dnd'
import Button from 'components/Button/Button'
import Icon from 'components/Icon/Icon'
import VuMeter from 'components/VuMeter/VuMeter'
import { Path } from 'shared/types'
import styles from './PathItem.css'

interface PathItemProps {
  index: number
  onInfo: (pathId: number) => void
  onRefresh: (pathId: number) => void
  path: Path
  /** Songs across every path, so this row's meter can show its share of the library. */
  totalSongs: number
}

const PathItem = ({ index, onInfo, onRefresh, path, totalSongs }: PathItemProps) => {
  const handleInfo = (e: React.SyntheticEvent<HTMLElement>) => onInfo(parseInt(e.currentTarget.dataset.pathId))
  const handleRefresh = (e: React.SyntheticEvent<HTMLElement>) => onRefresh(parseInt(e.currentTarget.dataset.pathId))

  const numSongs = path.numSongs || 0
  // no per-path scan progress exists (the Scanner only reports one global pct),
  // so the meter reads the path's share of the library instead of a fake signal
  const share = totalSongs > 0 ? numSongs / totalSongs : 0

  return (
    <Draggable draggableId={`path-${path.pathId}`} index={index}>
      {provided => (
        <div
          className={styles.pathItem}
          key={path.pathId}
          ref={provided.innerRef}
          style={provided.draggableProps.style}
          {...provided.draggableProps}
        >
          <div className={styles.topRow}>
            <div {...provided.dragHandleProps} tabIndex={-1}>
              <Icon icon='DRAG_INDICATOR' className={styles.btnDrag} />
            </div>
            <div className={styles.pathName}>
              {path.path}
            </div>
            <div className={clsx('silkscreen', styles.count)}>{`${numSongs} songs`}</div>
            <Button
              className={styles.btnRefresh}
              data-path-id={path.pathId}
              icon='REFRESH'
              onClick={handleRefresh}
            />
            <Button
              className={styles.btnInfo}
              data-path-id={path.pathId}
              icon='TUNE'
              onClick={handleInfo}
            />
          </div>
          <VuMeter
            value={share}
            segments={20}
            peakFrom={2}
            height={5}
            label={`${path.path} songs`}
            className={styles.meter}
          />
        </div>
      )}
    </Draggable>
  )
}

export default PathItem
