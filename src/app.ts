import express from 'express'
import { movieRoutes } from './routes/movie.routes'
import { errorHandler } from './middleware/errorHandler'

export const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/movies', movieRoutes)

// errorHandler needs to be mounted after all routes
app.use(errorHandler)

app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
})
