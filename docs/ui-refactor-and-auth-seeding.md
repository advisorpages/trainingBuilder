# UI Refactor and Auth Seeding — Implementation Notes

This document summarizes front‑end UI structure changes and back‑end authentication seeding updates applied to improve consistency and developer experience.

## Summary

- Frontend now uses Tailwind CSS with nested layouts and consistent SPA navigation.
- Page‑level CSS for Public Homepage and Session Detail migrated to Tailwind; repeated global styles removed.
- Internal links standardized to React Router `<Link>`/`useNavigate`.
- Monorepo imports updated to use `@leadership-training/shared` instead of relative paths.
- Backend adds a dev‑only seeder that creates demo roles and users; dev mode auto‑syncs schema.

---

## Frontend Changes

- Tailwind integration
  - Added: `packages/frontend/tailwind.config.js`, `packages/frontend/postcss.config.js`.
  - Updated: `packages/frontend/package.json` devDependencies (tailwindcss, postcss, autoprefixer).
  - Replaced global CSS with Tailwind entry in `packages/frontend/src/index.css`.

- Layouts + routing
  - New layouts: `src/layouts/PublicLayout.tsx`, `src/layouts/AppLayout.tsx`.
  - Nested routes in `src/App.tsx`:
    - Public: `/`, `/sessions/:sessionId`, `/login` under `PublicLayout`.
    - Protected: `/dashboard`, `/sessions/*`, `/incentives/*`, `/admin/*`, `/trainer/*`, `/analytics` under `AppLayout` guarded by `ProtectedRoute`.

- CSS cleanup and migration
  - Removed global centering/width constraints from `App.css`; simplified legacy styles.
  - Migrated Public Homepage and Session Detail page CSS to Tailwind; removed:
    - `src/pages/PublicHomepage.css`
    - `src/pages/SessionDetailPage.css`
  - Converted many button styles to Tailwind utilities across pages/components.

- SPA navigation fixes
  - Replaced internal `<a href>` and `window.location.href` usages where appropriate:
    - Dashboard/Manage pages breadcrumbs use `<Link>`.
    - Trainer Dashboard quick actions use `useNavigate`.

- Monorepo import hygiene
  - Updated front‑end imports to `@leadership-training/shared` (types, etc.).

### Env and Run Notes (Frontend)

- Ensure `packages/frontend/.env` contains:
  - `VITE_API_URL=http://localhost:3001/api`
- After pulling changes:
  - `cd packages/frontend && npm install && npm run dev`
  - If using Docker: rebuild the frontend image to install Tailwind/PostCSS.

---

## Backend Changes

- Dev seeding module
  - Added `DevModule` and `DevSeederService`:
    - Files:
      - `packages/backend/src/modules/dev/dev.module.ts`
      - `packages/backend/src/modules/dev/dev-seeder.service.ts`
    - On startup in development (or when `SEED_DEMO=true`):
      - Ensures roles: Broker, Content Developer, Trainer
      - Ensures demo users (active) with password `Password123!`:
        - `sarah.content@company.com` (Content Developer)
        - `john.trainer@company.com` (Trainer)
        - `broker1@company.com` (Broker)
  - Wired seeder call in `packages/backend/src/main.ts` after app bootstrap.

- Dev schema sync
  - `packages/backend/src/app.module.ts`: `synchronize` set to `true` when `NODE_ENV=development` to auto‑create tables locally. Remains disabled for production.

### Env and Run Notes (Backend)

- Ensure `packages/backend/.env` has:
  - `NODE_ENV=development`
  - `PORT=3001`
  - `JWT_SECRET=<set value>`
  - Database connection values. If backend runs in Docker and DB is on host, set `DATABASE_HOST=host.docker.internal` (Mac/Windows) instead of `localhost`.
- Optional: set `SEED_DEMO=true` to force seeding in non‑dev environments.
- After changes:
  - Restart backend to trigger seeding.

### Demo Logins

- Content Developer: `sarah.content@company.com` / `Password123!`
- Trainer: `john.trainer@company.com` / `Password123!`
- Broker: `broker1@company.com` / `Password123!`

---

## Docker Notes

- Frontend: image must be rebuilt to pick up Tailwind/PostCSS.
  - `docker compose build frontend && docker compose up -d frontend`
- Backend: rebuild if environment or code changed; ensure DB hostname is reachable from container.

---

## Rollback / Safety

- Tailwind setup is isolated to frontend package; removing it involves deleting Tailwind config files and reverting `index.css` and class names.
- Dev seeding only runs in development or when `SEED_DEMO=true`. No effect in production unless explicitly enabled.

---

## Follow‑ups (Optional)

- Migrate remaining component CSS (`SessionContent.css`, `SessionCard.css`, `IncentiveCard.css`, `RegistrationForm.css`) to Tailwind utilities for full consistency.
- Introduce a shared Button component or className helpers to reduce repeated Tailwind class strings.

