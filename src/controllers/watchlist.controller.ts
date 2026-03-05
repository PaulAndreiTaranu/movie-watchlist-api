import { NextFunction, Request, Response } from 'express'
import { prisma } from '../config/db.js'
import { parsePagination } from '../utils/paginations.js'

export const getWatchlist = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit, skip } = parsePagination(
            req.query as { page?: string; limit?: string },
        )
        const [watchlistItems, total] = await Promise.all([
            prisma.watchlistItem.findMany({
                where: { userId: req.user!.id },
                include: { movie: true },
                skip,
                take: limit,
            }),
            prisma.watchlistItem.count({
                where: { userId: req.user!.id },
            }),
        ])
        res.json({
            data: watchlistItems,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        })
        res.status(200).json(watchlistItems)
    } catch (error) {
        next(error)
    }
}

export const createWatchlistItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { movieId, status, rating, notes } = req.body

        const movie = await prisma.movie.findUnique({ where: { id: movieId } })
        if (!movie) {
            res.status(404).json({ error: 'Movie not found' })
            return
        }
        const watchlistItem = await prisma.watchlistItem.create({
            data: { userId: req.user!.id, movieId, status, rating, notes },
        })

        res.status(201).json(watchlistItem)
    } catch (error) {
        next(error)
    }
}

export const updateWatchlistItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { status, rating, notes } = req.body
        const watchlistItem = await prisma.watchlistItem.update({
            where: { id: req.params.id as string },
            data: { status, rating, notes },
        })

        res.status(200).json(watchlistItem)
    } catch (error) {
        next(error)
    }
}

export const deleteWatchlistItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await prisma.watchlistItem.delete({
            where: { id: req.params.id as string },
        })

        res.status(204).send()
    } catch (error) {
        next(error)
    }
}
