FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# STAGE 1: Install all deps, generate prisma, build TypeScript
FROM base AS build
COPY package.json pnpm-lock.yaml tsconfig.json prisma.config.ts ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --shamefully-hoist
COPY prisma ./prisma
COPY src ./src
RUN ./node_modules/.bin/prisma generate
RUN pnpm build

# STAGE 2: Production deps only
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml prisma.config.ts ./
COPY prisma ./prisma
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --production --shamefully-hoist
RUN ./node_modules/.bin/prisma generate

# STAGE 3: Minimal runtime
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV="production"
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./
COPY package.json ./
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh
USER node
EXPOSE 3001
CMD ["./entrypoint.sh"]