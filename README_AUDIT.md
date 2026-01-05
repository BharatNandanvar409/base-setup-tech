# Audit Trails Documentation

## Overview
- Captures per-request data changes across Sequelize models and records them in Postgres and MongoDB.
- Uses `AsyncLocalStorage` to collect audit events during a request, then persists them when the response finishes.
- Sanitizes sensitive fields and computes changed field names for easy inspection.

## Core Flow
1. A request starts and initializes a request context with `requestId`, `actorId`, and an empty `auditEvents` array (`src/middleware/request-context.middleware.ts:3`, `src/utils/request-context.util.ts:16`).
2. Model hooks push structured audit events into the context during `create`, `update`, and `destroy` operations (e.g., `src/models/users.model.ts:69`, `src/models/orders.model.ts:48`).
3. When the response finishes, the API logs middleware:
   - Normalizes and sanitizes all collected events.
   - Computes `updated_fields` diffs.
   - Writes a row to the SQL `api_audit_logs` table and a document to the MongoDB audit collection (`src/middleware/api-logs.middleware.ts:27`).

## Middlewares
- `requestContextMiddleware` (`src/middleware/request-context.middleware.ts:3`)
  - Creates an `AsyncLocalStorage` context for each request with:
    - `requestId`: unique per request.
    - `actorId`: derived from `req.user?.id` (set by auth).
    - `auditEvents`: array populated by model hooks.
  - Registered early in the pipeline (`src/app.ts:25`).
- `apiLogsMiddleware` (`src/middleware/api-logs.middleware.ts:8`)
  - Listens for `res.finish`, processes `auditEvents`, and persists:
    - SQL via `AuditLog.create(...)`.
    - Mongo via `getMongoAuditCollection().insertOne(...)`.
  - Also captures request headers/body, response body, status, and duration.
  - Registered globally after the request context (`src/app.ts:26`).
- Auth integration
  - `authMiddleware` attaches `req.user` (`src/middleware/auth.middleware.ts:5`), enabling `actorId` capture in the request context.

## Utilities
- Request Context (`src/utils/request-context.util.ts:16`)
  - `requestAsyncStore: AsyncLocalStorage<RequestContext>` exposes a per-request store.
  - `RequestContext` contains `{ requestId, actorId?, auditEvents }`.
- Audit Helpers (`src/utils/audit.util.ts`)
  - `sanitizeRecord(table, record)` masks sensitive fields like `password`, `token`, `awsSecretAccessKey`, `accessKey` (`src/utils/audit.util.ts:3`).
  - `diffChangedFields(prev, next)` computes changed field names, ignoring timestamps (`src/utils/audit.util.ts:42`).
  - `mergeAuditEvent(acc, table, prev, next)` merges normalized prev/next records into an accumulator (`src/utils/audit.util.ts:18`).

## Model Hooks (Sequelize)
All audited models implement `@AfterCreate`, `@AfterUpdate`, and `@AfterDestroy` hooks that push audit events to the request context:
- Pattern
  - On create: `{ table, operation: 'create', prev: null, next: instance.toJSON() }`.
  - On update: `{ table, operation: 'update', prev: previousDataValues, next: instance.toJSON() }`.
  - On destroy: `{ table, operation: 'destroy', prev: instance.toJSON(), next: null }`.
- Examples
  - Users (`src/models/user.model.ts:69`)
  - Products (`src/models/products.model.ts:74`)
  - Orders (`src/models/orders.model.ts:48`)
  - OrderItems (`src/models/orderitems.model.ts`)
  - Destinations (`src/models/destination.model.ts`)
  - UserPreferences (`src/models/userpreferences.model.ts:80`)
  - Trips (`src/models/trip.model.ts`)
  - TripDestinations (`src/models/tripdestinations.model.ts`)
  - Itineraries (`src/models/itinerary.model.ts`)
  - ItineraryDays (`src/models/itineraryday.model.ts`)
  - ItineraryActivities (`src/models/itineraryactivity.model.ts`)

