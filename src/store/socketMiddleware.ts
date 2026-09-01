import { Action, Middleware, UnknownAction } from '@reduxjs/toolkit'
import { BEGIN, COMMIT, REVERT } from 'redux-optimistic-ui'
import { Socket } from 'socket.io-client'
import { OptimisticAction } from './store'

// optimistic actions need a transaction id to match BEGIN to COMMIT/REVERT
let transactionID = 0

export default function createSocketMiddleware (socket: Socket, prefix: string): Middleware {
  return (store) => {
    // attach handler for incoming actions (from server)
    socket.on('action', action => store.dispatch(action))

    return next => (action: Action | OptimisticAction) => {
      // dispatch normally if it's not a socket.io request
      if (!action.type || !action.type.startsWith(prefix)) {
        return next(action)
      }

      const hasMeta = 'meta' in action
      const isOptimistic = hasMeta && (action.meta?.isOptimistic ?? false)

      // Claim this action's transaction id NOW, before emitting. The
      // acknowledgement fires later, and by then another optimistic action may
      // have incremented the counter — reading it inside the callback applied
      // the COMMIT/REVERT to whichever transaction happened to be last, so a
      // rejected star could survive while an unrelated in-flight one was
      // rolled back.
      const txId = isOptimistic ? ++transactionID : undefined

      socket.emit('action', action, (cbAction: UnknownAction) => {
        // make sure callback response is an action
        if (typeof cbAction !== 'object' || typeof cbAction.type !== 'string') {
          return
        }

        if (isOptimistic) {
          cbAction.meta = {
            ...('meta' in cbAction && typeof cbAction.meta === 'object' ? cbAction.meta : {}),
            optimistic: cbAction.error ? { type: REVERT, id: txId } : { type: COMMIT, id: txId },
          }
        }

        next(cbAction)
      })

      if (!isOptimistic) {
        return next(action)
      }

      // don't mutate action because we don't need to
      // emit this meta info to the server
      next({
        ...action,
        meta: {
          ...action.meta,
          optimistic: { type: BEGIN, id: txId },
        },
      })
    }
  }
}
