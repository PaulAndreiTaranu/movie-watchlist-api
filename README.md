# Movie Watchlist API

A REST API for managing a personal movie watchlist, built with TypeScript, Express 5, Prisma 7, and
PostgreSQL. Features JWT-based authentication with access/refresh token rotation, Zod input
validation, paginated list endpoints, and a full integration test suite.

## Tech Stack

- **TypeScript** + **Express 5** — Web framework
- **Prisma 7** — ORM with `@prisma/adapter-pg` driver adapter
- **PostgreSQL 16** — Database (via Docker)
- **Zod** — Request body validation
- **jose** — JWT signing/verification (HS256)
- **argon2** — Password hashing
- **Docker** — Multi-stage containerized builds, Compose for production
- **dotenvx** — Environment variable management (development)
- **Vitest** + **Supertest** — Integration testing against real database
- **helmet** / **cors** / **express-rate-limit** — Security middleware
- **morgan** — HTTP request logging

## Get Started

### Development

```bash
# 1. Install dependencies
pnpm install

# 2. Start PostgreSQL
docker compose up -d --wait

# 3. Set up environment
cp .env.local.example .env.local  # then fill in your values

# 4. Run migrations and generate Prisma client
pnpm prisma:migrate
pnpm prisma:gen

# 5. Start dev server
pnpm dev

# 6. Run tests
pnpm test
```

### Production (Docker)

```bash
# 1. Create .env.production with your secrets
# 2. Ensure a 'backend' Docker network exists (docker network create backend)
docker compose -f docker-compose.prod.yml up -d --build
```

### Required environment variables

**Development** (`.env.local`):

```
DATABASE_URL="postgresql://prisma:prisma@localhost:5432/movie_watchlist?schema=public"
JWT_ACCESS_SECRET="<openssl rand -base64 32>"
JWT_REFRESH_SECRET="<openssl rand -base64 32>"
```

**Production** (`.env.production`):

```
DATABASE_URL="postgresql://user:password@postgres:5432/movie_watchlist?schema=public"
JWT_ACCESS_SECRET="<openssl rand -base64 32>"
JWT_REFRESH_SECRET="<openssl rand -base64 32>"
```

Note: In production, the database host is the Docker service name (e.g., `postgres`), not
`localhost`.

### Scripts

| Script                | Description                            |
| --------------------- | -------------------------------------- |
| `pnpm dev`            | Start dev server with hot reload (tsx) |
| `pnpm build`          | Compile TypeScript                     |
| `pnpm test`           | Run all tests once                     |
| `pnpm test:watch`     | Run tests in watch mode                |
| `pnpm prisma:migrate` | Run database migrations                |
| `pnpm prisma:gen`     | Regenerate Prisma client               |
| `pnpm prisma:studio`  | Open Prisma Studio GUI                 |
| `pnpm prisma:reset`   | Reset database (destructive)           |

## API Endpoints

All routes are prefixed with `/api/v1`. Health check is at `/health`.

| Method | Path             | Description                       | Auth   |
| ------ | ---------------- | --------------------------------- | ------ |
| POST   | `/auth/register` | Register a new user               | No     |
| POST   | `/auth/login`    | Log in and receive tokens         | No     |
| POST   | `/auth/refresh`  | Get a new access token via cookie | Cookie |
| POST   | `/auth/logout`   | Clear refresh token and log out   | Cookie |
| GET    | `/movies`        | List all movies (paginated)       | No     |
| GET    | `/movies/:id`    | Get a movie by ID                 | No     |
| POST   | `/movies`        | Create a movie                    | Bearer |
| PATCH  | `/movies/:id`    | Update a movie                    | Bearer |
| DELETE | `/movies/:id`    | Delete a movie                    | Bearer |
| GET    | `/watchlist`     | Get user's watchlist (paginated)  | Bearer |
| POST   | `/watchlist`     | Add a movie to watchlist          | Bearer |
| PATCH  | `/watchlist/:id` | Update watchlist item             | Bearer |
| DELETE | `/watchlist/:id` | Remove from watchlist             | Bearer |

## Architecture