## Storage
- SQL (Postgres via Sequelize)
  - Model: `AuditLog` (`src/models/auditlog.model.ts`)
  - Table: `api_audit_logs` (`src/models/auditlog.model.ts:18`)
  - Fields:
    - `requestId`, `method`, `path`, `statusCode`, `success`, `durationMs`, `actorId?`
    - `prev_data`: `Record<string, any[]>` grouped by table
    - `update_data`: `Record<string, any[]>` grouped by table
    - `updated_fields`: `Record<string, string[]>` changed field names
  - Indexes on `requestId`, `(path, method)`, `statusCode`, `createdAt` (`src/models/auditlog.model.ts:21`).
- MongoDB (Audit Mirror)
  - Config: `getMongoAuditCollection` (`src/config/mongo.config.ts:10`)
  - Env vars: `MONGO_URI`, `MONGO_DB`, `MONGO_AUDIT_COLLECTION` (default `api_audit_logs`).
  - Creates indexes on `requestId`, `(path, method)`, `statusCode`, `createdAt` (`src/config/mongo.config.ts:29`).
  - Stored document includes request/response snapshot and actor metadata.

## Routes
- Audit inspection (`src/routes/audit.routes.ts`)
  - `GET /audit/latest` → most recent log (`src/routes/audit.routes.ts:5`)
  - `GET /audit/list?limit=10` → paginated list (`src/routes/audit.routes.ts:18`)
  - `GET /audit/by-request/:id` → by `requestId` (`src/routes/audit.routes.ts:31`)
- Swagger
  - UI: `GET /api-docs` (`src/app.ts:45`)
  - Source: `src/swagger/swagger.json` (audit endpoints present).

## How It Works (Step-by-Step)
- Request enters:
  - `requestContextMiddleware` creates a context with `{ requestId, actorId, auditEvents: [] }`.
- Business logic mutates models:
  - Sequelize hooks push audit events into `auditEvents`.
- Response finishes:
  - `apiLogsMiddleware` reads all `auditEvents`, sanitizes fields, builds grouped `prev_data` and `update_data`, and computes `updated_fields` via `diffChangedFields`.
  - Persists a row to the SQL `api_audit_logs` table and a mirror document to MongoDB.
- Operators inspect:
  - Use `/audit/*` routes or query the SQL/Mongo stores directly.

## Sensitive Data Handling
- Headers
  - Masks `authorization` in stored request headers (`src/middleware/api-logs.middleware.ts:74`).
- Body/Data
  - Masks sensitive fields: `password`, `token`, `awsSecretAccessKey`, `accessKey` (`src/utils/audit.util.ts:3`).
- Timestamps ignored during diffs: `createdAt`, `updatedAt`, `deletedAt` (`src/utils/audit.util.ts:52`).

## Packages Involved
- `express` → HTTP server and middleware.
- `sequelize`, `sequelize-typescript`, `reflect-metadata` → ORM and model hooks.
- `pg`, `pg-hstore` → Postgres connector.
- `mongodb` → Audit mirror storage and indexing.
- `async_hooks` (Node built-in) → `AsyncLocalStorage` for per-request context.
- `dotenv` → Environment configuration.
- `swagger-ui-express` → Interactive API docs including audit routes.

## Extending Audits
- Add audit to a new model:
  - Implement `@AfterCreate`, `@AfterUpdate`, `@AfterDestroy` hooks that push events to `requestAsyncStore.getStore()?.auditEvents`.
  - Ensure the model is included in Sequelize `models` (`src/config/database.ts:12`).
- Ensure actor attribution:
  - Attach `req.user` via `authMiddleware` so `actorId` is captured by the context.
- Custom sanitization/diff rules:
  - Update `sensitiveFields` or logic in `sanitizeRecord` / `diffChangedFields` (`src/utils/audit.util.ts`).

## Quick Check
- Start the app and hit any mutating endpoint (e.g., orders demo in `README_API.md`).
- Inspect results:
  - `GET /audit/latest`
  - `GET /audit/list?limit=20`
  - `GET /audit/by-request/{requestId}`

