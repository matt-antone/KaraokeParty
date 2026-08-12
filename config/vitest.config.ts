import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  // mirrors webpack's resolve.modules/alias so client code is importable in tests
  resolve: {
    alias: ['components', 'lib', 'routes', 'store', 'styles', 'types'].reduce(
      (alias, dir) => ({ ...alias, [dir]: path.resolve(__dirname, '../src', dir) }),
      { shared: path.resolve(__dirname, '../shared') },
    ),
  },
  test: {
    setupFiles: [path.resolve(__dirname, '../server/lib/test-setup.ts')],
  },
})
