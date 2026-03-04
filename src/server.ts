import { app } from './app.js'
import { prisma } from './config/db.js'
import { validateEnv } from './config/env.js'

validateEnv()
const PORT = process.env.PORT || 3000

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})

const shutdown = async (signal: string) => {
    console.log(`${signal} received. Shutting down...`)
    server.close(async () => {
        await prisma.$disconnect()
        console.log('### Database disconnected')
        process.exit(0)
    })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
