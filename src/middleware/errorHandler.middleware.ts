import { NextFunction, Request, Response } from 'express'
import { Prisma } from '../generated/prisma/index.js'

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    // Prisma: record not found (update/delete  non-existent)
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        const prismaError = err as Prisma.PrismaClientKnownRequestError
        if (prismaError.code === 'P2025') {
            res.status(404).json({ error: 'Record not found' })
            return
        }
    }

    // Fallback for any other error
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
}
