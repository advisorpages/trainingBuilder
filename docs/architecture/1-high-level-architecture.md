# 1. High-Level Architecture

The system will be a **monolithic application** composed of three primary components:

1.  **Frontend:** A browser-based Single Page Application (SPA) built with **React and TypeScript**. It will be responsible for all user interface rendering and client-side state management.
2.  **Backend:** A monolithic API server built with **Node.js and the NestJS framework (using TypeScript)**. It will handle all business logic, data processing, and communication with the database and external services.
3.  **Database:** A **PostgreSQL** database. The application will connect to a pre-existing (brownfield) database, extending it with new tables as required.

## Development & Deployment

-   **Repository:** The project will be structured as a **Monorepo** to simplify development and code sharing.
-   **Environment:** Development will be containerized using **Docker Compose** to ensure consistency between local and production environments.
-   **Deployment:** The final application will be deployed as a set of **Docker containers** to a cloud hosting provider.

---
