# Convex Logging Monorepo

A pnpm monorepo containing a Hono API service and Next.js web app with shared arktype types.

## Structure

```
.
├── apps/
│   ├── ingest-server/          # Hono service for ingesting Convex logs
│   └── dashboard/          # Next.js dashboard app
├── packages/
│   └── types/        # Shared arktype type definitions
├── package.json
└── pnpm-workspace.yaml
```

## Getting Started

### Install Dependencies

```bash
pnpm install
```

### Development

Run both apps in parallel:
```bash
pnpm dev
```

Run individual apps:
```bash
pnpm dev:ingest-server   # Run Hono API on port 3000
pnpm dev:dashboard   # Run Next.js app on port 3000
```

### Build

Build all apps:
```bash
pnpm build
```

Build individual apps:
```bash
pnpm build:ingest-server
pnpm build:dashboard
```

## Packages

### @repo/types

Shared arktype type definitions used across the API and web app:
- `BaseEvent`
- `Function`
- `VerificationEvent`
- `ConsoleEvent`
- `FunctionExecutionEvent`
- `ConvexEvent`

Both runtime validators and TypeScript types are exported.

### @repo/ingest-server

Hono-based API service that:
- Ingests Convex function execution events
- Validates events using arktype schemas
- Stores data in ClickHouse

### @repo/dashboard

Next.js dashboard application with:
- TypeScript
- Tailwind CSS
- Shared types from `@repo/types`
