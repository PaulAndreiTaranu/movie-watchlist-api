import * as z from 'zod'

export const createMovieSchema = z.object({
    title: z.string(),
    overview: z.string().optional(),
    director: z.string().optional(),
    releaseYear: z.int(),
    genres: z.array(z.string()).optional(),
})

export const updateMovieSchema = createMovieSchema.partial()
