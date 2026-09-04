import React from 'react'
import Accordion from 'components/Accordion/Accordion'
import Icon from 'components/Icon/Icon'
import InputCheckbox from 'components/InputCheckbox/InputCheckbox'
import type { IRoomPrefs } from 'shared/types'
import styles from './BattlePrefs.css'

interface BattlePrefsProps {
  prefs: Partial<IRoomPrefs>
  onChange: (prefs: Partial<IRoomPrefs>) => void
}

const BattlePrefs = ({ onChange, prefs = {} }: BattlePrefsProps) => {
  const isEnabled = prefs?.battle?.isEnabled ?? false

  const handleSetPref = (update: Partial<IRoomPrefs['battle']>) => {
    onChange({ ...prefs, battle: { ...prefs.battle, ...update } })
  }

  return (
    <Accordion
      headingComponent={(
        <div className={styles.heading}>
          <Icon icon='FLAG' />
          <div>Battle</div>
        </div>
      )}
    >
      <div className={styles.content}>
        <div>
          <InputCheckbox
            label='Allow song battles'
            checked={isEnabled}
            onChange={event => handleSetPref({ isEnabled: event.currentTarget.checked })}
          />
        </div>
        {isEnabled && (
          // The one thing about battles an operator cannot work out from the
          // screen. Crowd scoring is a getUserMedia call, and browsers only
          // grant a microphone on a secure origin — localhost counts, a plain
          // http:// LAN address does not. A player opened from another laptop
          // or a phone therefore hears nothing, and rather than erroring the
          // battle just ends level, which reads as a bug in the scoring. Said
          // here in the room editor because this is where a host switches
          // battles on and forms an expectation about how they end.
          <p className={styles.note}>
            Crowd scoring listens through the microphone of whichever machine has the
            player window open, and browsers only allow that on a secure origin — in
            practice, a player opened at http://localhost on the machine running the
            server. A player opened at the LAN address cannot hear the room, so its
            battles are decided as a draw instead.
          </p>
        )}
      </div>
    </Accordion>
  )
}

export default BattlePrefs
