import fs from 'fs'
import path from 'path'

// the sibling .cdg for a media file, matched case-insensitively since the
// filesystem may not be. null when there isn't one.
export default function getCdgName (file: string): string | null {
  const dir = path.dirname(file)
  const want = path.basename(file, path.extname(file)).toLowerCase() + '.cdg'

  try {
    const match = fs.readdirSync(dir).find(f => f.toLowerCase() === want)
    return match ? path.join(dir, match) : null
  } catch {
    return null
  }
}
