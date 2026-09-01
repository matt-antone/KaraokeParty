import React from 'react'
import Button from 'components/Button/Button'
import VuMeter from 'components/VuMeter/VuMeter'
import styles from './ProgressBar.css'

interface ProgressBarProps {
  isActive: boolean
  onCancel: () => void
  pct: number
  text: string
}

export default class ProgressBar extends React.Component<ProgressBarProps> {
  state = {
    isCanceling: false,
    isVisible: false,
  }

  handleCancelClick = () => {
    if (this.props.isActive && !this.state.isCanceling) {
      this.setState({ isCanceling: true })
      this.props.onCancel()
    } else {
      this.setState({ isVisible: false })
    }
  }

  componentDidUpdate (prevProps: ProgressBarProps) {
    if (this.props.isActive && !prevProps.isActive) {
      this.setState({ isVisible: true, isCanceling: false })
    } else if (this.state.isCanceling && this.props.text !== prevProps.text) {
      // only show 'Stopping...' until the next update
      this.setState({ isCanceling: false })
    }
  }

  render () {
    const { state, props } = this
    if (!state.isVisible) return null

    return (
      <div className={styles.container}>
        <div className={styles.row}>
          <p className={styles.text}>{state.isCanceling ? 'Stopping...' : props.text}</p>
          <Button
            className={props.isActive ? styles.cancel : styles.close}
            icon='CLEAR'
            onClick={this.handleCancelClick}
            size={40}
          />
        </div>
        {/* peaking off: a scan at 90% is good news, so it must never flash red */}
        <VuMeter
          value={props.pct / 100}
          segments={20}
          peakFrom={2}
          height={6}
          label='Scan progress'
        />
      </div>
    )
  }
}
