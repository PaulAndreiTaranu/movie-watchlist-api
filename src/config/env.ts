const required = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const

export const validateEnv = () => {
    const missing = required.filter((key) => !process.env[key])
    if (missing.length > 0) {
        console.log(`Missing required environment variables: ${missing.join(', ')}`)
        process.exit(1)
    }
}