```
Dockerfile                # Multi-stage build (build → prod-deps → runtime)
docker-compose.yml        # Development (PostgreSQL only)
docker-compose.prod.yml   # Production (app container, joins external network)
.dockerignore             # Excludes node_modules, dist, env files from build context
src/
  app.ts              # Express app setup, middleware, route mounting
  server.ts           # HTTP listener, graceful shutdown, env validation
  config/
    db.ts             # Prisma client singleton with PG adapter
    env.ts            # Environment variable validation at startup
  controllers/        # Request handlers (business logic)
  routes/             # Route definitions, middleware wiring
  schemas/            # Zod validation schemas
  middleware/
    auth.middleware.ts       # JWT verification, req.user attachment
    validate.middleware.ts   # Zod schema validation
    errorHandler.middleware.ts  # Global error handler (P2025, P2002, sanitized 500s)
  utils/
    jwt.ts            # Token signing/verification with jose
    pagination.ts     # Query param parsing for paginated endpoints
  types/
    express.d.ts      # Declaration merging for req.user
```

**Layer flow:** Route → Auth middleware → Zod validation → Controller → Prisma → Response

**App/server separation:** `app.ts` exports the Express app without calling `.listen()`. `server.ts`
imports it and starts the HTTP server. This allows Supertest to import the app directly for testing
without starting a real server.

## Database Schema

Four models defined in `prisma/schema.prisma`:

- **User** — name, email (unique), hashed password. Has many movies, watchlist items, and refresh
  tokens.
- **Movie** — title (unique), director, overview, release year, genres, runtime, poster URL. Belongs
  to a user via `createdBy`.
- **WatchlistItem** — links a user to a movie with a status (`PLANNED`, `WATCHING`, `COMPLETED`,
  `DROPPED`), optional rating (1-10) and notes. Compound unique on `(movieId, userId)`.
- **RefreshToken** — hashed token with expiry, indexed by userId. Supports token rotation.

All relations cascade on delete. All primary keys are UUIDs.

## Auth Flow

1. **Register/Login** — Server hashes password with argon2, creates user, issues access token
   (15min, in response body) and refresh token (7 days, HTTP-only cookie). Refresh token is hashed
   with argon2 before storing in DB.
2. **Authenticated requests** — Client sends `Authorization: Bearer <accessToken>`. Auth middleware
   verifies signature and expiry, attaches `req.user`.
3. **Token refresh** — Client sends refresh token cookie to `/auth/refresh`. Server verifies JWT,
   checks hash against DB, deletes old token (rotation), issues new pair. Each refresh token is
   single-use.
4. **Logout** — Deletes refresh token from DB, clears cookie.

