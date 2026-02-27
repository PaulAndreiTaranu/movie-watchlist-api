import argon2 from 'argon2'
import { NextFunction, Request, Response } from 'express'
import { prisma } from '../config/db.js'
import { REFRESH_TOKEN_EXPIRY_MS, signAccessToken, signRefreshToken } from '../utils/jwt.js'
import { randomUUID } from 'node:crypto'

const issueTokens = async (userId: string, res: Response) => {
    const tokenId = randomUUID()

    const [accessToken, refreshToken] = await Promise.all([
        signAccessToken(userId),
        signRefreshToken(userId, tokenId),
    ])

    const hashed = await argon2.hash(refreshToken)

    await prisma.refreshToken.create({
        data: {
            id: tokenId,
            userId,
            hashed,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
    })

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: REFRESH_TOKEN_EXPIRY_MS,
    })

    return accessToken
}

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password } = req.body

        // Sanity checks
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' })
        }

        // Check if user already exists
        const userExists = await prisma.user.findUnique({ where: { email } })
        if (userExists) {
            res.status(409).json({ error: 'Email already registered' })
            return
        }

        // Hash password
        const hashedPass = await argon2.hash(password)

        // Create new user in the db
        const user = await prisma.user.create({
            data: { name, email, password: hashedPass },
        })

        // Create a new refresh token in the db and return a access token
        const accessToken = await issueTokens(user.id, res)

        res.status(201).json({
            user: { id: user.id, name: user.name, email: user.email },
            accessToken,
        })
    } catch (error) {
        next(error)
    }
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body

        // Sanity checks
        if (!email || !password) {
            res.status(401).json({ error: 'Email and password are required' })
            return
        }

        // Check if user already exists
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
            res.status(401).json({ error: 'Invalid email or password' })
            return
        }
        const validPass = await argon2.verify(user.password, password)
        if (!validPass) {
            res.status(401).json({ error: 'Invalid email or password' })
            return
        }

        const accessToken = await issueTokens(user.id, res)

        res.status(200).json({
            user: { id: user.id, name: user.name, email: user.email },
            accessToken,
        })
    } catch (error) {
        next(error)
    }
}
