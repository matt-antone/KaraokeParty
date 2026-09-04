import React from 'react'
import clsx from 'clsx'
import { useNavigate } from 'react-router'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import Button from 'components/Button/Button'
import Modal from 'components/Modal/Modal'
import UserImage from 'components/UserImage/UserImage'
import {
  acceptBattle,
  cancelBattle,
  declineBattle,
  startBattlePick,
} from 'store/modules/battle'
import type { BattleInvite, BattleSinger } from 'shared/types'
import styles from './BattleDialog.css'

interface BattleDialogProps {
  /** The Battle key in the header has been pressed and the roster has not been
   *  dismissed. Only ever enables the roster face — an arriving challenge
   *  outranks it, because somebody is waiting on an answer. */
  isRosterOpen: boolean
  onCloseRoster: () => void
}

/**
 * The whole negotiation, on a phone, in one panel.
 *
 * Three faces and never more than one: choosing who to fight, answering
 * somebody who chose you, and waiting on the answer. They are one component
 * because they are one conversation — which face is up is a fact about
 * state.battle, not about which screen you happen to be on, and a challenge
 * has to reach you on the Queue tab as readily as in the library.
 *
 * Deliberately in the app's own deck language rather than the arcade language
 * the TV speaks during the fight itself. A fighting-game splash on a five-inch
 * screen in a dark room is illegible, and what the phone is being asked for
 * here is a decision, not a spectacle. The two fighters still read as the same
 * two channels the TV uses — crimson for the challenger, moss for the
 * opponent — so the surfaces agree about who is who.
 */

/* The same three lines of song, under two different legends: the invite says
   what you would have to sing, the wait says what you picked for them. Naming
   it once is what stops the two drifting into different type sizes the first
   time either is touched. */
const SongCard = ({ legend, invite }: { legend: string, invite: BattleInvite }) => (
  <div className={styles.song}>
    <div className={clsx('silkscreen', styles.legend)}>{legend}</div>
    <div className={styles.songTitle} translate='no'>{invite.title}</div>
    <div className={styles.songArtist} translate='no'>{invite.artist}</div>
  </div>
)

const BattleDialog = ({ isRosterOpen, onCloseRoster }: BattleDialogProps) => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const userId = useAppSelector(state => state.user.userId)
  const singers = useAppSelector(state => state.battle.singers)
  const invite = useAppSelector(state => state.battle.invite)
  const isPicking = useAppSelector(state => state.battle.pending !== null)

  const handlePickOpponent = (singer: BattleSinger) => {
    dispatch(startBattlePick(singer))
    onCloseRoster()
    // The library is the next step of the same tap, not a place to be sent and
    // left to work it out: LibraryHeader is already wearing the banner saying
    // who this is for by the time the screen arrives.
    navigate('/library')
  }

  // This phone is off choosing a song. The library's banner is the surface
  // now, and a panel over the list would be in the way of the one thing left
  // to do.
  if (isPicking) return null

  if (invite) {
    const isChallenger = invite.challengerUserId === userId

    // Somebody has picked a song for you and is waiting. This is the only
    // screen in the feature where a person agrees to something, so it says the
    // whole deal — what you would sing, and what you would owe.
    if (!isChallenger) {
      if (invite.isAccepted) return null // accepted: you are off to the library

      return (
        <Modal
          className={styles.modal}
          title='Challenge'
          onClose={() => dispatch(declineBattle())}
          buttons={(
            <>
              <Button variant='primary' onClick={() => dispatch(acceptBattle())}>Accept</Button>
              <Button variant='default' onClick={() => dispatch(declineBattle())}>Decline</Button>
            </>
          )}
        >
          <p className={styles.lede}>
            <span className={styles.who} translate='no'>{invite.challengerName}</span>
            {' wants to battle you.'}
          </p>

          <SongCard legend='you would sing' invite={invite} />

          <p className={styles.fine}>
            {'Accept and you pick what '}
            <span translate='no'>{invite.challengerName}</span>
            {' sings. One song each, back to back, and the room decides.'}
          </p>
        </Modal>
      )
    }

    // Your own challenge, in flight. Both halves of the wait are the same
    // panel because they are the same wait from where you are standing — the
    // only thing that changes is whether the answer has come back yet.
    return (
      <Modal
        className={styles.modal}
        title='Battle'
        onClose={() => dispatch(cancelBattle())}
        buttons={<Button variant='default' onClick={() => dispatch(cancelBattle())}>Call it off</Button>}
      >
        <p className={styles.lede}>
          {invite.isAccepted ? '' : 'Waiting on '}
          <span className={styles.who} translate='no'>{invite.opponentName}</span>
          {invite.isAccepted ? ' accepted, and is choosing your song.' : '.'}
        </p>

        <SongCard legend='you picked for them' invite={invite} />
      </Modal>
    )
  }

  if (!isRosterOpen) return null

  return (
    <Modal
      className={styles.modal}
      title='Battle'
      onClose={onCloseRoster}
      scrollable
    >
      {singers.length === 0
        ? (
            // A room of one is the state somebody is in when they first press
            // the key, and a blank sheet reads as broken rather than as empty.
            <p className={styles.empty}>
              Nobody else is signed into this room yet. A battle needs two.
            </p>
          )
        : (
            <>
              <p className={styles.lede}>Who are you taking on?</p>

              <div className={styles.roster}>
                {singers.map(singer => (
                  <button
                    key={singer.userId}
                    type='button'
                    className={styles.singer}
                    onClick={() => handlePickOpponent(singer)}
                  >
                    <UserImage
                      className={styles.avatar}
                      userId={singer.userId}
                      dateUpdated={singer.dateUpdated}
                    />
                    <span className={styles.singerName} translate='no'>{singer.name}</span>
                  </button>
                ))}
              </div>

              <p className={styles.fine}>
                You pick their song, they pick yours, and it costs you the turn
                you already have.
              </p>
            </>
          )}
    </Modal>
  )
}

export default BattleDialog
