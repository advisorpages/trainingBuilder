# Leadership Training App Product Requirements Document (PRD)

## 1. Goals and Background Context

### Goals
*   Increase attendance at training and event sessions.
*   Improve the efficiency of creating and promoting sessions for the leadership team.
*   Enable users to quickly understand the value of a session and why they should attend.
*   Generate compelling content that encourages users to share it with others.
*   Streamline the process of creating high-quality event and training "sessions".

### Background Context
A significant amount of time is spent planning training sessions, which leaves little time for effective promotion, resulting in low attendance. The proposed application will provide an intuitive, mobile-first platform that empowers leadership and content creators to generate high-quality training and event sessions in minutes. It will leverage a wizard-style interface and AI to generate professional promotional copy, create excitement, and clearly communicate the value of attending.

### Change Log

| Date | Version | Description | Author |
| :--- | :--- | :--- | :--- |
| 2025-09-16 | 1.0 | Initial draft from project brief | BMad Master |

---
## 2. Requirements (Revised v8)

### Functional
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

### Non-Functional
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
## 3. User Interface Design Goals (Revised v3)

### Overall UX Vision (MVP)
The user experience will be **efficient, intuitive, and clean**. The goal is to deliver a stable and performant application that empowers users to create content quickly, using modern and highly usable interface patterns.

### Key Interaction Paradigms (MVP)
*   **The Worksheet:** Session creation will take place on a single-page "worksheet." This layout will provide a form for data entry alongside a live preview that updates in real-time (on desktop) or in a separate tab (on mobile).
*   **The Dynamic Grid:** The dashboard will present session and incentive cards in a dynamic grid layout (i.e., "Masonry"). This provides a more engaging and spatial feel than a standard list, while remaining clean and performant.
*   **Dynamic Content Pages:** Public-facing content will be presented on clean, readable, and shareable template-driven pages.

### Core Screens and Views
*   Public Homepage
*   Login Screen
*   Authenticated Dashboard (Dynamic Grid)
*   Creation Screen (The Worksheet)
*   Dynamic Detail Page
*   Admin screens

### Accessibility: WCAG AA
The application will target WCAG 2.1 AA compliance to ensure it is usable by people with a wide range of abilities.

### Branding (MVP)
The initial design will use a clean, neutral, and modern theme that can be easily adapted once a formal style guide is provided.

### Target Device and Platforms: Web Responsive
The application will be a responsive web app, designed with a mobile-first approach.

### Future Vision: Thematic Enhancements
While the MVP will be visually clean, a key goal for a future version is to enhance these layouts with a more tactile and engaging visual theme (the "Creator's Workshop"). This post-MVP effort would focus on adding textures, more expressive typography, and other creative elements to the established "Worksheet" and "Dynamic Grid" patterns.

---
## 4. Technical Assumptions (Revised v2)

### Proposed Technology Stack
*   **Frontend:** React (using Vite for tooling) with TypeScript.
*   **Backend:** Node.js (using NestJS framework) with TypeScript.
*   **Database:** PostgreSQL.

### Development & Deployment Strategy
Development will be done locally using a Docker Compose setup to mirror the production environment. This ensures consistency across all development, staging, and production environments. The final application will be deployed as Docker containers to a remote server.

### Repository Structure: Monorepo
A monorepo is recommended to simplify dependency management and code sharing.

### Service Architecture: Monolith
A monolithic architecture is recommended for the MVP to reduce complexity.

### Testing Requirements: Unit & Integration Tests
The strategy will include Unit Tests for isolated components and Integration Tests for interactions between system parts.

### Additional Technical Assumptions and Requests
*   The application will be deployed to a cloud provider (TBD).
*   API documentation for third-party services (such as `qr-cloud`) will be sourced from the Context7 library server. The library ID for the QR code service is `/websites/qrcodes_at_api-documentation`.

---
## 5. Epic List

1.  **Epic 1: Foundation, Auth, & Resource Management**
    *Goal:* Establish the core technical foundation, a secure authentication system for all three user roles (Brokers, Content Developers, Trainers), and provide basic tools to manage trainers and locations.

2.  **Epic 2: Core Content Creation**
    *Goal:* Implement the end-to-end "worksheet" workflow for creating a new session.

3.  **Epic 3: Publishing**
    *Goal:* Introduce content lifecycle management, allowing a Content Developer to manage the status of a session.

