import { NextFunction, Request, Response } from 'express'
import { prisma } from '../config/db'

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
            where: { id: Number(req.params.id) },
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
        const { title, director, year, watched, rating } = req.body

        const movie = await prisma.movie.create({
            data: { title, director, year, watched, rating },
        })

        res.status(201).json(movie)
    } catch (error) {
        next(error)
    }
}

export const updateMovie = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { title, director, year, watched, rating } = req.body

        const movie = await prisma.movie.update({
            where: { id: Number(req.params.id) },
            data: { title, director, year, watched, rating },
        })

        res.status(200).json(movie)
    } catch (error) {
        next(error)
    }
}

export const deleteMovie = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const movie = await prisma.movie.delete({
            where: { id: Number(req.params.id) },
        })

        res.status(204).json(movie)
    } catch (error) {
        next(error)
    }
}
