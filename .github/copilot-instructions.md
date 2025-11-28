# Synvia GIG — Copilot / AI Agent Instructions (condensed)

This file gives targeted, discoverable guidance so an AI coding agent becomes productive quickly in this mono-repo.

- Repo layout: two independent projects under the repo root: `frontend/` (Vue 3 + Vite + Pinia + PrimeVue) and `micro-services/` (Node 18 + Express + TypeScript).
- Dev commands:
  - Frontend: `cd frontend && pnpm dev` (other scripts in `frontend/package.json`: `build|preview|lint`).
  - Backend: `cd micro-services && pnpm dev` (uses `tsx` watch). Default ports: Vite 5173, API 3001.
- Env: copy `.env.example` → `.env`. Frontend needs `VITE_API_BASE_URL`. Backend requires AWS envs (`AWS_*`, `AWS_BUCKET`, `AWS_DEFAULT_REGION`) — see `micro-services/src/config/env.ts` (fails fast).

- Key frontend entry points and patterns:
  - App bootstrap: `src/main.js` (wires Pinia, Router, PrimeVue, theme). Use `layout/composables/layout.js` for theme/menu state.
  - Router & auth: `src/core/router/index.ts` uses `meta.requiresAuth` and `meta.permission`; guard consults `src/stores/auth.js` (session in `sessionStorage`, heartbeat + activity tracker).
  - API surface: all HTTP calls go through `src/core/services/api.ts` (adds `x-client-id`). Add new service modules adjacent to `src/modules/gig/services/import.ts` to reuse axios configuration.
  - Import UI: `src/modules/gig/views/import/ImportFilesView.vue` and `ImportHistoryView.vue`. Use script-setup, refs/computed, and PrimeVue components.

- Key backend components and flow:
  - Server: `micro-services/src/server.ts` mounts `/health` and import routes.
  - Upload pipeline (`micro-services/src/routes/import.ts`): multer (memory), `middleware/upload.ts` (CSV + 30MB). Flow: annotate request → parse CSV (`utils/csv.ts`) → build deterministic S3 key (`utils/filename.ts`) → upload via AWS SDK v3 → append structured logs → return summary + per-row issues.
  - Log shape & S3: logs written as JSON lines to S3 under `logs/<client>/<yyyy>/<mm>/<dd>.log`. Keep `micro-services/src/types/import.ts::ImportLogEntry` in sync when changing log payloads.

- Conventions and gotchas for agents:
  - Backend code is TypeScript — prefer .ts files and keep types in `micro-services/src/types/`.
  - Frontend: prefer `<script setup lang="ts">` for new SFCs when touching TypeScript-aware views.
  - Centralized HTTP: always use `src/core/services/api.ts` so headers, timeouts and interceptors stay consistent.
  - Mock data exists under `src/mock/` (`data-files-history.json`, `data-users.json`). Preserve data shapes when replacing mocks with real API calls.
  - Environment checks: `micro-services/src/config/env.ts` fails fast; do not run backend without required AWS vars.

- Where to add features (practical examples):
  - New frontend feature module: `src/modules/<feature>/services/*.ts` and views under `src/modules/<feature>/views`.
  - New backend route: add route file under `micro-services/src/routes/`, wire it in `server.ts`, and add types in `micro-services/src/types/`.

- Recommended quick tasks for validation:
  - Start frontend + backend locally and hit `/health` to verify API connectivity.
  - Upload a small CSV via the frontend import screen and confirm logs appear (or check backend console) to validate CSV parsing path.

If anything here is unclear or you'd like more examples (patched code snippets showing where to add a new import service, or an example `pnpm` orchestration script), tell me which area to expand.
