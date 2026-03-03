import request from 'supertest'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../app.js'
import { prisma, prismaDeleteAll } from '../config/db.js'

const testUser = { name: 'Test User', email: 'test@test.com', password: 'password123' }
const testMovie = { title: 'Inception', director: 'Christopher Nolan', releaseYear: 2010 }

let accessToken: string
let userId: string
let movieId: string

beforeAll(async () => {
    await prisma.$connect()
    await prismaDeleteAll()

    // Register user to get an access token for protected routes
    const registeredUser = await request(app).post('/auth/register').send(testUser)
    userId = registeredUser.body.user.id
    accessToken = registeredUser.body.accessToken

    const createdMovie = await request(app)
        .post('/movies')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testMovie)
    movieId = createdMovie.body.id

    console.log({
        accessToken,
        userId,
        movieId,
    })
})

afterEach(async () => {
    await prisma.watchlistItem.deleteMany()
})

afterAll(async () => {
    await prismaDeleteAll()
    await prisma.$disconnect()
})

describe('GET /watchlist', () => {
    it('should return an empty watchlist', async () => {
        const response = await request(app)
            .get('/watchlist')
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200)

        expect(response.body).toEqual([])
    })

    it('should return user watchlist with movie data', async () => {
        await prisma.watchlistItem.create({
            data: { userId, movieId, status: 'PLANNED' },
        })

        const response = await request(app)
            .get('/watchlist')
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200)

        expect(response.body).toHaveLength(1)
        expect(response.body[0].movie.title).toBe(testMovie.title)
    })
})

describe('POST /watchlist', () => {
    it('should add a movie to watchlist', async () => {
        const response = await request(app)
            .post('/watchlist')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ movieId })
            .expect(201)

        expect(response.body.movieId).toBe(movieId)
        expect(response.body.userId).toBe(userId)
        expect(response.body.status).toBe('PLANNED')
    })

    it('should add with custom status and rating', async () => {
        const response = await request(app)
            .post('/watchlist')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ movieId, status: 'COMPLETED', rating: 8 })
            .expect(201)

        expect(response.body.status).toBe('COMPLETED')
        expect(response.body.rating).toBe(8)
    })

    it('should return 404 for non-existent movie', async () => {
        const response = await request(app)
            .post('/watchlist')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                movieId: '00000000-0000-0000-0000-000000000000',
                status: 'COMPLETED',
                rating: 8,
            })
            .expect(404)
        expect(response.body.error).toBe('Movie not found')
    })

    it('should return 409 for duplicate watchlist item', async () => {
        await request(app)
            .post('/watchlist')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ movieId, status: 'COMPLETED', rating: 8 })

        const response = await request(app)
            .post('/watchlist')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ movieId, status: 'COMPLETED', rating: 8 })
            .expect(409)

        expect(response.body.error).toBe('Record already exists')
    })
})

describe('PATCH /watchlist/:id', () => {
    it('should updated watchlist item', async () => {
        const watchlistItem = await request(app)
            .post('/watchlist')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ movieId, status: 'COMPLETED', rating: 8 })

        const response = await request(app)
            .patch(`/watchlist/${watchlistItem.body.id}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ status: 'DROPPED', rating: 7 })
            .expect(200)

        expect(response.body.status).toBe('DROPPED')
        expect(response.body.rating).toBe(7)
    })
})

describe('DELETE /watchlist/:id', () => {
    it('should delete watchlist item', async () => {
        const watchlistItem = await request(app)
            .post('/watchlist')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ movieId, status: 'COMPLETED', rating: 8 })

        await request(app)
            .delete(`/watchlist/${watchlistItem.body.id}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(204)

        const deleted = await prisma.watchlistItem.findUnique({
            where: { id: watchlistItem.body.id },
        })

        expect(deleted).toBeNull()
    })
})

describe('Error handling', () => {
    it('should return 404 when updating non-existent watchlist item', async () => {
        const response = await request(app)
            .patch('/watchlist/00000000-0000-0000-0000-000000000000')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ status: 'COMPLETED' })
            .expect(404)

        expect(response.body.error).toBe('Record not found')
    })

    it('should return 404 when deleting non-existent watchlist item', async () => {
        await request(app)
            .delete('/watchlist/00000000-0000-0000-0000-000000000000')
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(404)
    })
})
