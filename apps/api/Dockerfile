# Base stage for installing dependencies
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# Dependencies stage
FROM base AS dependencies
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Build stage
FROM base AS build
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=dependencies /app/packages/types/node_modules ./packages/types/node_modules
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api ./apps/api
COPY packages/types ./packages/types

# Build the types package first (dependency)
RUN pnpm --filter @repo/types build

# Build the API
RUN pnpm --filter @repo/api build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Copy only the bundled output (tsup bundles all dependencies)
COPY --from=build /app/apps/api/dist ./apps/api/dist

COPY apps/api/setup.sql ./apps/api/dist/setup.sql

EXPOSE 3000

CMD ["node", "apps/api/dist/index.js"]
