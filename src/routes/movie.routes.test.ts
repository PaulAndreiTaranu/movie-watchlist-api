import request from 'supertest'
import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { app } from '../app'
import { prisma } from '../config/db'

const testMovie = { title: 'Inception', director: 'Christopher Nolan', year: 2010 }

afterEach(async () => {
    await prisma.movie.deleteMany()
})

afterAll(async () => {
    await prisma.$disconnect()
})

describe('POST /movies', () => {
    it('should create a movie', async () => {
        const response = await request(app)
            .post('/movies')
            .send({ ...testMovie })
            .expect(201)

        // Check the response
        expect(response.body.title).toBe(testMovie.title)
        expect(response.body.director).toBe(testMovie.director)
        expect(response.body.year).toBe(testMovie.year)
        expect(response.body.watched).toBe(false)
        expect(response.body.id).toBeDefined()
    })

    it('should return 400 when title is missing', async () => {
        const { title, ...movieWithoutTitle } = testMovie
        const response = await request(app).post('/movies').send(movieWithoutTitle).expect(400)

        // Zod validation should return errors details
        expect(response.body.errors).toBeDefined()
    })

    it('should return 400 when rating is out of range', async () => {
        const response = await request(app)
            .post('/movies')
            .send({ ...testMovie, rating: 11 })
            .expect(400)

        // Zod validation should return errors details
        expect(response.body.errors).toBeDefined()
    })
})

describe('GET /movies', () => {
    it('should return an empty array when no movies exits', async () => {
        const response = await request(app).get('/movies').expect(200)

        expect(response.body).toEqual([])
    })

    it('should return all movies', async () => {
        // Seed two movies via Prisma
        await prisma.movie.createMany({
            data: [
                { title: 'Inception', year: 2010 },
                { title: 'The Matrix', year: 1996 },
            ],
        })

        const response = await request(app).get('/movies').expect(200)

        expect(response.body).toHaveLength(2)
    })
})

describe('GET /movies/:id', () => {
    it('should return a movie by id', async () => {
        // Create a movie and the fetch it by id
        const movie = await prisma.movie.create({ data: testMovie })

        const response = await request(app).get(`/movies/${movie.id}`).expect(200)

        expect(response.body.title).toBe(testMovie.title)
    })

    it('should return 404 for non-existent movie', async () => {
        await request(app).get('/movies/99999').expect(404)
    })
})

describe('PATCH /movies/:id', () => {
    it('should update a movie', async () => {
        const movie = await prisma.movie.create({ data: testMovie })

        const response = await request(app)
            .patch(`/movies/${movie.id}`)
            .send({
                watched: true,
                rating: 10,
            })
            .expect(200)

        expect(response.body.watched).toBe(true)
        expect(response.body.rating).toBe(10)
        expect(response.body.title).toBe(testMovie.title)
    })
})

describe('DELETE /movies/:id', () => {
    it('should delete a movie by id', async () => {
        const movie = await prisma.movie.create({ data: testMovie })

        await request(app).delete(`/movies/${movie.id}`).expect(204)

        // Verify is actually gone from database
        const deleted = await prisma.movie.findUnique({
            where: { id: movie.id },
        })

        expect(deleted).toBeNull()
    })
})
