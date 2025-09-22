# 4. Technical Assumptions (Revised v2)

## Proposed Technology Stack
*   **Frontend:** React (using Vite for tooling) with TypeScript.
*   **Backend:** Node.js (using NestJS framework) with TypeScript.
*   **Database:** PostgreSQL.

## Development & Deployment Strategy
Development will be done locally using a Docker Compose setup to mirror the production environment. This ensures consistency across all development, staging, and production environments. The final application will be deployed as Docker containers to a remote server.

## Repository Structure: Monorepo
A monorepo is recommended to simplify dependency management and code sharing.

## Service Architecture: Monolith
A monolithic architecture is recommended for the MVP to reduce complexity.

## Testing Requirements: Unit & Integration Tests
The strategy will include Unit Tests for isolated components and Integration Tests for interactions between system parts.

## Additional Technical Assumptions and Requests
*   The application will be deployed to a cloud provider (TBD).
*   API documentation for third-party services (such as `qr-cloud`) will be sourced from the Context7 library server. The library ID for the QR code service is `/websites/qrcodes_at_api-documentation`.

---