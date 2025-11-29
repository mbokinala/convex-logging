# Base stage for installing dependencies
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# Dependencies stage
FROM base AS dependencies
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/dashboard/package.json ./apps/dashboard/
COPY packages/types/package.json ./packages/types/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Build stage
FROM base AS build
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/apps/dashboard/node_modules ./apps/dashboard/node_modules
COPY --from=dependencies /app/packages/types/node_modules ./packages/types/node_modules
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/dashboard ./apps/dashboard
COPY packages/types ./packages/types

# Build the types package first (dependency)
RUN pnpm --filter @repo/types build

# Build the web app
RUN pnpm --filter @repo/dashboard build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy only production dependencies and built files
COPY --from=build /app/apps/dashboard/next.config.* ./apps/dashboard/
COPY --from=build /app/apps/dashboard/package.json ./apps/dashboard/
COPY --from=build /app/apps/dashboard/public ./apps/dashboard/public
COPY --from=build /app/apps/dashboard/.next ./apps/dashboard/.next
COPY --from=build /app/packages/types/dist ./packages/types/dist
COPY --from=build /app/packages/types/package.json ./packages/types/
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

EXPOSE 3001

CMD ["node", "apps/dashboard/node_modules/.bin/next", "start", "-p", "3001"]
