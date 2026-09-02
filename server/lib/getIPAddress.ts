import os from 'os'

export default () => Object.values(os.networkInterfaces())
  .flat()
  .find(i => i.family === 'IPv4' && !i.internal)
  ?.address
