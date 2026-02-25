import { NextFunction, Request, Response } from 'express'
import * as z from 'zod'

export const validate = (schema: z.ZodType) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body)

        if (!result.success) {
            // safeParse returns { success: false, error } when validation fails
            res.status(400).json({ errors: z.prettifyError(result.error) })
        }

        // Replace req.body with the parsed data
        req.body = result.data
        next()
    }
}
