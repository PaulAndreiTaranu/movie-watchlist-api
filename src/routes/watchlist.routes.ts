import { Router } from 'express'
import {
    createWatchlistItem,
    deleteWatchlistItem,
    getWatchlist,
    updateWatchlistItem,
} from '../controllers/watchlist.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import {
    createWatchlistItemSchema,
    updateWatchlistItemSchema,
} from '../schemas/watchlist.schema.js'

export const watchlistRoutes = Router()

// Get user watchlist
watchlistRoutes.get('/', authMiddleware, getWatchlist)

// Create watchlistItem
watchlistRoutes.post('/', authMiddleware, validate(createWatchlistItemSchema), createWatchlistItem)

// Update watchlistItem
watchlistRoutes.patch(
    '/:id',
    authMiddleware,
    validate(updateWatchlistItemSchema),
    updateWatchlistItem,
)

// Delete watchlistItem
watchlistRoutes.delete('/:id', authMiddleware, deleteWatchlistItem)