4.  **Epic 4: Trainer Enablement & Dashboard**
    *Goal:* Implement the Trainer Dashboard and the automated email notification to create the "Trainer Kit" experience.

5.  **Epic 5: Public Engagement & Registration**
    *Goal:* Launch the public-facing side of the application and implement the user registration workflow.

6.  **Epic 6: Incentive Management**
    *Goal:* Build the separate workflow for creating and managing promotional incentives.

---
## 6. Epic Details

### Epic 1: Foundation, Auth, & Resource Management (Revised)

*Expanded Goal:* The primary objective of this epic is to build the complete technical backbone of the application and deliver the core administrative capabilities. This involves setting up a reproducible, Docker-based development environment, implementing a robust authentication system for all three user roles, and creating the interfaces to manage foundational data, attributes, and settings.

**Stories:**
*   **Story 1.1: Project & Docker Setup**
*   **Story 1.2: Database Schema & Roles**
*   **Story 1.3: User Authentication**
*   **Story 1.4: Location Management**
*   **Story 1.5: Trainer Resource Management**
*   **Story 1.6: System Configuration Management (New)**
*   **Story 1.7: Attribute Management (New)**

### Epic 2: Core Content Creation

*Expanded Goal:* This epic is the heart of the application. Its purpose is to deliver the complete, end-to-end workflow for creating a new training session. This includes building the "worksheet" UI, populating it with data from Epic 1 (trainers, locations), and integrating the full AI content generation loop—from creating and reviewing the prompt to generating and refining the promotional copy.

**Stories:**
*   **Story 2.1: Session Worksheet UI**
*   **Story 2.2: Save Session Draft**
*   **Story 2.3: AI Prompt Generation and Review**
*   **Story 2.4: AI Copy Generation and Display**
*   **Story 2.5: Iterative Content Regeneration**
*   **Story 2.6: Save AI Content to Draft**

### Epic 3: Publishing

*Expanded Goal:* This epic introduces the concept of a content lifecycle. It provides the tools for a Content Developer to manage the state of a session, moving it from a private draft to a publicly visible event. This is the crucial link between content creation and public engagement.

**Stories:**
*   **Story 3.1: Display Session Status**
*   **Story 3.2: Manual Status Updates**
*   **Story 3.3: System Logic for Publishing**

### Epic 4: Trainer Enablement & Dashboard (Revised)

*Expanded Goal:* This epic focuses entirely on the Trainer's experience. The goal is to empower trainers by giving them a dedicated, secure space to view their upcoming assignments in detail. This includes building their dashboard, providing more information than is publicly available, and creating a reusable "Trainer Kit" experience through AI-powered coaching tips and an automated email notification system.

**Stories:**
*   **Story 4.1: Trainer Dashboard Shell**
*   **Story 4.2: Upcoming Session List**
*   **Story 4.3: Detailed Session View**
*   **Story 4.4: View or Generate AI Coaching Tips (Revised)**
*   **Story 4.5: Trainer Kit Email Notification**
*   **Story 4.6: Coaching Tip Curation (New)**

### Epic 5: Public Engagement & Registration

*Expanded Goal:* With the content creation and publishing workflows now in place, this epic focuses on building the entire public-facing experience. The goal is to create the web pages that will attract attendees and allow them to register for sessions. This involves building the homepage, the dynamic session detail pages, and implementing the robust, two-stage registration system.

**Stories:**
*   **Story 5.1: Public Homepage**
*   **Story 5.2: Dynamic Session Page**
*   **Story 5.3: Registration Form & Local Capture**
*   **Story 5.4: Asynchronous Webhook Sync**
*   **Story 5.5: QR Code Generation**

### Epic 6: Incentive Management (Revised v3)

*Expanded Goal:* This epic delivers the final major feature of the application: the ability to create and manage promotional incentives. This workflow will use a single, efficient AI step to generate all required text content and will include convenience features like cloning to speed up the process for users.

**Stories:**
*   **Story 6.1: Incentive Worksheet UI (Revised)**
*   **Story 6.2: Save Incentive Draft**
*   **Story 6.3: One-Step AI Content Generation (Revised)**
*   **Story 6.4: Incentive Publishing**
*   **Story 6.5: Clone Incentive (New)**
