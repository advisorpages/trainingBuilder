# 3. Database Schema

The schema will utilize existing tables where possible and introduce new tables to support application features. All new tables will follow a consistent naming convention.

*Note: Tables marked with `(Existing)` are assumed to be part of the brownfield database.* 

## Core Tables

-   **`users`**: Stores user accounts.
    -   `id` (PK), `email` (unique), `password_hash`, `role_id` (FK to `roles`)
-   **`roles`**: Defines user roles.
    -   `id` (PK), `name` ("Broker", "Content Developer", "Trainer")
-   **`system_settings`**: Key-value store for admin-configurable settings.
    -   `key` (PK), `value`

## Resource Tables

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

## Feature Tables

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
