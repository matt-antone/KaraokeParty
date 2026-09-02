import { Store } from '@reduxjs/toolkit'
import { persistStore } from 'redux-persist'

let persistor: ReturnType<typeof persistStore>

export const init = (store: Store, cb: () => void) => (persistor = persistStore(store, null, cb))

export const get = () => {
  if (!persistor) throw new Error('persistor not initialized')
  return persistor
}
