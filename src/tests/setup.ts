import { afterAll } from 'vitest'
import { prisma, prismaDeleteAll } from '../config/db.js'

afterAll(async () => {
    await prismaDeleteAll()
    await prisma.$disconnect()
})
