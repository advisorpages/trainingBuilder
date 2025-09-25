Plan: Restructure AI Content Generation to Use Topic-Based Sessions                                                                     │
     │                                                                                                                                         │
     │ Problem                                                                                                                                 │
     │                                                                                                                                         │
     │ Currently, the AI Content Generation preview shows sessions as flat "blocks" (heading + body). The user wants sessions to be structured │
     │ using a collection of topics from the /topics API instead of flat sections.                                                             │
     │                                                                                                                                         │
     │ Solution Overview                                                                                                                       │
     │                                                                                                                                         │
     │ Transform the Preview Content section in the AI Composer to display topic-based session outlines that integrate with the existing topics│
     │  system.                                                                                                                                │
     │                                                                                                                                         │
     │ Implementation Steps                                                                                                                    │
     │                                                                                                                                         │
     │ 1. Update Frontend Types & Interfaces                                                                                                   │
     │                                                                                                                                         │
     │ - Extend AIContentVersion to include topic references                                                                                   │
     │ - Create new TopicBasedSection interface with topic metadata                                                                            │
     │ - Update session builder types to support topic collections                                                                             │
     │                                                                                                                                         │
     │ 2. Modify AI Content Generation Backend                                                                                                 │
     │                                                                                                                                         │
     │ - Update suggestOutline endpoint to return topic-aware sections                                                                         │
     │ - Integrate with Topics service to match generated content to existing topics                                                           │
     │ - Return topic suggestions alongside session outline                                                                                    │
     │ - Map AI-generated sections to relevant topics in the database                                                                          │
     │                                                                                                                                         │
     │ 3. Redesign Preview Content UI                                                                                                          │
     │                                                                                                                                         │
     │ - Replace flat numbered blocks with topic-based cards                                                                                   │
     │ - Show topic name, description, and tags for each section                                                                               │
     │ - Display learning objectives and suggested activities per topic                                                                        │
     │ - Add topic selection/modification capabilities                                                                                         │
     │ - Include topic metadata (usage count, related sessions)                                                                                │
     │                                                                                                                                         │
     │ 4. Enhance Topic Integration                                                                                                            │
     │                                                                                                                                         │
     │ - Add topic search/filter functionality in preview                                                                                      │
     │ - Allow users to swap suggested topics for alternatives                                                                                 │
     │ - Show topic popularity and usage statistics                                                                                            │
     │ - Enable topic creation from AI suggestions                                                                                             │
     │                                                                                                                                         │
     │ 5. Update Data Flow                                                                                                                     │
     │                                                                                                                                         │
     │ - Modify outlineToVersion() to handle topic-based structures                                                                            │
     │ - Update autosave to preserve topic associations                                                                                        │
     │ - Ensure backward compatibility with existing flat structure                                                                            │
     │                                                                                                                                         │
     │ Key Components to Modify                                                                                                                │
     │                                                                                                                                         │
     │ - AIComposer.tsx (Preview Content section)                                                                                              │
     │ - types.ts (AIContentVersion, new topic interfaces)                                                                                     │
     │ - SessionBuilderContext.tsx (topic data handling)                                                                                       │
     │ - sessions.service.ts (topic integration)                                                                                               │
     │ - Backend suggest-outline endpoint                                                                                                      │
     │                                                                                                                                         │
     │ Expected Outcome                                                                                                                        │
     │                                                                                                                                         │
     │ Users will see AI-generated sessions as collections of structured topics rather than flat blocks, with full integration into the        │
     │ existing topics system and enhanced topic management capabilities.   