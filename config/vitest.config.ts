import { defineConfig, configDefaults } from 'vitest/config'
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
    // build/ holds compiled copies of the server tests; running them twice just
    // reports the setup file's logger init against the wrong module instance
    exclude: [...configDefaults.exclude, 'build/**'],
    setupFiles: [path.resolve(__dirname, '../server/lib/test-setup.ts')],
  },
})
