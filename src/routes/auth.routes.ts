import { Router } from 'express'
import { login, register } from '../controllers/auth.controller.js'
import { validate } from '../middleware/validate.middleware.js'
import { loginSchema, registerSchema } from '../schemas/auth.schema.js'

export const authRoutes = Router()
authRoutes.post('/register', validate(registerSchema), register)
authRoutes.post('/login', validate(loginSchema), login)
