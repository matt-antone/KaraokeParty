import React from 'react'
import clsx from 'clsx'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { createAccount } from 'store/modules/user'
import Button from 'components/Button/Button'
import AccountForm from '../../components/AccountForm/AccountForm'
import styles from './FirstRun.css'

const FirstRun = () => {
  const ui = useAppSelector(state => state.ui)

  const dispatch = useAppDispatch()
  const handleCreate = (data: FormData) => {
    dispatch(createAccount(data))
  }

  return (
    <div className={styles.container} style={{ maxWidth: Math.max(340, ui.contentWidth * 0.66) }}>
      <h1 className={clsx('silkscreen', styles.heading)}>first run</h1>
      <p className={styles.blurb}>
        Create your admin account to get started. All data is stored locally and
        never shared.
      </p>
      <AccountForm onSubmit={handleCreate} autoFocus>
        <Button variant='primary' type='submit'>
          Create Account
        </Button>
      </AccountForm>
    </div>
  )
}

export default FirstRun
