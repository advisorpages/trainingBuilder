# System Architecture Document: Leadership Training App

This document outlines the technical architecture for the Leadership Training App, based on the requirements and decisions defined in the PRD.

---

## 1. High-Level Architecture

The system will be a **monolithic application** composed of three primary components:

1.  **Frontend:** A browser-based Single Page Application (SPA) built with **React and TypeScript**. It will be responsible for all user interface rendering and client-side state management.
2.  **Backend:** A monolithic API server built with **Node.js and the NestJS framework (using TypeScript)**. It will handle all business logic, data processing, and communication with the database and external services.
3.  **Database:** A **PostgreSQL** database. The application will connect to a pre-existing (brownfield) database, extending it with new tables as required.

### Development & Deployment

-   **Repository:** The project will be structured as a **Monorepo** to simplify development and code sharing.
-   **Environment:** Development will be containerized using **Docker Compose** to ensure consistency between local and production environments.
-   **Deployment:** The final application will be deployed as a set of **Docker containers** to a cloud hosting provider.

---

## 2. Project Structure (Monorepo)

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

## 3. Database Schema

The schema will utilize existing tables where possible and introduce new tables to support application features. All new tables will follow a consistent naming convention.

*Note: Tables marked with `(Existing)` are assumed to be part of the brownfield database.* 

### Core Tables

-   **`users`**: Stores user accounts.
    -   `id` (PK), `email` (unique), `password_hash`, `role_id` (FK to `roles`)
-   **`roles`**: Defines user roles.
    -   `id` (PK), `name` ("Broker", "Content Developer", "Trainer")
-   **`system_settings`**: Key-value store for admin-configurable settings.
    -   `key` (PK), `value`

### Resource Tables

-   **`locations`** (Existing): Stores event locations.
    -   `id` (PK), `name`, `address`
-   **`trainers`** (Existing): Stores trainer profiles.
    -   `id` (PK), `name`, `email`, `bio`
-   **`topics`** (Existing): Stores reusable content topics.
    -   `id` (PK), `name`, `description`
-   **`audiences`**: Stores target audience types.
    -   `id` (PK), `name`
-   **`tones`**: Stores AI generation tones.
    -   `id` (PK), `name`
-   **`categories`**: Stores content categories.
    -   `id` (PK), `name`

### Feature Tables

-   **`sessions`**: The core table for training sessions.
    -   `id` (PK), `title`, `description`, `start_time`, `end_time`, `status`, `qr_code_url`, `author_id` (FK to `users`), `location_id` (FK to `locations`), `trainer_id` (FK to `trainers`), etc.
-   **`session_topics`** (Join Table): Links sessions to topics (many-to-many).
    -   `session_id` (FK), `topic_id` (FK)
-   **`incentives`**: Stores promotional incentives.
    -   `id` (PK), `title`, `description`, `rules`, `start_date`, `end_date`, `status`, `author_id` (FK to `users`)
-   **`registrations`**: Captures user registrations for sessions.
    -   `id` (PK), `session_id` (FK), `name`, `email`, `referred_by`, `created_at`, `sync_status`
-   **`coaching_tips`**: Stores reusable AI-generated coaching tips.
    -   `id` (PK), `text`
-   **`topic_coaching_tips`** (Join Table): Links tips to topics (many-to-many).
    -   `topic_id` (FK), `tip_id` (FK)

---

## 4. API Specification (High-Level)

The backend will expose a RESTful API. Access will be controlled by JWT authentication and role-based permissions.

-   **`POST /auth/login`**: Public. Authenticates a user and returns a JWT.

-   **`GET /sessions`**: Public. Returns a list of all *published* sessions.
-   **`GET /sessions/{id}`**: Public. Returns the details for a single *published* session.
-   **`POST /sessions/{id}/register`**: Public. Submits a registration for a session.

-   **`GET /admin/sessions`**: Content Developer. Returns all sessions regardless of status.
-   **`POST /admin/sessions`**: Content Developer. Creates a new session draft.
-   **`PATCH /admin/sessions/{id}`**: Content Developer. Updates a session.
-   **`DELETE /admin/sessions/{id}`**: Content Developer. Deletes a session.

-   **`GET /trainer/dashboard`**: Trainer. Returns sessions assigned to the logged-in trainer.
-   **`GET /trainer/sessions/{id}`**: Trainer. Returns detailed view of an assigned session.

-   **`POST /ai/generate-content`**: Content Developer. The main endpoint for the AI generation workflow.

-   **(Admin Endpoints)**: A set of CRUD endpoints under `/admin/` for managing `locations`, `trainers`, `topics`, `audiences`, `tones`, `categories`, `settings`, etc. All require Content Developer role.
