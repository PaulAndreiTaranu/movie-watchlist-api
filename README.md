# Movie Watchlist API

## Overview

A REST API for managing a personal movie watchlist, built with Express 5, Prisma 7, and PostgreSQL.
Features full CRUD operations, JWT-based authentication with access/refresh token rotation, and a
relational database with four interconnected models. Built as a learning project to practice backend
architecture, auth flows, and database design.

## Tech stack

- **Express** 5 — Web framework
- **Prisma** 7 — ORM with PostgreSQL adapter
- **PostgreSQL** 16 — Database (via Docker)
- **jose** — JWT signing/verification (HS256, Web Crypto API)
- **argon2** — Password hashing
- **dotenvx** — Environment variable management
- **nodemon** — Dev server auto-reload

## Get started

## API endpoints

| Method | Path             | Description                       | Auth   |
| ------ | ---------------- | --------------------------------- | ------ |
| POST   | `/auth/register` | Register a new user               | No     |
| POST   | `/auth/login`    | Log in and receive tokens         | No     |
| POST   | `/auth/refresh`  | Get a new access token via cookie | Cookie |
| POST   | `/auth/logout`   | Clear refresh token and log out   | Cookie |
| GET    | `/movies`        | List all movies                   | No     |
| POST   | `/movies`        | Create a movie                    | No     |
| POST   | `/watchlist`     | Add a movie to your watchlist     | Bearer |

## Architecture

## Database schema

Four models defined in `prisma/schema.prisma`:

- **User** — name, email (unique), hashed password. Has many movies, watchlist items, and refresh
  tokens.
- **Movie** — title (unique), overview, release year, genres, runtime, poster URL. Belongs to a
  user.
- **WatchlistItem** — links a user to a movie with a status (`PLANNED`, `WATCHING`, `COMPLETED`,
  `DROPPED`), optional rating and notes. Compound unique on `(movieId, userId)`.
- **RefreshToken** — hashed token with expiry. Belongs to a user.

All relations cascade on delete. All primary keys are UUIDs.

## Build log

### Commit 1: Initial project scaffolding

**Terminal commands:**

```bash
pnpm init
pnpm add express @prisma/client zod
pnpm add -D typescript @types/express @types/node tsx prisma
```

Files created:

- .gitignore — Ignores node_modules, dist, .env files, Prisma generated client, logs, OS files,
  CLAUDE.md
- tsconfig.json — TypeScript config targeting ES2022, Node16 module resolution, strict mode, output
  to dist/, source in src/
- src/index.ts — Express 5 entry point with JSON body parsing and a /health endpoint returning {
  status: "ok" }
- package.json — Scripts: dev (tsx watch), build (tsc), start (node dist/index.js)

### Commit 2: Docker, Prisma, dotenvx, and movie CRUD routes

**Terminal commands:**

```bash
docker compose up -d --wait
pnpm prisma init
pnpm add @prisma/adapter-pg @dotenvx/dotenvx
pnpm prisma migrate dev --name init
```

**Files created:**

- **`docker-compose.yml`** — PostgreSQL 16 container with healthcheck, persistent volume, credentials: prisma/prisma, database: movie_watchlist
- **`.env.local`** — DATABASE_URL pointing to local PostgreSQL container
- **`prisma.config.ts`** — Prisma config with schema path, migrations path, and datasource URL from env
- **`prisma/schema.prisma`** — Movie model (id, title, director, year, watched, rating, timestamps) with PostgreSQL adapter, output to `src/generated/prisma`
- **`src/config/db.ts`** — Prisma client singleton using `@prisma/adapter-pg` driver adapter, with connect/disconnect helpers and dev query logging
- **`src/controllers/movieController.ts`** — CRUD handlers: getAllMovies, getMovieById, createMovie, updateMovie, deleteMovie. Destructures req.body fields explicitly
- **`src/routes/movieRoutes.ts`** — Routes wired to controller functions: GET `/`, GET `/:id`, POST `/`, PATCH `/:id`, DELETE `/:id`
- **`src/index.ts`** — Updated to mount movie routes at `/movies`

