import { NextFunction, Request, Response } from 'express'
import { verifyAccessToken } from '../utils/jwt.js'

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization

    if (!header || !header.startsWith('Bearer')) {
        res.status(401).json({ error: 'Missing or invalid authorization hearder' })
        return
    }
    const token = header.split(' ')[1]

    try {
        const { payload } = await verifyAccessToken(token)
        req.user = { id: payload.sub as string }
        next()
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' })
    }
}
