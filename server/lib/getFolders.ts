import path from 'path'
import fs from 'node:fs/promises'

const getFolders = (dir: string) => fs.readdir(dir, { withFileTypes: true })
  .then(list => list.filter(ent => ent.isDirectory()).map(ent => path.resolve(dir, ent.name)).sort())

export default getFolders
