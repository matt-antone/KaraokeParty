// short and pre-formatted for display, e.g. "Aug 29"
export function formatShortDate (dateObj: Date) {
  return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatDuration (sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60

  return `${m}:${s < 10 ? '0' + s : s}`
}

export function formatSeconds (sec: number, fuzzy = false) {
  if (sec >= 60 && fuzzy) return Math.round(sec / 60) + 'm'

  const m = Math.floor(sec / 60)
  const s = sec % 60

  return m ? `${m}m ${s}s` : `${s}s`
}