**package.json updates:**

- Added `with-local-env` script using dotenvx to load `.env.local`
- All db-dependent scripts prefixed with `pnpm with-local-env`
- Added `prisma:migrate`, `prisma:gen`, `prisma:studio` scripts

### Commit 3: Add Zod validation and Vitest + Supertest API tests

**Terminal commands:**

```bash
pnpm add -D vitest supertest @types/supertest
```

**Files created:**

- **`src/app.ts`** — Express app setup extracted from index.ts, exports `app` without calling `.listen()` so Supertest can import it directly
- **`src/server.ts`** — Imports app and calls `.listen()`. Replaces `src/index.ts` as the entry point
- **`src/schemas/movie.schema.ts`** — Zod validation schemas: `createMovieSchema` (title required, director/year/watched optional, rating 1-10) and `updateMovieSchema` (all fields optional via `.partial()`)
- **`src/middleware/validate.ts`** — Reusable validation middleware that runs `schema.safeParse(req.body)`, returns 400 with formatted errors on failure, replaces `req.body` with parsed data on success
- **`src/routes/movie.routes.ts`** — Updated to apply `validate(createMovieSchema)` on POST and `validate(updateMovieSchema)` on PATCH before controller handlers
- **`src/routes/movie.routes.test.ts`** — Full CRUD test suite using Vitest + Supertest against real database. Tests: create movie, missing title (400), rating out of range (400), get all, get by id, 404 for non-existent, update, delete. Uses `afterEach` cleanup for test isolation
- **`vitest.config.ts`** — Vitest config with globals, node environment, sequential file execution

**package.json updates:**

- `dev` and `start` scripts now point to `src/server.ts`
- Added `test` (`vitest --run`) and `test:watch` (`vitest`) scripts via `with-local-env`

### Commit 4: Add global error handling

**Files created:**

- **`src/middleware/errorHandler.ts`** — Global Express error handler. Catches Prisma `P2025` (record not found) and returns 404 JSON. All other errors return 500. Must be mounted after all routes.

**Files updated:**

- **`src/controllers/movie.controller.ts`** — All handlers wrapped in try/catch, errors forwarded to error handler via `next(err)`. Added `NextFunction` parameter to all controller functions.
- **`src/app.ts`** — Mounted `errorHandler` middleware after all routes
- **`src/routes/movie.routes.test.ts`** — Added error handling tests: 404 on update/delete non-existent movie

### Commit 5: Add auth, expand schema, and protect movie routes

**Terminal commands:**

```bash
pnpm add jose argon2 cookie-parser
pnpm add -D @types/cookie-parser
pnpm prisma:reset
pnpm prisma:migrate -- --name add-user-watchlist-refresh-token
```

**Schema changes:**

- **Movie** — now uses UUID primary key, `title` is unique, `year` → `releaseYear`, added `overview`, `genres`, `runtime`, `posterUrl`, `createdBy` (relation to User). Removed `watched`, `rating` (moved to WatchlistItem)
- **User** (new) — name, email (unique), hashed password. Has many movies, watchlist items, refresh tokens
- **WatchlistItem** (new) — links user to movie with status enum (PLANNED/WATCHING/COMPLETED/DROPPED), optional rating and notes. Compound unique on (movieId, userId)
- **RefreshToken** (new) — hashed token with expiry, indexed by userId. For token rotation.

**Files created:**

