import express from 'express'
import { errorHandler } from './middleware/errorHandler.middleware.js'
import { movieRoutes } from './routes/movie.routes.js'
import { authRoutes } from './routes/auth.routes.js'
import cookieParser from 'cookie-parser'

export const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use('/movies', movieRoutes)
app.use('/auth', authRoutes)

// errorHandler needs to be mounted after all routes
app.use(errorHandler)

app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
})
