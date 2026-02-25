import { Router } from 'express'
import {
    createMovie,
    deleteMovie,
    getAllMovies,
    getMovieById,
    updateMovie,
} from '../controllers/movie.controller'
import { validate } from '../middleware/validate'
import { createMovieSchema, updateMovieSchema } from '../schemas/movie.schema'

export const movieRoutes = Router()

// Get all movies
movieRoutes.get('/', getAllMovies)

// Get movie by id
movieRoutes.get('/:id', getMovieById)

// Create movie
movieRoutes.post('/', validate(createMovieSchema), createMovie)

// Update movie
movieRoutes.patch('/:id', validate(updateMovieSchema), updateMovie)

// Delete movie
movieRoutes.delete('/:id', deleteMovie)
