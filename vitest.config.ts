import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        fileParallelism: false,
        exclude: ['**/movie.routes.test.ts', 'node_modules'],
    },
})
