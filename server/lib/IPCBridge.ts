import getLogger from './Log.js'
import { _ERROR, _SUCCESS } from '../../shared/actionTypes.js'

const log = getLogger('IPCBridge')
const PROCESS_NAME = process.env.KES_CHILD_PROCESS || 'main'
const isParent = typeof process.env.KES_CHILD_PROCESS === 'undefined' // @todo

class IPC {
  static children = new Map()
  static handlers = {}
  static requests = {}
  static reqId = 0

  // parent: fan out to children (or one, by pid). child: up to the parent.
  static send (action, pid?) {
    if (!isParent) return process.send(action)

    if (!this.children.size) throw new Error('no child processes')

    if (pid) this.children.get(pid)?.send(action)
    else this.children.forEach(p => p.send(action))
  }

  // 'this' won't work when this method is passed as the message handler
  // callback, so it uses the class name
  static handle (action) {
    const { error, meta, type } = action

    // a response to a request we made?
    if (meta?.pid === process.pid && IPC.requests[meta.reqId]) {
      const { resolve, reject } = IPC.requests[meta.reqId]
      delete IPC.requests[meta.reqId]

      if (error) reject(error)
      else resolve(action.payload)
      return
    }

    if (!type || typeof IPC.handlers[type] !== 'function') {
      log.verbose(`${PROCESS_NAME}: no handler for action: ${type}`)
      return
    }

    const reply = (extra: object) => {
      if (meta?.reqId) IPC.send({ ...action, ...extra }, meta?.pid)
    }

    const res = IPC.handlers[type](action)

    // synchronous handler: fire and forget
    if (!(res instanceof Promise)) {
      reply({ type: type + _SUCCESS, payload: res })
      return
    }

    res.then((payload) => {
      reply({ type: type + _SUCCESS, payload })
      return null
    }).catch((err) => {
      reply({ type: type + _ERROR, error: err })
      log.error(`${PROCESS_NAME}: error in ipc action ${type}: ${err.message}`)
    })
  }

  // child only: send and await the parent's reply
  static req (action) {
    const reqId = ++this.reqId
    const promise = new Promise((resolve, reject) => {
      this.requests[reqId] = { resolve, reject }
    })

    this.send({ ...action, meta: { ...action.meta, reqId, pid: process.pid } })

    return promise
  }

  static addChild (subprocess) {
    subprocess.on('message', action => this.handle(action))
    this.children.set(subprocess.pid, subprocess)
  }

  static removeChild (subprocess) {
    this.children.delete(subprocess.pid)
  }

  static use (obj) {
    this.handlers = { ...this.handlers, ...obj }
  }
}

export default IPC

if (!isParent) {
  // child: handle messages from parent process
  // this also prevents child processes from automatically exiting
  process.on('message', IPC.handle)
}
