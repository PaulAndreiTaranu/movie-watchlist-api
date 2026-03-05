import request from 'supertest'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../app.js'
import { prisma } from '../config/db.js'

const testUser = { name: 'Test User', email: 'test@test.com', password: 'password123' }
const testMovie = { title: 'Inception', director: 'Christopher Nolan', releaseYear: 2010 }

let accessToken: string
let userId: string

beforeAll(async () => {
    await prisma.$connect()
    await prisma.movie.deleteMany()
    await prisma.refreshToken.deleteMany()
    await prisma.user.deleteMany()

    // Register user to get an access token for protected routes
    const res = await request(app).post('/auth/register').send(testUser)

    accessToken = res.body.accessToken
    userId = res.body.user.id
})

afterEach(async () => {
    await prisma.movie.deleteMany()
})

describe('POST /movies', () => {
    it('should create a movie', async () => {
        const response = await request(app)
            .post('/movies')
            .set('Authorization', `Bearer ${accessToken}`)
            .send(testMovie)
            .expect(201)

        // Check the response
        expect(response.body.title).toBe(testMovie.title)
        expect(response.body.director).toBe(testMovie.director)
        expect(response.body.releaseYear).toBe(testMovie.releaseYear)
        expect(response.body.createdBy).toBe(userId)
        expect(response.body.id).toBeDefined()
    })

    it('should return 401 without auth token', async () => {
        await request(app).post('/movies').send(testMovie).expect(401)
    })

    it('should return 400 when title is missing', async () => {
        const { title, ...movieWithoutTitle } = testMovie
        const response = await request(app)
            .post('/movies')
            .set('Authorization', `Bearer ${accessToken}`)
            .send(movieWithoutTitle)
            .expect(400)

        // Zod validation should return errors details
        expect(response.body.errors).toBeDefined()
    })
})

describe('GET /movies', () => {
    it('should return an empty array when no movies exits', async () => {
        const response = await request(app).get('/movies').expect(200)

        expect(response.body.data).toEqual([])
        expect(response.body.pagination.total).toBe(0)
    })

    it('should return all movies', async () => {
        // Seed two movies via Prisma
        await prisma.movie.createMany({
            data: [
                { title: 'Inception', releaseYear: 2010, createdBy: userId },
                { title: 'The Matrix', releaseYear: 1996, createdBy: userId },
            ],
        })

        const response = await request(app).get('/movies').expect(200)

        expect(response.body.data).toHaveLength(2)
        expect(response.body.pagination.total).toBe(2)
    })
})

describe('GET /movies/:id', () => {
    it('should return a movie by id', async () => {
        // Create a movie and then fetch it by id
        const movie = await prisma.movie.create({
            data: { ...testMovie, createdBy: userId },
        })

        const response = await request(app).get(`/movies/${movie.id}`).expect(200)

        expect(response.body.title).toBe(testMovie.title)
    })

    it('should return 404 for non-existent movie', async () => {
        await request(app).get('/movies/99999').expect(404)
    })
})

describe('PATCH /movies/:id', () => {
    it('should update a movie', async () => {
        // Create a movie and then update it by id
        const movie = await prisma.movie.create({
            data: { ...testMovie, createdBy: userId },
        })

        const response = await request(app)
            .patch(`/movies/${movie.id}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ director: 'Nolan' })
            .expect(200)

        expect(response.body.title).toBe(testMovie.title)
        expect(response.body.director).toBe('Nolan')
    })
})

describe('DELETE /movies/:id', () => {
    it('should delete a movie by id', async () => {
        // Create a movie and then delete it by id
        const movie = await prisma.movie.create({
            data: { ...testMovie, createdBy: userId },
        })

        await request(app)
            .delete(`/movies/${movie.id}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(204)

        // Verify is actually gone from database
        const deleted = await prisma.movie.findUnique({
            where: { id: movie.id },
        })

        expect(deleted).toBeNull()
    })
})

describe('Error handling', () => {
    it('should return 404 when updating an non-existent movie', async () => {
        const response = await request(app)
            .patch('/movies/9999')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ title: 'Ghost Movie' })
            .expect(404)

        expect(response.body.error).toBe('Record not found')
    })

    it('should return 404 when deleting an non-existent movie', async () => {
        const response = await request(app)
            .delete('/movies/9999')
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(404)

        expect(response.body.error).toBe('Record not found')
    })
})
