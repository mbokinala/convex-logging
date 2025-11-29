# Base stage for installing dependencies
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# Dependencies stage
FROM base AS dependencies
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/ingest-server/package.json ./apps/ingest-server/
COPY packages/types/package.json ./packages/types/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Build stage
FROM base AS build
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/apps/ingest-server/node_modules ./apps/ingest-server/node_modules
COPY --from=dependencies /app/packages/types/node_modules ./packages/types/node_modules
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/ingest-server ./apps/ingest-server
COPY packages/types ./packages/types

# Build the types package first (dependency)
RUN pnpm --filter @repo/types build

# Build the API
RUN pnpm --filter @repo/ingest-server build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Copy only the bundled output (tsup bundles all dependencies)
COPY --from=build /app/apps/ingest-server/dist ./apps/ingest-server/dist

COPY apps/ingest-server/setup.sql ./apps/ingest-server/dist/setup.sql

EXPOSE 3000

CMD ["node", "apps/ingest-server/dist/index.js"]
