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
