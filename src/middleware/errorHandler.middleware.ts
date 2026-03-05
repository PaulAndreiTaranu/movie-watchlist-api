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
        if (prismaError.code === 'P2002') {
            res.status(409).json({ error: 'Record already exists' })
            return
        }
    }

    // Log full error to server-side
    console.error(err)

    // Only safe messages to client - don't expose stack traces
    res.status(500).json({
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    })
}
