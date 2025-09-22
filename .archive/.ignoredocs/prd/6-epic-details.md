# 6. Epic Details

## Epic 1: Foundation, Auth, & Resource Management (Revised)

*Expanded Goal:* The primary objective of this epic is to build the complete technical backbone of the application and deliver the core administrative capabilities. This involves setting up a reproducible, Docker-based development environment, implementing a robust authentication system for all three user roles, and creating the interfaces to manage foundational data, attributes, and settings.

**Stories:**
*   **Story 1.1: Project & Docker Setup**
*   **Story 1.2: Database Schema & Roles**
*   **Story 1.3: User Authentication**
*   **Story 1.4: Location Management**
*   **Story 1.5: Trainer Resource Management**
*   **Story 1.6: System Configuration Management (New)**
*   **Story 1.7: Attribute Management (New)**

## Epic 2: Core Content Creation

*Expanded Goal:* This epic is the heart of the application. Its purpose is to deliver the complete, end-to-end workflow for creating a new training session. This includes building the "worksheet" UI, populating it with data from Epic 1 (trainers, locations), and integrating the full AI content generation loop—from creating and reviewing the prompt to generating and refining the promotional copy.

**Stories:**
*   **Story 2.1: Session Worksheet UI**
*   **Story 2.2: Save Session Draft**
*   **Story 2.3: AI Prompt Generation and Review**
*   **Story 2.4: AI Copy Generation and Display**
*   **Story 2.5: Iterative Content Regeneration**
*   **Story 2.6: Save AI Content to Draft**

## Epic 3: Publishing

*Expanded Goal:* This epic introduces the concept of a content lifecycle. It provides the tools for a Content Developer to manage the state of a session, moving it from a private draft to a publicly visible event. This is the crucial link between content creation and public engagement.

**Stories:**
*   **Story 3.1: Display Session Status**
*   **Story 3.2: Manual Status Updates**
*   **Story 3.3: System Logic for Publishing**

## Epic 4: Trainer Enablement & Dashboard (Revised)

*Expanded Goal:* This epic focuses entirely on the Trainer's experience. The goal is to empower trainers by giving them a dedicated, secure space to view their upcoming assignments in detail. This includes building their dashboard, providing more information than is publicly available, and creating a reusable "Trainer Kit" experience through AI-powered coaching tips and an automated email notification system.

**Stories:**
*   **Story 4.1: Trainer Dashboard Shell**
*   **Story 4.2: Upcoming Session List**
*   **Story 4.3: Detailed Session View**
*   **Story 4.4: View or Generate AI Coaching Tips (Revised)**
*   **Story 4.5: Trainer Kit Email Notification**
*   **Story 4.6: Coaching Tip Curation (New)**

## Epic 5: Public Engagement & Registration

*Expanded Goal:* With the content creation and publishing workflows now in place, this epic focuses on building the entire public-facing experience. The goal is to create the web pages that will attract attendees and allow them to register for sessions. This involves building the homepage, the dynamic session detail pages, and implementing the robust, two-stage registration system.

**Stories:**
*   **Story 5.1: Public Homepage**
*   **Story 5.2: Dynamic Session Page**
*   **Story 5.3: Registration Form & Local Capture**
*   **Story 5.4: Asynchronous Webhook Sync**
*   **Story 5.5: QR Code Generation**

## Epic 6: Incentive Management (Revised v3)

*Expanded Goal:* This epic delivers the final major feature of the application: the ability to create and manage promotional incentives. This workflow will use a single, efficient AI step to generate all required text content and will include convenience features like cloning to speed up the process for users.

**Stories:**
*   **Story 6.1: Incentive Worksheet UI (Revised)**
*   **Story 6.2: Save Incentive Draft**
*   **Story 6.3: One-Step AI Content Generation (Revised)**
*   **Story 6.4: Incentive Publishing**
*   **Story 6.5: Clone Incentive (New)**
