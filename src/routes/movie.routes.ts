import { Router } from 'express'
import {
    createMovie,
    deleteMovie,
    getAllMovies,
    getMovieById,
    updateMovie,
} from '../controllers/movie.controller.js'
import { validate } from '../middleware/validate.middleware.js'
import { createMovieSchema, updateMovieSchema } from '../schemas/movie.schema.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

export const movieRoutes = Router()

// Get all movies
movieRoutes.get('/', getAllMovies)

// Get movie by id
movieRoutes.get('/:id', getMovieById)

// Create movie
movieRoutes.post('/', authMiddleware, validate(createMovieSchema), createMovie)

// Update movie
movieRoutes.patch('/:id', authMiddleware, validate(updateMovieSchema), updateMovie)

// Delete movie
movieRoutes.delete('/:id', authMiddleware, deleteMovie)
