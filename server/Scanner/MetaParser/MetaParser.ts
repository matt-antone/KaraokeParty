import getLogger from '../../lib/Log.js'
import jsone from 'json-e'
import defaultMiddleware from './defaultMiddleware.js'
const log = getLogger('MetaParser')
const parserCfgProps = ['articles', 'artistOnLeft', 'delimiter']

const customFunctions = {
  replace: (predicate, search, ...args) => {
    return args.length === 1
      ? predicate.replace(search, args[0])
      : predicate.replace(new RegExp(search, args[0]), args[1])
  },
}

const MetaParser = (userCfg = {}) => {
  const parserCfg: { articles?: string[] } = {}
  const template = {}

  // we accept parser config and JSON-e template items (both
  // user-supplied) in a flat object format; separate them here
  for (const [key, val] of Object.entries(userCfg)) {
    if (parserCfgProps.includes(key)) parserCfg[key] = val
    else template[key] = val
  }

  parserCfg.articles ??= ['A', 'An', 'The']
  const isUserTemplate = !!Object.keys(template).length

  return (scannerCtx) => {
    let ctx = {
      cfg: parserCfg,
      ...scannerCtx,
    }

    for (const step of defaultMiddleware.values()) step(ctx)

    if (isUserTemplate) {
      const res = jsone(template, { ...ctx, ...customFunctions })

      Object.keys(res).forEach((key) => {
        if (typeof res[key] === 'string') res[key] = res[key].trim()
      })

      if (res.artist) res.artistNorm = res.artistNorm ?? res.artist
      if (res.title) res.titleNorm = res.titleNorm ?? res.title

      log.debug('User template:')
      log.debug(template)
      log.debug('Result:')
      log.debug(res)

      ctx = { ...ctx, ...res }
    }

    if (!ctx.artist || !ctx.title) {
      throw new Error('could not determine artist or title')
    }

    return {
      artist: ctx.artist,
      artistNorm: ctx.artistNorm ?? ctx.artist,
      title: ctx.title,
      titleNorm: ctx.titleNorm ?? ctx.title,
      tags: ctx.tags ?? [],
    }
  }
}

export default MetaParser
