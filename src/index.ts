import express from 'express'
import { movieRoutes } from './routes/movie.routes'
const PORT = process.env.PORT || 3000

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/movies', movieRoutes)

app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