Two separate JWT secrets (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`) ensure one token type can't be
used as the other.

## Security

- **helmet** — Sets security HTTP headers (CSP, X-Content-Type-Options, etc.)
- **cors** — Cross-origin request control
- **express-rate-limit** — General limiter (100 req/15min) + strict auth limiter (5 req/15min)
- **argon2** — Password and refresh token hashing (GPU-resistant)
- **HTTP-only cookies** — Refresh tokens invisible to JavaScript (XSS protection)
- **Token rotation** — Each refresh token is single-use, theft is detected
- **Error sanitization** — Production responses never leak stack traces or internal paths
- **Env validation** — Required variables checked at startup, fails fast with clear message
- **Graceful shutdown** — SIGTERM/SIGINT handlers close server and disconnect DB cleanly

## Build Log

### 1. Project Scaffolding and Infrastructure

Set up TypeScript project with `pnpm`, Express 5, and `tsx` for dev server. Created `tsconfig.json`
(ES2022, Node16 modules, strict mode). Added Docker Compose with PostgreSQL 16 (healthcheck,
persistent volume). Configured `dotenvx` with `with-local-env` script pattern — all db-dependent
commands load `.env.local` through dotenvx.

```bash
pnpm init && pnpm add express @prisma/client zod
pnpm add -D typescript @types/express @types/node tsx prisma
pnpm add @prisma/adapter-pg @dotenvx/dotenvx
```

### 2. Database and ORM

Initialized Prisma with `prisma.config.ts` (datasource URL from env, no URL in schema). Created
Prisma client singleton using `@prisma/adapter-pg` driver adapter with connect/disconnect helpers
and environment-based query logging. Initial schema had a simple Movie model; later expanded to four
models (User, Movie, WatchlistItem, RefreshToken) with UUIDs, relations, cascading deletes, compound
unique constraints, and a status enum.

```bash
pnpm prisma init
pnpm prisma:migrate
```

### 3. Movie CRUD

Built the routes → controller pattern. Routes define endpoints and apply middleware, controllers
handle business logic and Prisma calls. All controllers use try/catch with `next(err)` to forward
errors to the global error handler. Separated `app.ts` (Express setup, exports app) from `server.ts`
(calls `.listen()`) to enable testing with Supertest.

**Key files:** `src/controllers/movie.controller.ts`, `src/routes/movie.routes.ts`,
`src/schemas/movie.schema.ts`

### 4. Validation and Error Handling

Added Zod schemas for request body validation. Created reusable `validate(schema)` middleware that
runs `safeParse`, returns 400 with formatted errors on failure, replaces `req.body` with parsed data
on success. Built global error handler mounted after all routes — catches Prisma `P2025` (record not
found → 404), `P2002` (unique constraint → 409), and sanitizes all other errors (dev shows
`err.message`, production shows generic message).

**Key files:** `src/middleware/validate.middleware.ts`, `src/middleware/errorHandler.middleware.ts`

### 5. Authentication

Implemented JWT auth with `jose` (HS256) and `argon2`. Two separate secrets for access and refresh
tokens. Private `issueTokens` helper generates UUID, signs both tokens in parallel with
`Promise.all`, hashes refresh token, stores in DB — single database call using pre-generated UUID.
Refresh token set as HTTP-only cookie. Auth middleware verifies Bearer token and attaches
`req.user`. Protected movie write routes (POST, PATCH, DELETE) with auth middleware.

**Key files:** `src/utils/jwt.ts`, `src/controllers/auth.controller.ts`,
`src/middleware/auth.middleware.ts`

### 6. Refresh and Logout

Added token rotation on refresh — old token deleted, new pair issued. Logout deletes token from DB
and clears cookie. Inner try/catch in logout so invalid/expired tokens don't prevent cookie cleanup.

### 7. Watchlist

CRUD for watchlist items, all routes behind auth middleware. Controller verifies movie exists before
adding to watchlist. Spreads optional fields to avoid passing `undefined` to Prisma (which overrides
database defaults). User's watchlist is implicitly the collection of their WatchlistItem records —
no separate Watchlist model needed.

**Key files:** `src/controllers/watchlist.controller.ts`, `src/routes/watchlist.routes.ts`,
`src/schemas/watchlist.schema.ts`

### 8. Testing

Full integration test suite with Vitest + Supertest running against real PostgreSQL. Tests import
`app` directly (no server needed). Each test file registers a user in `beforeAll` to get an access
token. `afterEach` cleans up test data for isolation. `afterAll` respects foreign key order
(watchlist items → movies → refresh tokens → users). Tests cover happy paths, validation errors,
auth failures, and error handling.

```bash
pnpm add -D vitest supertest @types/supertest
```

### 9. Production Hardening

- **API versioning** — All routes prefixed with `/api/v1/`
- **Pagination** — Reusable helper parses `?page=1&limit=20`, enforces limits (1-100, default 20).
  List endpoints return `{ data, pagination: { page, limit, total, totalPages } }`
- **Security middleware** — helmet, cors, rate limiting (general + strict auth)
- **Request logging** — morgan (`dev` in development, `combined` in production, disabled in tests)
- **Graceful shutdown** — SIGTERM/SIGINT handlers close HTTP server and disconnect Prisma
- **Env validation** — Required variables checked at startup before any logic runs
- **Health check** — `GET /health` pings database with `SELECT 1`, returns 503 if DB is down

```bash
pnpm add helmet cors express-rate-limit morgan
```

### 10. Docker Containerization

Multi-stage Dockerfile with three stages: **build** (install all deps, generate Prisma client,
compile TypeScript), **prod-deps** (production dependencies only + Prisma generate), **runtime**
(clean Alpine image with compiled JS and production `node_modules`). Uses `node:22-alpine` as base,
`--shamefully-hoist` for flat `node_modules` (required for Prisma client compatibility across Docker
stages), and `--mount=type=cache` for persistent pnpm store between builds. Runtime runs as non-root
`node` user.

Production Compose file (`docker-compose.prod.yml`) runs just the app container, loading secrets
from `.env.production` via `env_file`. Joins an external `backend` Docker network to connect to a
shared PostgreSQL instance. Development Compose file (`docker-compose.yml`) remains unchanged — runs
only PostgreSQL for local development.

**Key files:** `Dockerfile`, `docker-compose.prod.yml`, `.dockerignore`