- **`src/utils/jwt.ts`** — JWT signing/verification using `jose` with separate ACCESS and REFRESH secrets (HS256). Exports `signAccessToken`, `signRefreshToken`, `verifyAccessToken`, `verifyRefreshToken`, and expiry constants
- **`src/controllers/auth.controller.ts`** — Register and login handlers. Private `issueTokens` helper creates both tokens in one flow: generates UUID, signs tokens in parallel, hashes refresh token with argon2, stores in DB, sets HTTP-only cookie
- **`src/schemas/auth.schema.ts`** — Zod schemas for register (name, email, password min 8) and login (email, password)
- **`src/routes/auth.routes.ts`** — POST `/register` and `/login` with Zod validation
- **`src/middleware/authMiddleware.ts`** — Verifies Bearer token from Authorization header, attaches `req.user` with userId
- **`src/types/express.d.ts`** — TypeScript declaration merging to add `user` property to Express Request
- **`src/routes/auth.routes.test.ts`** — Tests: register, duplicate email (409), invalid email (400), short password (400), login, wrong password (401), non-existent email (401), refresh token cookie set

**Files updated:**

- **`src/schemas/movie.schema.ts`** — Updated fields: title, director, overview, releaseYear, genres, runtime, posterUrl
- **`src/controllers/movie.controller.ts`** — IDs are now strings (UUIDs), updated fields, `createMovie` uses `req.user.id` for `createdBy`
- **`src/routes/movie.routes.ts`** — POST, PATCH, DELETE now protected with `authMiddleware`
- **`src/routes/movie.routes.test.ts`** — Tests register a user in `beforeAll` to get access token, protected routes include Bearer token, seeded movies include `createdBy`
- **`src/app.ts`** — Mounted auth routes at `/auth`, added `cookie-parser` middleware
- **`.env.local`** — Added `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`

### Commit 6: Add refresh, logout, and auth tests

**Files updated:**

- **`src/controllers/auth.controller.ts`** — Added `refresh` (verifies refresh token cookie, validates against stored hash, deletes old token for rotation, issues new pair) and `logout` (deletes refresh token from DB, clears cookie)
- **`src/routes/auth.routes.ts`** — Added POST `/refresh` and `/logout` routes
- **`src/routes/auth.routes.test.ts`** — Added tests: refresh returns new access token, 401 without cookie, old token invalidated after rotation, logout clears cookie, logout succeeds without cookie, refresh fails after logout
- **`src/config/db.ts`** — Prisma logging now only shows queries in development; test environment only logs errors

### Commit 7: Add watchlist routes and tests

**Files created:**

- **`src/schemas/watchlist.schema.ts`** — Zod schemas: `createWatchlistItemSchema` (movieId UUID required, status enum optional defaults to PLANNED, rating 1-10 optional, notes optional) and `updateWatchlistItemSchema` (status/rating/notes all optional)
- **`src/controllers/watchlist.controller.ts`** — Handlers: `getWatchlist` (user's items with movie data via include), `createWatchlistItem` (verifies movie exists, spreads optional fields to avoid undefined), `updateWatchlistItem`, `deleteWatchlistItem`. All protected by auth
- **`src/routes/watchlist.routes.ts`** — All routes behind `authMiddleware`: GET `/`, POST `/`, PATCH `/:id`, DELETE `/:id`
- **`src/routes/watchlist.routes.test.ts`** — Tests: empty watchlist, watchlist with movie data, add movie, add with custom status/rating, 404 for non-existent movie, 409 for duplicate, update item, delete item, 401 without auth, error handling for non-existent items

**Files updated:**

- **`src/app.ts`** — Mounted watchlist routes at `/watchlist`
- **`src/middleware/errorHandler.middleware.ts`** — Added `P2002` (unique constraint violation) handling, returns 409

### Commit 8: Add security middleware and production hardening

**Terminal commands:**

```bash
pnpm add helmet cors express-rate-limit
pnpm add -D @types/cors
```

**Files created:**

- **`src/config/env.ts`** — Validates required environment variables (DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET) at startup. Exits with clear error message if any are missing.

**Files updated:**

- **`src/server.ts`** — Added graceful shutdown handlers for SIGTERM/SIGINT. Closes HTTP server, disconnects Prisma, then exits. Calls `validateEnv()` before starting.
- **`src/app.ts`** — Added helmet (security headers), cors, rate limiting (general 100/15min + strict auth 5/15min). Health check now pings database with `SELECT 1`, returns 503 if DB is down.
