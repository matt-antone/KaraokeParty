// the default parse pipeline, in order; each step mutates ctx
const m = new Map<string, (ctx) => void>()

export default m

// ----------------------
// begin middleware stack
// ----------------------

m.set('normalize whitespace', (ctx) => {
  ctx.name = ctx.name.replace(/_/g, ' ') // underscores to spaces
  ctx.name = ctx.name.replace(/ {2,}/g, ' ') // multiple spaces to single
})

// trailing [genre, tag, tag] group; must run before de-karaoke, whose
// regex also matches [] and would eat a tag named 'vocal'
m.set('extract taxonomy', (ctx) => {
  const match = ctx.name.match(/\s*\[([^[\]]+)\]\s*$/)
  if (!match) return

  const tags = match[1].split(',')
    .map(tag => tag.trim().toLowerCase())
    .filter(tag => tag && !/karaoke|vocal/i.test(tag))

  // nothing left: it was a karaoke marker, not taxonomy; leave it for de-karaoke
  if (!tags.length) return

  ctx.tags = tags
  ctx.name = ctx.name.slice(0, match.index)
})

m.set('de-karaoke', (ctx) => {
  // 'karaoke' or 'vocal' surrounded by (), [], or {}
  ctx.name = ctx.name.replace(/[([{](?=[^([{]*$).*(?:karaoke|vocal).*[)\]}]/i, '')
})

// --------------
// parse
// --------------

// detect delimiter and split to parts
m.set('split', (ctx) => {
  const inTheStyleOf = ctx.name.match(/ in the style of /i)

  ctx.cfg = {
    delimiter: inTheStyleOf ? inTheStyleOf[0] : '-',
    artistOnLeft: !inTheStyleOf,
    ...ctx.cfg,
  }

  // allow leading and/or trailing space when searching for delimiter,
  // then pick the match with the most whitespace (longest match) as it's
  // most likely to be the actual delimiter rather than a false positive
  const d = ctx.cfg.delimiter instanceof RegExp ? ctx.cfg.delimiter : new RegExp(` ?${ctx.cfg.delimiter} ?`, 'g')
  const matches = ctx.name.match(d)

  if (!matches) {
    throw new Error('no artist/title delimiter in filename')
  }

  const longest = matches.reduce((a, b) => a.length > b.length ? a : b)
  ctx.parts = ctx.name.split(longest)

  if (ctx.parts.length < 2) {
    throw new Error('no artist/title delimiter in filename')
  }
})

m.set('clean parts', cleanParts([
  /^\d*\.?$/, // looks like a track number
  /^\W*$/, // all non-word chars
  /^[a-zA-Z]{2,6}[ -]?\d{1,}/i, // 2-6 letters followed by 1 or more digits
]))

// set title
m.set('set title', (ctx) => {
  // skip if already set
  if (ctx.title) return

  // @todo this assumes delimiter won't appear in title
  ctx.title = ctx.cfg.artistOnLeft ? ctx.parts.pop() : ctx.parts.shift()
  ctx.title = ctx.title.trim()
})

// set artist
m.set('set artist', (ctx) => {
  // skip if already set
  if (ctx.artist) return

  ctx.artist = ctx.parts.join(ctx.cfg.delimiter)
  ctx.artist = ctx.artist.trim()
})

// -----------
// post
// -----------

// remove any surrounding quotes
m.set('remove quotes', (ctx) => {
  ctx.artist = ctx.artist.replace(/^['|"](.*)['|"]$/, '$1')
  ctx.title = ctx.title.replace(/^['|"](.*)['|"]$/, '$1')
})

// some artist-specific tweaks
m.set('artist tweaks', (ctx) => {
  // Last, First [Middle] -> First [Middle] Last
  // Use negative lookahead to avoid matching when second part starts with an article (e.g., "Tyler, The Creator")
  const articles = Array.isArray(ctx.cfg.articles) ? ctx.cfg.articles.join(' |') + ' ' : ''
  const articleLookahead = articles ? `(?!${articles})` : ''
  const pattern = new RegExp(`^([\\w ]+), ${articleLookahead}(\\w+ ?\\w+)$`, 'i')
  ctx.artist = ctx.artist.replace(pattern, '$2 $1')

  // featuring/feat/ft -> ft.
  ctx.artist = ctx.artist.replace(/ featuring /i, ' ft. ')
  ctx.artist = ctx.artist.replace(/ f(ea)?t\.? /i, ' ft. ')
})

// move leading articles to end
m.set('move leading articles', (ctx) => {
  ctx.artist = moveArticles(ctx.artist, ctx.cfg.articles)
  ctx.title = moveArticles(ctx.title, ctx.cfg.articles)
})

// ---------
// normalize
// ---------
m.set('normalize artist', (ctx) => {
  // skip if already set
  if (ctx.artistNorm) return

  ctx.artistNorm = normalizeStr(ctx.artist, ctx.cfg.articles)
})

m.set('normalize title', (ctx) => {
  // skip if already set
  if (ctx.titleNorm) return

  ctx.titleNorm = normalizeStr(ctx.title, ctx.cfg.articles)
})

// ---------------------
// end middleware stack
// ---------------------

// clean left-to-right until a valid part is encountered (or only 2 parts left)
function cleanParts (patterns) {
  return function (ctx) {
    for (let i = 0; i < ctx.parts.length; i++) {
      if (patterns.some(exp => exp.test(ctx.parts[i].trim())) && ctx.parts.length > 2) {
        ctx.parts.shift()
        i--
      } else break
    }
  }
}

function normalizeStr (str, articles) {
  str = removeArticles(str, articles)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(' & ', ' and ') // normalize ampersand
    .replace(/[^\p{L}\p{N}\s\p{M}]/gu, '') // remove punctuation

  return str
}

// move leading articles to end (but before any parentheses)
function moveArticles (str, articles) {
  if (!Array.isArray(articles)) return str

  for (const article of articles) {
    const search = article + ' '

    // leading article?
    if (new RegExp(`^${search}`, 'i').test(str)) {
      const parens = /[([{].*$/.exec(str)

      if (parens) {
        str = str.substring(search.length, parens.index)
          .trim() + `, ${article} ${parens[0]}`
      } else {
        str = str.substring(search.length) + `, ${article}`
      }

      // only replace one article per string
      continue
    }
  }

  return str.trim()
}

function removeArticles (str, articles) {
  if (!Array.isArray(articles)) return str

  for (const article of articles) {
    const leading = new RegExp(`^${article} `, 'i')
    const trailing = new RegExp(`, ${article}$`, 'i')

    if (leading.test(str)) {
      str = str.replace(leading, '')
      continue // only replace one article per string
    } else if (trailing.test(str)) {
      str = str.replace(trailing, '')
      continue // only replace one article per string
    }
  }

  return str.trim()
}
