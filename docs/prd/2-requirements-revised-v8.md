# 2. Requirements (Revised v8)

## Functional
*   **FR1:** Public Homepage
*   **FR2:** User Authentication: The system must provide a login portal for Brokers, Content Developers, and **Trainers**.
*   **FR3:** Authenticated Dashboard
*   **FR4:** Session Management
*   **FR5:** Topic Selection
*   **FR6:** Session Creation Wizard
*   **FR7:** AI-Powered Copy Generation (with prompt review)
*   **FR8:** Iterative Content Review
*   **FR9:** Dynamic Session Pages
*   **FR10:** QR Code Integration
*   **FR11:** Publishing Workflow
*   **FR12: Trainer Dashboard:** A dedicated page for logged-in Trainers that displays a detailed view of all published sessions assigned to them for the next 7 days.
*   **FR13: Trainer Kit Notification:** Upon session assignment, an email will be sent to the trainer containing key details and a link to their Trainer Dashboard.
*   **FR14: Incentive Management:** **Content Developers** must be able to create and manage time-bound incentives.

## Non-Functional
1.  **NFR1:** The session creation process should take less than 5 minutes for an experienced user.
2.  **NFR2:** The user interface must be intuitive and require minimal training.
3.  **NFR3:** The application must be responsive and performant.
4.  **NFR4:** All user data must be handled and stored securely.
5.  **NFR5:** The background sync for registrations must include retry logic and failure monitoring.
6.  **NFR6: Brownfield Database:** The application must integrate with the pre-existing PostgreSQL database schema.
7.  **NFR7: Role-Based Access:** The system must enforce permissions based on the user's role (Broker, Content Developer, **Trainer**).
8.  **NFR8: Multi-Template Architecture:** The architecture must support multiple, selectable page templates in the future.
9.  **NFR9: AI Provider Abstraction:** The integration with external AI models must be done through an internal abstraction layer.

---