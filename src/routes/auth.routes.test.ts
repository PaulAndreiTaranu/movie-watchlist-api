import request from 'supertest'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../app.js'
import { prisma } from '../config/db.js'

const testUser = { name: 'Test User', email: 'test@test.com', password: 'password123' }

beforeAll(async () => {
    await prisma.$connect()
    await prisma.refreshToken.deleteMany()
    await prisma.user.deleteMany()
})

afterEach(async () => {
    await prisma.refreshToken.deleteMany()
    await prisma.user.deleteMany()
})

describe('POST /api/v1/auth/register', () => {
    it('should register new user and set refresh token cookie', async () => {
        const response = await request(app).post('/api/v1/auth/register').send(testUser).expect(201)
        const cookies = response.headers['set-cookie']

        // Check the response
        expect(response.body.user.name).toBe(testUser.name)
        expect(response.body.user.email).toBe(testUser.email)
        expect(response.body.user).not.toHaveProperty('password')
        expect(response.body.accessToken).toBeDefined()
        // Check cookies
        expect(cookies).toBeDefined()
        expect(cookies[0]).toContain('refreshToken')
        expect(cookies[0]).toContain('HttpOnly')
    })

    it('should return 409 for duplicate email', async () => {
        await request(app).post('/api/v1/auth/register').send(testUser)
        const response = await request(app).post('/api/v1/auth/register').send(testUser).expect(409)

        expect(response.body.error).toBe('Email already registered')
    })

    it('should return 400 for invalid email', async () => {
        await request(app)
            .post('/api/v1/auth/register')
            .send({
                ...testUser,
                email: 'not-valid-email',
            })
            .expect(400)
    })

    it('should return 400 for short password', async () => {
        await request(app)
            .post('/api/v1/auth/register')
            .send({
                ...testUser,
                password: '12',
            })
            .expect(400)
    })
})

describe('POST /api/v1/auth/login', () => {
    it('should login an existing user', async () => {
        await request(app).post('/api/v1/auth/register').send(testUser)

        const response = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password,
            })
            .expect(200)

        expect(response.body.user.email).toBe(testUser.email)
        expect(response.body.accessToken).toBeDefined()
    })

    it('should return 401 for worng password', async () => {
        await request(app).post('/api/v1/auth/register').send(testUser)

        const response = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: testUser.email,
                password: 'wrong-pass',
            })
            .expect(401)

        expect(response.body.error).toBe('Invalid email or password')
    })

    it('should return 401 for non-existent email', async () => {
        await request(app).post('/api/v1/auth/register').send(testUser)

        const response = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: 'wrongEmail@test.com',
                password: 'wrong-pass',
            })
            .expect(401)

        expect(response.body.error).toBe('Invalid email or password')
    })
})

describe('POST /api/v1/auth/refresh', () => {
    it('should return a new access token', async () => {
        // Register to get cookie
        const registerRes = await request(app).post('/api/v1/auth/register').send(testUser)
        // Extrat the cookie
        const cookies = registerRes.headers['set-cookie']
        // Send the cookie back to /refresh
        const response = await request(app)
            .post('/api/v1/auth/refresh')
            .set('Cookie', cookies)
            .expect(200)

        expect(response.body.accessToken).toBeDefined()
    })

    it('should return 401 without refresh token cookie', async () => {
        const response = await request(app).post('/api/v1/auth/refresh').expect(401)

        expect(response.body.error).toBe('No refresh token')
    })

    it('should invalidate old refresh token after rotation', async () => {
        // Register to get cookie
        const registerRes = await request(app).post('/api/v1/auth/register').send(testUser)
        // Extrat the cookie
        const cookies = registerRes.headers['set-cookie']
        // Send the cookie back to /refresh
        await request(app).post('/api/v1/auth/refresh').set('Cookie', cookies).expect(200)
        // Send the cookie again to /refresh, should fail
        await request(app).post('/api/v1/auth/refresh').set('Cookie', cookies).expect(401)
    })
})
