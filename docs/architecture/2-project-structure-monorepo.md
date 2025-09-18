# 2. Project Structure (Monorepo)

The monorepo will be organized using a `packages` directory to separate the different parts of the application.

```text
/ (root)
|-- docker-compose.yml
|-- package.json
|-- packages/
|   |-- frontend/
|   |   |-- public/
|   |   |-- src/
|   |   |   |-- components/
|   |   |   |-- pages/
|   |   |   |-- services/
|   |   |-- Dockerfile
|   |   |-- package.json
|   |
|   |-- backend/
|   |   |-- src/
|   |   |   |-- modules/
|   |   |   |   |-- auth/
|   |   |   |   |-- sessions/
|   |   |   |   |-- users/
|   |   |   |-- services/
|   |   |   |   |-- ai.service.ts
|   |   |-- Dockerfile
|   |   |-- package.json
|   |
|   |-- shared/
|   |   |-- src/
|   |   |   |-- types/
|   |   |   |-- constants.ts
|   |   |-- package.json
```

-   **`packages/frontend`**: The React SPA.
-   **`packages/backend`**: The NestJS API server.
-   **`packages/shared`**: A shared library for TypeScript types, interfaces, and constants to be used by both the frontend and backend, ensuring consistency.

---
