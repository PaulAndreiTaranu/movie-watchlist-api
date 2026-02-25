import * as z from 'zod'

export const createMovieSchema = z.object({
    title: z.string(),
    director: z.string().optional(),
    year: z.int().optional(),
    watched: z.boolean().optional(),
    rating: z.int().min(1).max(10).optional(),
})

export const updateMovieSchema = createMovieSchema.partial()
