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
