import argon2 from 'argon2'
import { NextFunction, Request, Response } from 'express'
import { randomUUID } from 'node:crypto'
import { prisma } from '../config/db.js'
import {
    REFRESH_TOKEN_EXPIRY_MS,
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
} from '../utils/jwt.js'

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
}

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
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
        },
    })

    res.cookie('refreshToken', refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: REFRESH_TOKEN_EXPIRY_MS,
    })

    return accessToken
}

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password } = req.body

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

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.refreshToken
        if (!token) {
            res.status(401).json({ error: 'No refresh token' })
            return
        }

        // Verify the JWT signature and extract the payload
        const { payload } = await verifyRefreshToken(token)
        const tokenId = payload.jti as string
        const userId = payload.sub as string

        // Find the token record on the database
        const storedToken = await prisma.refreshToken.findUnique({
            where: { id: tokenId },
        })
        if (!storedToken) {
            res.status(401).json({ error: 'Invalid refresh token' })
            return
        }
        // Verify the cookie value matches the stored hash
        const valid = await argon2.verify(storedToken.hashed, token)
        if (!valid) {
            res.status(401).json({ error: 'Invalid refresh token' })
            return
        }

        // Delete the old token (token rotation)
        await prisma.refreshToken.delete({ where: { id: tokenId } })

        // Issue new pair of tokens
        const accessToken = await issueTokens(userId, res)

        res.json({ accessToken })
    } catch (error) {
        next(error)
    }
}

export const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.refreshToken

        if (token) {
            try {
                const { payload } = await verifyRefreshToken(token)
                await prisma.refreshToken.delete({
                    where: { id: payload.jti as string },
                })
            } catch {
                // Invalid token
            }
        }

        res.clearCookie('refreshToken', { ...COOKIE_OPTIONS })
        res.json({ message: 'Logged out' })
    } catch (error) {
        next(error)
    }
}
