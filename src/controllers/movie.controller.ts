import { NextFunction, Request, Response } from 'express'
import { prisma } from '../config/db.js'

export const getAllMovies = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const movies = await prisma.movie.findMany()
        res.json(movies)
    } catch (error) {
        next(error)
    }
}

export const getMovieById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const movie = await prisma.movie.findUnique({
            where: { id: req.params.id as string },
        })

        if (!movie) {
            res.status(404).json({ error: 'Movie not found' })
            return
        }

        res.json(movie)
    } catch (error) {
        next(error)
    }
}

export const createMovie = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { title, overview, director, releaseYear, genres } = req.body

        const movie = await prisma.movie.create({
            data: { title, overview, director, releaseYear, genres, createdBy: req.user!.id },
        })

        res.status(201).json(movie)
    } catch (error) {
        next(error)
    }
}

export const updateMovie = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { title, overview, director, releaseYear, genres } = req.body

        const movie = await prisma.movie.update({
            where: { id: req.params.id as string },
            data: { title, overview, director, releaseYear, genres },
        })

        res.status(200).json(movie)
    } catch (error) {
        next(error)
    }
}

export const deleteMovie = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await prisma.movie.delete({
            where: { id: req.params.id as string },
        })

        res.status(204).send()
    } catch (error) {
        next(error)
    }
}
