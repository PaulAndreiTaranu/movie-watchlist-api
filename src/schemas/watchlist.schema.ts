import * as z from 'zod'

export const createWatchlistItemSchema = z.object({
    movieId: z.uuid(),
    status: z.enum(['PLANNED', 'WATCHING', 'COMPLETED', 'DROPPED']).optional(),
    rating: z.int().min(1).max(10).optional(),
    notes: z.string().optional(),
})

export const updateWatchlistItemSchema = z.object({
    status: z.enum(['PLANNED', 'WATCHING', 'COMPLETED', 'DROPPED']).optional(),
    rating: z.int().min(1).max(10).optional(),
    notes: z.string().optional(),
})
