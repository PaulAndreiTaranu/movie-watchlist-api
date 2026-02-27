import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'

const connectionString = `${process.env.DATABASE_URL}`
const adapter = new PrismaPg({ connectionString })

export const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    adapter,
})

export const connectDB = async () => {
    try {
        await prisma.$connect()
        console.log('### DB connected via prisma')
    } catch (error) {
        console.log(`### Database connection error: ${(error as Error).message}`)
        process.exit(1)
    }
}

export const disconnectDB = async () => {
    await prisma.$disconnect()
}
