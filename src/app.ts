import cookieParser from 'cookie-parser'
import express from 'express'
import { errorHandler } from './middleware/errorHandler.middleware.js'
import { authRoutes } from './routes/auth.routes.js'
import { movieRoutes } from './routes/movie.routes.js'
import { watchlistRoutes } from './routes/watchlist.routes.js'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { prisma } from './config/db.js'

// General limiter: 100 per 15 min
const generalRateLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: process.env.NODE_ENV == 'test' ? 10000 : 100,
})

// Strict limiter for auth: 5 attemplts per 15 min
const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: process.env.NODE_ENV == 'test' ? 1000 : 5,
})

export const app = express()
app.use(express.json())
app.use(cors())
app.use(helmet())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(generalRateLimiter)
app.use('/movies', movieRoutes)
app.use('/auth', authLimiter, authRoutes)
app.use('/watchlist', watchlistRoutes)

// errorHandler needs to be mounted after all routes
app.use(errorHandler)

app.get('/health', async (_req, res) => {
    try {
        await prisma.$queryRaw(`SELECT 1`)
        res.json({ status: 'ok', database: 'connected' })
    } catch {
        res.status(503).json({ status: 'error', database: 'disconnected' })
    }
})
