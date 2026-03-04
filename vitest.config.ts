import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        fileParallelism: false,
        include: ['src/**/*.test.ts'],
        testTimeout: 10000,
        setupFiles: ['src/tests/setup.ts'],
        coverage: {
            provider: 'v8',
            include: ['src/**.*.ts'],
            exclude: ['src/generated/**', 'src/server.ts', 'src/types/**'],
        },
        // exclude: ['**/movie.routes.test.ts', '**/auth.routes.test.ts', 'node_modules'],
    },
})
