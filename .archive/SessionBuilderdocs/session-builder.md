## Prompt

I am a content developer and I want to grow my financial services branch. I have a personal RAG that I want to leverage in my training makeer app. I sometimes dont know what training to develop and want to use a combinarion of the RAG, input from the user to come up with some ideas for training. Sessions are training days and topics make up sessions

I'm thinking this workflow would look something like this:

1) Input fields
    Pick a category
    Pick a session type: event, training, workshop, webinar
    What do you want people to do after the session is done.
    Is there a current problem you want to fix in this session? (optional input box)
    Are there specific topics you want covered in this training? (optional input box)
    Date of the session
    Start and end time
    location of training

2) Using the input from the user. Query the RAG and previous topics of the save category for more specific niche info to help with the output. If RAG is not available just query from the existing topics in the db of the same category.

3) Show the user an example of a complete session in a skimmable format. 

The session would follow this format.
Opener (10-15 mins)
Topic 1: 30 mins
Topic 2: 30 mins is an exercise to strengthen the topic and engage the group
Inspirational Video (10 mins)
Closing speaker (20 mins)

The user can manually edit each section. Also they can CRUD topics. They can also select from past topics to include in this session. Once they're happy they can move forward to the next step.

4) Using the info they approved from the last step, they would use AI to develop marketing promo content. (workflow and database already in place). 
5) Create a landing page using the info from step 4. (Leverage workflow and database already in place)
6) Create page (training kit) to assist trainers assigned to a topic in the session how to deliver it better and prepare.
7) Create page (markering kit) to coach team mates how to market this session to others.

I already have this app completed and most of the modules already developed. This new workflow is simply combining and enhancing the existing architecture I already have in place.

Help me brainstorm ideas by leveraging the existing app I already have.

## Implementation Plan

This plan integrates the new session builder by extending existing, well-structured patterns in the application.

### Step 1: Input Form (Frontend)

*   **Action:** Create a new React component `SessionBuilderWizard` in `packages/frontend/src/pages/sessions/`.
*   **Function:** This will be a multi-step form for user input (`category`, `session type`, etc.).
*   **Outcome:** On submission, it will call a new backend endpoint: `POST /api/sessions/suggest-outline`.

### Step 2: Generate Session Outline (Backend)

*   **Action:** This is the core new logic.
    1.  **New DTO:** Create `SuggestSessionOutlineDto` for the input form.
    2.  **New Interface:** Define a `SessionOutline` interface for the structured output (Opener, Topics, etc.).
    3.  **Enhance `TopicsService`:** Add `findRelevantTopics(categoryId: string, keywords: string[]): Promise<Topic[]>`. This will query existing topics based on user input.
    4.  **Enhance `AIService`:** Add `generateSessionOutline(request: SuggestSessionOutlineDto, relevantTopics: Topic[]): Promise<SessionOutline>`. This will use a new AI prompt template (`session-outline-generator.md`) to generate the session structure.
    5.  **New Endpoint:** Create `POST /sessions/suggest-outline` in `SessionsController` to orchestrate this logic.

### Step 3: Edit Session Outline (Frontend/Backend)

*   **Action:** Display the generated `SessionOutline` in an editable format.
*   **Function:** The `SessionBuilderWizard` will display the outline. Users can CRUD topics, leveraging existing `GET /api/topics` endpoints.
*   **Outcome:** On approval, the frontend will call the existing `POST /api/sessions` endpoint, transforming the outline into the `CreateSessionDto`.

### Step 4 & 5: Marketing & Landing Page (Existing Workflow)

*   **Action:** Reuse the existing, robust marketing content generation flow.
*   **Function:** After session creation, the user is redirected to the marketing content page (`/sessions/:id/marketing`).
*   **Outcome:** No backend changes required. The existing `aiService.generateContent` and `sessionsService.saveGeneratedContent` are utilized.

### Step 6: Create Training Kit (Backend/Frontend)

*   **Action:** Generate and associate coaching tips with topics.
*   **Function:**
    1.  **Enhance `AIService`:** Add `generateCoachingTipsForTopic(topic: Topic): Promise<string[]>` using a new `coaching-tip-generator.md` template.
    2.  **Enhance `TopicsService`:** Add `addCoachingTips(topicId: string, tips: string[])` to save the generated tips.
    3.  **Frontend:** Add a "Generate Coaching Tips" button per topic on the session detail page.

### Step 7: Create Marketing Kit (Backend/Frontend)

*   **Action:** Generate marketing materials for the session.
*   **Function:**
    1.  **Enhance `sessions` Table:** Add a new field: `marketingKitContent: TEXT NULL`.
    2.  **Enhance `AIService`:** Add `generateMarketingKit(session: Session): Promise<string>` using a new `marketing-kit-generator.md` template.
    3.  **Enhance `SessionsService`:** Add `saveMarketingKit(sessionId: string, content: string)`.
    4.  **Frontend:** Add a "Generate Marketing Kit" button on the session detail page.