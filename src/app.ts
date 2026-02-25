import express from 'express'
import { movieRoutes } from './routes/movie.routes'

export const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/movies', movieRoutes)

app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
})
