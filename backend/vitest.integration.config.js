import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.js'],
    globals: true,
    environment: 'node',
    testTimeout: 30000, // 30 seconds for integration tests
    hookTimeout: 60000, // 60 seconds for setup/cleanup
    maxThreads: 1, // Run tests sequentially to avoid database conflicts
    minThreads: 1,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
        useAtomics: false,
      },
    },
  },
})