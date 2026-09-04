// @vitest-environment happy-dom
import React from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { UnknownAction } from '@reduxjs/toolkit'
import { battleInvite, battleSinger } from 'lib/battleFixtures'
import { BATTLE_ACCEPT, BATTLE_CANCEL, BATTLE_DECLINE } from 'shared/actionTypes'
import type { BattleInvite, BattleSinger, BattleTurn } from 'shared/types'
import BattleDialog from './BattleDialog'

/**
 * One panel with three faces, and the whole negotiation runs through it. What
 * matters is that exactly one face is up at a time and that each one is
 * addressed to the right person: the same BattleInvite object reaches BOTH
 * phones, so every face here is chosen by comparing it against who is holding
 * the phone. Get that wrong and the challenger is asked to accept their own
 * challenge.
 *
 * The invite face is also the only screen in the feature where somebody agrees
 * to something, so it is asserted on what it says as well as what it sends.
 */

// vitest globals are off, so RTL's own afterEach hook never registers
afterEach(cleanup)

const CHALLENGER_ID = 1
const OPPONENT_ID = 2

interface FakeState {
  userId?: number
  singers?: BattleSinger[]
  pending?: BattleSinger | null
  invite?: BattleInvite | null
  isRosterOpen?: boolean
}

const open = ({
  userId = OPPONENT_ID,
  singers = [],
  pending = null,
  invite = null,
  isRosterOpen = false,
}: FakeState) => {
  const dispatched: UnknownAction[] = []

  // A store stub rather than the real reducers: nothing here is testing what
  // the reducer does with these actions (battle.test.ts owns that), only that
  // the right one leaves the panel.
  const store = {
    getState: () => ({
      battle: { singers, pending, invite, turn: null as BattleTurn | null, resolvedQueueId: -1 },
      user: { userId },
    }),
    subscribe: () => () => {},
    dispatch: (action: UnknownAction) => {
      dispatched.push(action)
      return action
    },
  }

  render(
    <Provider store={store as never}>
      <MemoryRouter>
        <BattleDialog isRosterOpen={isRosterOpen} onCloseRoster={() => {}} />
      </MemoryRouter>
    </Provider>,
  )

  return { dispatched }
}

describe('BattleDialog', () => {
  it('lists the room when the roster is open', () => {
    open({
      isRosterOpen: true,
      singers: [battleSinger(), battleSinger({ userId: 5, name: 'Lone Starr' })],
    })

    expect(screen.getByRole('button', { name: 'Barf' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Lone Starr' })).toBeTruthy()
  })

  it('says the room is empty rather than showing a blank sheet', () => {
    // the state somebody is in the first time they press the key
    open({ isRosterOpen: true, singers: [] })

    expect(screen.getByText(/Nobody else is signed into this room/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Barf' })).toBeNull()
  })

  it('asks the opponent, and says what they would be agreeing to', () => {
    open({ userId: OPPONENT_ID, invite: battleInvite() })

    expect(screen.getByText(/wants to battle you/)).toBeTruthy()
    // the deal, in full: the song they would sing and the one they would owe
    expect(screen.getByText('you would sing')).toBeTruthy()
    expect(screen.getByText('Africa')).toBeTruthy()
    expect(screen.getByText('Toto')).toBeTruthy()
    expect(screen.getByText(/you pick what/)).toBeTruthy()
  })

  it('accepts and declines with the actions that mean those things', () => {
    const { dispatched } = open({ userId: OPPONENT_ID, invite: battleInvite() })

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }))
    expect(dispatched.map(a => a.type)).toEqual([BATTLE_ACCEPT])

    fireEvent.click(screen.getByRole('button', { name: 'Decline' }))
    expect(dispatched.map(a => a.type)).toEqual([BATTLE_ACCEPT, BATTLE_DECLINE])
  })

  it('shows the challenger a wait, not their own challenge to answer', () => {
    const { dispatched } = open({ userId: CHALLENGER_ID, invite: battleInvite() })

    expect(screen.getByText(/Waiting on/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Accept' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Call it off' }))
    expect(dispatched.map(a => a.type)).toEqual([BATTLE_CANCEL])
  })

  it('tells the challenger their challenge was taken', () => {
    open({ userId: CHALLENGER_ID, invite: battleInvite({ isAccepted: true }) })

    expect(screen.getByText(/accepted, and is choosing your song/)).toBeTruthy()
  })

  it('gets out of the way once this phone is off picking a song', () => {
    // Both routes into the library: the challenger holding a pending opponent,
    // and the opponent whose acceptance the server has confirmed. The banner in
    // LibraryHeader is the surface from here, and a panel over the list would
    // be covering the one thing left to do.
    open({ userId: CHALLENGER_ID, pending: battleSinger(), isRosterOpen: true })
    expect(document.querySelector('dialog')).toBeNull()
    cleanup()

    open({ userId: OPPONENT_ID, invite: battleInvite({ isAccepted: true }) })
    expect(document.querySelector('dialog')).toBeNull()
  })

  it('stays shut when nothing is happening', () => {
    open({ isRosterOpen: false })
    expect(document.querySelector('dialog')).toBeNull()

    // and the same assertion is worth something: an open roster does render one
    cleanup()
    open({ isRosterOpen: true, singers: [battleSinger()] })
    expect(document.querySelector('dialog')).toBeTruthy()
  })
})
