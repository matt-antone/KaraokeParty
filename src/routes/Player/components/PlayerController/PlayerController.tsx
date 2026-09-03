import React, { useEffect, useCallback, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import Player from '../Player/Player'
import PlayerBackdrop from '../PlayerBackdrop/PlayerBackdrop'
import PlayerTextOverlay from '../PlayerTextOverlay/PlayerTextOverlay'
import PlayerQR from '../PlayerQR/PlayerQR'
import PlayerTrivia from '../PlayerTrivia/PlayerTrivia'
import getRoundRobinQueue from 'routes/Queue/selectors/getRoundRobinQueue'
import { playerLeave, playerError, playerLoad, playerPlay, playerStatus, type PlayerState } from '../../modules/player'
import getRoomPrefs from '../../selectors/getRoomPrefs'
import useTriviaStage from 'lib/useTriviaStage'
import { requestTriviaRound } from 'store/modules/trivia'
import getSkipEndsAt, { INTERMISSION_MS } from './getSkipEndsAt'
import { SONG_PLAYED } from 'shared/actionTypes'
import { isTriviaItem, type QueueItem } from 'shared/types'

interface PlayerControllerProps {
  width: number
  height: number
}

// how long before a song ends to tease the next singer
const UP_NEXT_SECS = 15

const PlayerController = (props: PlayerControllerProps) => {
  const queue = useAppSelector(getRoundRobinQueue)
  const player = useAppSelector(state => state.player)
  const playerVisualizer = useAppSelector(state => state.playerVisualizer)
  const prefs = useAppSelector(state => state.prefs)
  const roomPrefs = useAppSelector(getRoomPrefs)
  // Two views of the same round, and they are not interchangeable. The live
  // one expires with the countdown and drives *when* the player moves on; the
  // stored one persists between questions and drives *what is on screen*, so
  // the stage does not blink out during every reveal.
  const liveTrivia = useTriviaStage()
  const trivia = useAppSelector(state => state.trivia)
  const resolvedQueueId = trivia.resolvedQueueId
  const queueItem = queue.entities[player.queueId]
  const nextIdx = queue.result.indexOf(player.queueId) + 1
  const nextQueueItem = queue.entities[queue.result[nextIdx]]
  // the two singers after the next one, shown during the intermission
  const comingUpQueueItems = queue.result.slice(nextIdx + 1, nextIdx + 3).map(id => queue.entities[id])
  const comingUpSongTitles = useAppSelector(state => comingUpQueueItems.map(item => state.songs.entities[item.songId]?.title))
  const nextSong = useAppSelector(state => nextQueueItem ? state.songs.entities[nextQueueItem.songId] : undefined)
  const nextArtist = useAppSelector(state => nextSong ? state.artists.entities[nextSong.artistId] : undefined)
  // the corner panel names the singer *and* their song, so the player needs the current one too
  const song = useAppSelector(state => queueItem ? state.songs.entities[queueItem.songId] : undefined)
  const artist = useAppSelector(state => song ? state.artists.entities[song.artistId] : undefined)

  const dispatch = useAppDispatch()
  // set only when a song ends on its own; stays until the next one does. It's stamped with what
  // was playing so it can be *derived* away below instead of cleared (setState in an effect)
  const [intermission, setIntermission] = useState<{
    endsAt: number
    queueId: number
    replayTime: number
  } | null>(null)

  const isIntermission = !!intermission
    && intermission.queueId === player.queueId
    && intermission.replayTime === player._lastReplayTime

  const skipEndsAt = getSkipEndsAt(player, !!nextQueueItem, isIntermission)

  // A trivia round takes its turn in the gap between two singers, so while one
  // is running it *is* the intermission and the next song waits for it. The
  // reveal carries its own end so the room gets to see the answer and the
  // scoreboard before the music starts again.
  const intermissionEndsAt = skipEndsAt ?? (isIntermission ? intermission.endsAt : null)

  // The current queue row is a trivia round rather than a song. It takes its
  // turn exactly as a singer's row does: the player stops here, asks the
  // question, and moves on when the round is done.
  const isTriviaRow = isTriviaItem(queueItem)
  const isTriviaOnStage = isTriviaRow && trivia.round?.queueId === player.queueId

  const handleStatus = useCallback((status?: Partial<PlayerState>) => dispatch(playerStatus(status)), [dispatch])
  const handleLoad = () => dispatch(playerLoad())
  const handlePlay = () => dispatch(playerPlay())
  const handleError = (msg: string) => {
    dispatch(playerError(msg))
    handleStatus()
  }

  const handleReplay = useCallback((queueId: number) => {
    const nextItem = queue.entities[queueId]
    if (!nextItem) return

    const history = JSON.parse(player.historyJSON)

    if (queueId !== player.queueId) {
      // reset history up to and including the replaying queueId
      const idx = history.lastIndexOf(queueId)
      if (idx !== -1) history.splice(idx)
    }

    handleStatus({
      historyJSON: JSON.stringify(history),
      isAtQueueEnd: false,
      isPlaying: true,
      isVideoKeyingEnabled: nextItem.isVideoKeyingEnabled,
      mediaType: nextItem.mediaType,
      position: 0,
      queueId: nextItem.queueId,
      nextUserId: null,
      _isReplayingQueueId: null,
    })
  }, [handleStatus, player.historyJSON, player.queueId, queue.entities])

  const handleLoadNext = useCallback(() => {
    const history = JSON.parse(player.historyJSON)

    // add current item to history (once)
    if (queueItem && history.lastIndexOf(queueItem.queueId) === -1) {
      history.push(queueItem.queueId)

      // a song counts as sung once it leaves the stage, however it left. A
      // skip is still a turn taken, and the singer who cut their own song
      // short should not have it missing from Sung Tonight. This is the one
      // path every song departs through, and addPlay upserts, so a replay
      // that comes back through here just refreshes dateSung.
      //
      // A trivia round departs through here too and is nobody's song. Said
      // out loud rather than left to addPlay's INNER JOIN quietly matching
      // nothing on a null songId, which works by accident and would stop
      // working the day that join changed.
      if (!isTriviaItem(queueItem)) {
        dispatch({ type: SONG_PLAYED, payload: { queueId: queueItem.queueId } })
      }
    }

    // queue exhausted?
    if (!nextQueueItem) {
      handleStatus({
        historyJSON: JSON.stringify(history),
        isAtQueueEnd: true,
        mediaType: null,
        _isPlayingNext: false,
      })

      return
    }

    // play next
    handleStatus({
      historyJSON: JSON.stringify(history),
      isAtQueueEnd: false,
      isPlaying: true,
      isVideoKeyingEnabled: nextQueueItem.isVideoKeyingEnabled,
      mediaType: nextQueueItem.mediaType,
      position: 0,
      queueId: nextQueueItem.queueId,
      nextUserId: null,
      _isPlayingNext: false,
    })
  }, [dispatch, handleStatus, nextQueueItem, player.historyJSON, queueItem])

  // the queue can change while we're waiting, so the timer calls the latest handleLoadNext
  const loadNextRef = useRef(handleLoadNext)
  useEffect(() => {
    loadNextRef.current = handleLoadNext
  }, [handleLoadNext])

  // song finished on its own: hold for the intermission before loading the next one
  const handleMediaEnd = useCallback(() => {
    // Neither the history dispatch nor a timer to clear lives here any more:
    // a song is recorded as sung on the way out through handleLoadNext, and
    // the intermission's timer is owned by the effect below so it can re-arm
    // when a trivia round claims the gap.

    // nothing to wait for at the end of the queue
    if (!nextQueueItem) {
      handleLoadNext()
      return
    }

    setIntermission({
      endsAt: Date.now() + INTERMISSION_MS,
      queueId: player.queueId,
      replayTime: player._lastReplayTime,
    })
  }, [handleLoadNext, nextQueueItem, player.queueId, player._lastReplayTime])

  // Reached a trivia row: ask the room's question. The server decides whether
  // there is one to ask — it owns the shuffle and the countdown, so two
  // players in a room cannot disagree about the answer.
  useEffect(() => {
    if (!isTriviaRow || !player.isPlaying) return
    if (resolvedQueueId === player.queueId) return

    dispatch(requestTriviaRound(player.queueId))
  }, [dispatch, isTriviaRow, player.isPlaying, player.queueId, resolvedQueueId])

  // The round is done with this row — its last question has been answered and
  // revealed, or there was nothing to ask. Both halves are needed: the resolve
  // alone would cut the final scoreboard off, and the expiry alone would move
  // on in the gap between asking and the first question arriving.
  useEffect(() => {
    if (!isTriviaRow) return
    if (resolvedQueueId !== player.queueId) return
    if (liveTrivia.round || liveTrivia.result) return // reveal still on screen

    handleLoadNext()
  }, [handleLoadNext, isTriviaRow, liveTrivia.result, liveTrivia.round, player.queueId, resolvedQueueId])

  // "lock in" the next user that isn't the currently up user, if possible
  useEffect(() => {
    if (!player.nextUserId || queueItem?.userId === nextQueueItem?.userId) {
      for (let i = queue.result.indexOf(queueItem?.queueId) + 1; i < queue.result.length; i++) {
        if (queueItem?.userId !== queue.entities[queue.result[i]].userId) {
          handleStatus({ nextUserId: queue.entities[queue.result[i]].userId })
          return
        }
      }
    }
  }, [handleStatus, nextQueueItem, player.nextUserId, queue, queueItem])

  // always emit status when any of these change
  useEffect(() => handleStatus({ isVideoKeyingEnabled: queueItem?.isVideoKeyingEnabled }), [
    handleStatus,
    player.cdgAlpha,
    player.cdgSize,
    player.isPlaying,
    player.mp4Alpha,
    player.volume,
    playerVisualizer,
    queueItem?.isVideoKeyingEnabled,
  ])

  // The intermission's own timer, owned by an effect rather than a ref so it
  // re-arms whenever the end moves — which is exactly what a trivia round
  // claiming the gap does. Same shape as the skip timer below.
  useEffect(() => {
    if (skipEndsAt || !isIntermission || !intermissionEndsAt) return

    const timerID = setTimeout(() => loadNextRef.current(), Math.max(0, intermissionEndsAt - Date.now()))
    return () => clearTimeout(timerID)
  }, [intermissionEndsAt, isIntermission, skipEndsAt])

  // on unmount
  useEffect(() => () => {
    dispatch(playerLeave())
  }, [dispatch])

  // playing for first time?
  useEffect(() => {
    if (player.isPlaying && player.queueId === -1) {
      handleLoadNext()
    }
  }, [handleLoadNext, player.isPlaying, player.queueId])

  useEffect(() => {
    if (!player._isPlayingNext) return

    if (!skipEndsAt) {
      handleLoadNext()
      return
    }

    const timerID = setTimeout(() => loadNextRef.current(), Math.max(0, skipEndsAt - Date.now()))
    return () => clearTimeout(timerID)
  }, [handleLoadNext, player._isPlayingNext, skipEndsAt])

  // history reset? empty the played list and push it, so the library's
  // greyed-out rows come back to life for everyone in the room
  useEffect(() => {
    if (player._lastHistoryResetTime) {
      handleStatus({ historyJSON: '[]' })
    }
  }, [handleStatus, player._lastHistoryResetTime])

  // replaying?
  useEffect(() => {
    if (player._isReplayingQueueId !== null) {
      handleReplay(player._isReplayingQueueId)
    }
  }, [handleReplay, player._isReplayingQueueId])

  // queue was exhausted, but is no longer?
  useEffect(() => {
    if (player.isAtQueueEnd && nextQueueItem && player.isPlaying) {
      handleLoadNext()
    }
  }, [handleLoadNext, player.isPlaying, player.isAtQueueEnd, nextQueueItem])

  // retrying after error?
  useEffect(() => {
    if (player.isErrored && player.isPlaying) {
      handleStatus({ isErrored: false })
    }
  }, [handleStatus, player.isErrored, player.isPlaying])

  // the media layer covers the stage completely; the thread field behind it stops
  // drawing whenever it does
  const isMediaVisible = !!queueItem && !isTriviaRow && !player.isErrored && !player.isAtQueueEnd && !intermissionEndsAt

  return (
    <>
      <PlayerBackdrop isCovered={isMediaVisible} />
      <Player
        cdgAlpha={player.cdgAlpha}
        cdgSize={player.cdgSize}
        isPlaying={player.isPlaying}
        isVisible={isMediaVisible}
        keyChange={queueItem?.keyChange ?? 0}
        isReplayGainEnabled={prefs.isReplayGainEnabled}
        isVideoKeyingEnabled={!!queueItem?.isVideoKeyingEnabled}
        isWebGLSupported={player.isWebGLSupported}
        mediaId={queueItem ? queueItem.mediaId : null}
        mediaKey={queueItem ? queueItem.queueId : null}
        mediaReplayKey={player._lastReplayTime}
        mediaType={queueItem ? queueItem.mediaType : null}
        mp4Alpha={player.mp4Alpha}
        onEnd={handleMediaEnd}
        onError={handleError}
        onLoad={handleLoad}
        onPlay={handlePlay}
        onStatus={handleStatus}
        rgTrackGain={queueItem ? queueItem.rgTrackGain : null}
        rgTrackPeak={queueItem ? queueItem.rgTrackPeak : null}
        visualizer={playerVisualizer}
        volume={player.volume}
        width={props.width}
        height={props.height}
      />
      {/* A round owns the whole stage for its turn, so the text overlay stands
          down rather than drawing a countdown behind it. */}
      {isTriviaOnStage
        ? (
            <PlayerTrivia
              key={trivia.round.roundId}
              round={trivia.round}
              result={trivia.result}
              width={props.width}
              height={props.height}
            />
          )
        : (
            <PlayerTextOverlay
              queueItem={queueItem as QueueItem}
              nextQueueItem={nextQueueItem as QueueItem}
              comingUpQueueItems={comingUpQueueItems as QueueItem[]}
              comingUpSongTitles={comingUpSongTitles}
              songTitle={song?.title}
              songArtist={artist?.name}
              nextSongTitle={nextSong?.title}
              nextSongArtist={nextArtist?.name}
              queueDepth={Math.max(0, queue.result.length - nextIdx)}
              isSongEnding={player.duration > 0 && player.duration - player.position <= UP_NEXT_SECS}
              isAtQueueEnd={player.isAtQueueEnd}
              isQueueEmpty={!queue.result.length}
              intermissionEndsAt={intermissionEndsAt}
              isErrored={player.isErrored}
              width={props.width}
              height={props.height}
            />
          )}
      {roomPrefs?.qr?.isEnabled && (
        <PlayerQR
          height={props.height}
          prefs={roomPrefs.qr}
          queueItem={queueItem}
        />
      )}
    </>
  )
}

export default PlayerController
