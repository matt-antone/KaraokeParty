import React from 'react'
import Panel from 'components/Panel/Panel'
import PathPrefs from './PathPrefs/PathPrefs'
import styles from './Prefs.css'

const Prefs = () => (
  <Panel title='Preferences' contentClassName={styles.content}>
    <PathPrefs />
  </Panel>
)

export default Prefs
