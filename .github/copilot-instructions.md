# Synvia GIG – AI Coding Playbook

## Monorepo layout & tooling
- Two independent PNPM projects: `frontend/` (Vue 3 + Vite + PrimeVue Sakai) and `micro-services/` (Node 18 + Express + TypeScript).
- Frontend scripts live in `frontend/package.json` (`pnpm dev|build|preview|lint`); backend scripts in `micro-services/package.json` (`pnpm dev` via `tsx watch`, `pnpm build`, `pnpm start`).
- Default ports: Vite 5173, API 3001. Frontend expects `VITE_API_BASE_URL` pointing to the micro-service.

## Environment & secrets
- Copy each `.env.example` to `.env`. Frontend needs `VITE_API_BASE_URL`; backend requires `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`, `AWS_BUCKET`, optional `PORT` and comma-separated `CORS_ORIGIN`.
- Backend fails fast via `src/config/env.ts` if any AWS var is missing; keep values consistent with the target S3 bucket region.

## Frontend architecture highlights
- Entry point `src/main.js` wires Pinia, Vue Router, PrimeVue, `@primeuix/themes/aura`, Tailwind utilities, and global dark-mode toggling via `.app-dark` class.
- Layout shell sits in `src/layout/` and `AppLayout.vue`; `layout/composables/layout.js` manages menu state and persisted theme (localStorage `darkTheme`). Prefer tapping this composable rather than managing DOM classes manually.
- Router (`src/core/router/index.ts`) keeps everything under `AppLayout` behind `requiresAuth` and optional `meta.permission`. Navigation guard uses `useAuthStore()` to enforce session expiration, permission filtering, and redirect to `/auth/login`.
- Authentication is mock-based (`src/core/auth/` + `src/mock/data-users.json`). The Pinia store (`src/stores/auth.js`) persists session data in `sessionStorage`, runs a heartbeat timer, and cooperates with `useActivityTracker` to auto-renew `expiresAt` on user activity.
- HTTP calls must go through `src/services/api.ts`, which injects `x-client-id` headers from the stored user. Add new services beside `src/modules/gig/services/import.ts` to keep axios config centralized.
- Styling combines PrimeVue tokens and custom SCSS under `src/core/layout/`. Favor the existing utility partials (`_mixins.scss`, `_responsive.scss`) instead of ad-hoc inline styles.

## Import experience flow
- UI entrypoints live in `src/modules/gig/views/import/ImportFilesView.vue` (upload + result cards) and `ImportHistoryView.vue` (filters, pagination, overlays). These use PrimeVue components extensively; prefer script-setup + refs/computed patterns already in place.
- `ImportFilesView` calls `uploadCsv` from `src/services/import.ts`, which wraps a multipart POST to `/gig/import/upload`, tracks progress, and surfaces validation errors returned by the backend.
- History view currently consumes `src/mock/data-files-history.json`. To integrate with the API, reuse `fetchImportHistory` (already defined in `src/modules/gig/services/import.ts`) and keep the local filtering/pagination logic intact.

## Micro-service architecture
- `src/server.ts` bootstraps Express, enables CORS (reads `CORS_ORIGIN`), mounts `/health` and the import router. Errors fall through to a last-resort handler returning `{ ok: false }`.
- Upload pipeline (`src/routes/import.ts`): `multer` memory storage + `middleware/upload.ts` restricts CSV MIME and 30MB. Each request:
  - Annotates logs with `clientId`/`userId` from headers, measures time, and writes structured entries via `appendImportLog`.
  - Parses the CSV with `utils/csv.ts` (delimiter detection, header validation, per-column numeric/date checks, localized error messages).
  - Builds deterministic S3 keys with `utils/filename.ts`, uploads via AWS SDK v3, and returns a summary + per-row issues.
  - Reads log history with `readImportLogs`, slicing/paginating in-memory before responding to `/import-files/history`.
- Errors are normalized (`normalizeS3Error`) to actionable HTTP codes (e.g., `S3_ACCESS_DENIED`, `NO_SUCH_BUCKET`). Preserve these codes when extending responses so the frontend’s toast messaging stays accurate.

## Conventions & tips
- Prefer TypeScript in the backend (all `src/**/*.ts`); stick to `<script setup lang="ts">` for new Vue SFCs when touching TypeScript-aware views like the import screens.
- Reuse shared constants from `src/core/config/constants.js` (session timings, toast durations, history page size) instead of hardcoding numbers.
- Dashboard and chart features rely on `src/components/charts/BaseChart.vue`; register new chart types through this component rather than instantiating `vue-echarts` directly to keep theming consistent.
- Mock data powering dashboards/history sits under `src/mock/`. When replacing mocks with live data, maintain the existing shape defined in `src/services/import.ts` and Pinia stores to avoid breaking computed decorators.
- Logging in the micro-service appends JSON lines to `logs/<client>/<yyyy>/<mm>/<dd>.log` in S3. If you add new operations, extend `ImportLogEntry` in `micro-services/src/types/import.ts` so both upload and history endpoints stay in sync.
