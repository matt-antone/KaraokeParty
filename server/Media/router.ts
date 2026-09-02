import fs from 'fs'
import fsPromises from 'node:fs/promises'
import { Readable } from 'stream'
import path from 'path'
import { unzip } from 'unzipit'
import getLogger from '../lib/Log.js'
import getCdgName from '../lib/getCdgName.js'
import { getExt, requireAdmin } from '../lib/util.js'
import KoaRouter from '@koa/router'
import Media from './Media.js'
import Prefs from '../Prefs/Prefs.js'
import fileTypes from './fileTypes.js'
const log = getLogger('Media')
const router = new KoaRouter({ prefix: '/api/media' })

const audioExts = Object.keys(fileTypes).filter(ext => fileTypes[ext].mimeType.startsWith('audio/'))

// stream a media file
router.get('/:mediaId', requireAdmin, async (ctx) => {
  const { type } = ctx.query

  const mediaId = parseInt(ctx.params.mediaId, 10)

  if (Number.isNaN(mediaId) || !type) {
    ctx.throw(422, 'invalid mediaId or type')
  }

  // get media info
  const res = Media.search({ mediaId })

  if (!res.result.length) {
    ctx.throw(404, 'mediaId not found')
  }

  const { pathId, relPath } = res.entities[mediaId]

  // get base path
  const { paths } = Prefs.get()
  const basePath = paths.entities[pathId].path

  let file = path.join(basePath, relPath)
  let buffer

  if (getExt(file) === '.zip') {
    const { entries } = await unzip(new Uint8Array(await fsPromises.readFile(file)))
    let entry

    if (type === 'cdg') {
      entry = Object.keys(entries).find(f => !f.includes('/') && getExt(f) === '.cdg')
      if (!entry) ctx.throw(404, 'No .cdg file found in archive')
    } else {
      entry = Object.keys(entries).find(f => !f.includes('/') && audioExts.includes(getExt(f)))
      if (!entry) ctx.throw(404, 'No valid audio file found in archive')
    }

    ctx.length = entries[entry].size
    ctx.type = fileTypes[getExt(entry)]?.mimeType
    buffer = Buffer.from(await entries[entry].arrayBuffer())
  } else {
    if (type === 'cdg') {
      const cdg = getCdgName(file)
      if (!cdg) ctx.throw(404, 'The .cdg file could not be found')
      file = cdg
    }

    const stats = await fsPromises.stat(file)
    ctx.length = stats.size
    ctx.type = fileTypes[getExt(file)]?.mimeType
  }

  if (!ctx.type) ctx.throw(404, `Unknown MIME type: ${file}`)

  log.verbose('streaming %s (%sMB): %s', ctx.type, (ctx.length / 1000000).toFixed(2), file)
  ctx.body = buffer ? Readable.from(buffer) : fs.createReadStream(file)
})

export default router
