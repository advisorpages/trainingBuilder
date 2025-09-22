# 4. API Specification (High-Level)

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
