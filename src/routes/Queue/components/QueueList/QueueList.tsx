import React from 'react'
import { DragDropContext, Draggable, Droppable, DropResult, DraggableProvidedDragHandleProps } from '@hello-pangea/dnd'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { ensureState } from 'redux-optimistic-ui'
import QueueItem from '../QueueItem/QueueItem'
import QueueListAnimator from '../QueueListAnimator/QueueListAnimator'
import { formatSeconds } from 'lib/dateTime'
import { moveItem } from '../../modules/queue'
import getMyUpcoming from '../../selectors/getMyUpcoming'
import getPlayerHistory from '../../selectors/getPlayerHistory'
import getQueueSections from '../../selectors/getQueueSections'
import getRoundRobinQueue from '../../selectors/getRoundRobinQueue'
import getWaits from '../../selectors/getWaits'

const QueueList = () => {
  const artists = useAppSelector(state => state.artists)
  const { errorMessage, isAtQueueEnd, isErrored, isPlaying, position, queueId } = useAppSelector(state => state.status)

  const playerHistory = useAppSelector(getPlayerHistory)
  const queue = useAppSelector(getRoundRobinQueue)
  const sections = useAppSelector(getQueueSections)
  const myUpcoming = useAppSelector(getMyUpcoming)
  const pausedUserIds = useAppSelector(state => ensureState(state.queue).pausedUserIds)
  const songs = useAppSelector(state => state.songs)
  const starredSongs = useAppSelector(state => ensureState(state.userStars).starredSongs)
  const starCounts = useAppSelector(state => state.starCounts)
  const user = useAppSelector(state => state.user)
  const waits = useAppSelector(getWaits)
  const queueTab = useAppSelector(state => state.ui.queueTab)

  // actions
  const dispatch = useAppDispatch()
  const handleMoveClick = (qId: number) => {
    // reference user's last-played item as the new prevQueueId
    const userId = queue.entities[qId].userId
    let lastPlayed = queueId // default in case user has no played items

    for (let i = queue.result.indexOf(queueId); i >= 0; i--) {
      if (queue.entities[queue.result[i]].userId === userId) {
        lastPlayed = queue.result[i]
        break
      }
    }

    dispatch(moveItem({ queueId: qId, prevQueueId: lastPlayed }))
  }

  // "queue"/"me" are upcoming only; "history" is what's been sung, newest first
  const result = queueTab === 'history'
    ? [...sections.played].reverse()
    : queueTab === 'me'
      ? myUpcoming
      : sections.upcoming

  // reorder my own upcoming songs; the item lands after the one now above it
  const handleDragEnd = ({ source, destination }: DropResult) => {
    if (!destination || destination.index === source.index) return

    const qId = result[source.index]
    const rest = result.filter(id => id !== qId)

    if (destination.index === 0) {
      handleMoveClick(qId) // same as "move to top"
    } else {
      dispatch(moveItem({ queueId: qId, prevQueueId: rest[destination.index - 1] }))
    }
  }

  const renderItem = (qId: number, dragHandleProps?: DraggableProvidedDragHandleProps | null) => {
    const item = queue.entities[qId]
    const duration = songs.entities[item.songId].duration
    const isCurrent = (qId === queueId) && !isAtQueueEnd
    const isUpcoming = qId !== queueId && !playerHistory.includes(qId)
    const isOwner = item.userId === user.userId
    const isPaused = isUpcoming && pausedUserIds.includes(item.userId)

    return (
      <QueueItem
        {...item}
        artist={artists.entities[songs.entities[item.songId].artistId].name}
        dragHandleProps={dragHandleProps}
        errorMessage={isCurrent && errorMessage ? errorMessage : ''}
        isCurrent={isCurrent}
        key={qId}
        isErrored={isCurrent && isErrored}
        isMovable={isUpcoming && !isPaused && user.isAdmin && queueTab !== 'me'}
        isOwner={isOwner}
        isPaused={isPaused}
        isPlayed={!isUpcoming && !isCurrent}
        isPlaying={isCurrent && isPlaying}
        isRemovable={isUpcoming && (isOwner || user.isAdmin)}
        isReplayable={(!isUpcoming || isCurrent) && (user.isAdmin || isOwner)}
        isSkippable={isCurrent && (user.isAdmin || isOwner)}
        isStarred={starredSongs.includes(item.songId)}
        isUpcoming={isUpcoming}
        pctPlayed={isCurrent ? position / duration * 100 : 0}
        showStar={queueTab !== 'me'}
        starCount={starCounts.songs[item.songId] || 0}
        title={songs.entities[item.songId].title}
        wait={isPaused ? '' : formatSeconds(waits[qId], true)} // fuzzy
        // actions
        onMoveClick={handleMoveClick}
      />
    )
  }

  if ((queueTab === 'me' || (queueTab === 'queue' && user.isAdmin)) && result.length > 1) {
    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId='myQueue'>
          {provided => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {result.map((qId, i) => (
                <Draggable draggableId={String(qId)} index={i} key={qId}>
                  {dragProvided => (
                    <div ref={dragProvided.innerRef} {...dragProvided.draggableProps}>
                      {renderItem(qId, dragProvided.dragHandleProps)}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    )
  }

  return <QueueListAnimator queueItems={result.map(qId => renderItem(qId))} />
}

export default QueueList
