import { Router } from 'express'
import {
    createMovie,
    deleteMovie,
    getAllMovies,
    getMovieById,
    updateMovie,
} from '../controllers/movie.controller'

export const movieRoutes = Router()

// Get all movies
movieRoutes.get('/', getAllMovies)

// Get movie by id
movieRoutes.get('/:id', getMovieById)

// Create movie
movieRoutes.post('/', createMovie)

// Update movie
movieRoutes.patch('/:id', updateMovie)

// Delete movie
movieRoutes.delete('/:id', deleteMovie)
