import React, { useEffect } from 'react'
import { useAppDispatch } from 'store/hooks'
import { fetchAccount } from 'store/modules/user'
import Account from '../../components/Account/Account'
import SongHistory from '../../components/SongHistory/SongHistory'

const SignedInView = () => {
  const dispatch = useAppDispatch()

  // once per mount
  useEffect(() => {
    (async () => dispatch(fetchAccount()))()
  }, [dispatch])

  return (
    <>
      <Account />
      <SongHistory />
    </>
  )
}

export default SignedInView
