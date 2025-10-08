🔍 Analysis: Why Variants Are Generic

  Issues Discovered:

  1. ❌ Location data is NOT being used at all
    - Location isn't captured in step 1 or sent to the backend
    - Virtual vs. Physical vs. Hybrid context is missing
    - Meeting platform, capacity, and delivery format are ignored
  2. ❌ Variant instructions are duration-agnostic
    - All variants say "Create a 90-min session" but your actual duration is 180 minutes
    - This causes the AI to generate content for the wrong timeframe
  3. ❌ Conflicting Audience & Tone instructions
    - From your test: Audience says "Use an encouraging, welcoming tone" but Tone says "Maintain professional distance"
    - The AI doesn't know which to prioritize
  4. ❌ Missing rich context from database schemas
    - Audience.promptInstructions - exists but not prominently featured
    - Tone.examplePhrases - exists but only first phrase used
    - Tone.languageCharacteristics & emotionalResonance - listed but not emphasized
    - Location.locationType, capacity, meetingPlatform - completely unused
  5. ❌ Variant instruction appears in prompt requirements section
    - The STAR personality instruction gets buried at the end of a long requirements list
    - It's not prominent enough to drive distinct personality types

  ---
  📋 Proposed Solution: Enrich Prompts with Full Context

  Changes to Make:

 1. Add Location Support

  - Update SuggestOutlineDto and shared types to include the full set of location fields (id, name, type, meetingPlatform, capacity, notes/timezone when available).
  - Ensure the frontend `sanitizeSessionBuilderInput()` no longer strips location (and timezone) fields so the values flow through existing API calls.
  - Inject a typed `Location` repository/service into `SessionsService` and fetch the location once before variant generation; pass the hydrated entity into each variant call instead of re-querying by string table names.
  - Add location fields to OpenAISessionOutlineRequest interface.
  - Include location context in buildPrompt():
  Location Details:
  - Type: Virtual/Physical/Hybrid
  - Platform: Zoom/Teams/etc (if virtual)
  - Capacity: X people
  - Special considerations: [from location.notes]

  2. Fix Variant Instructions to Be Duration-Aware

  Update all 4 variant configs to use dynamic duration:
  - Remove hardcoded "90-min session"
  - Use: "Create a {duration}-minute session following this structure..."
  - Calculate section timing percentages (Opening 10%, Theory 30%, Application 30%, Video 15%, Closing 15%)

  3. Restructure the Prompt for Clarity

  Move variant instruction to TOP of requirements (not bottom):
  ## VARIANT PERSONALITY: {variantLabel}
  {variantInstruction}

  ## Session Requirements:
  - Duration: {duration} minutes
  - Create 3-6 sections...

  4. Resolve Audience vs. Tone Conflicts

  Add conflict resolution logic:
  - If audience.promptInstructions conflicts with tone.promptInstructions, prioritize audience
  - Add note in prompt: "Note: When audience and tone instructions conflict, prioritize audience needs."

  5. Enrich Prompt with All Available Data

  Audience section:
  - Add prominence to promptInstructions (move to top)
  - Include ALL exampleTypes (currently using them)
  - Emphasize avoidTopics more strongly

  Tone section:
  - Include ALL examplePhrases (not just first one)
  - Add explicit instruction: "Match these language characteristics: {toneLanguageCharacteristics}"
  - Emphasize emotional resonance: "Convey these emotions: {toneEmotionalResonance}"

  Location section (NEW):
  - Add virtual/physical/hybrid context
  - Include platform-specific guidance
  - Consider capacity for group activities

  ---
  Implementation Plan:

 1. Backend DTO Updates
    - suggest-outline.dto.ts (and shared SessionBuilderInput/SessionMetadata types): Add locationId, locationName, locationType, meetingPlatform, capacity, locationTimezone, and locationNotes so all layers compile against the same contract.
 2. Frontend Form Updates
    - SessionMetadataForm.tsx and SessionBuilder context/types: Ensure locationId and timezone flow through the form/autosave payloads; update the existing form test to assert the posted payload includes both.
 3. Backend Service Updates
    - sessions.service.ts: Fetch audience, tone, and location once before the variant loop and pass hydrated profiles into `generateSingleVariant`.
    - sessions.service.ts: Pass location to OpenAI request and use the injected repository instead of `manager.findOne`.
    - sessions.service.ts: Capture the resolved `locationType` (and relevant fields) in the analytics metadata when variants finish generating so observability confirms prompt enrichment.
  4. OpenAI Service Updates
    - openai.service.ts: Add location fields to OpenAISessionOutlineRequest interface
    - openai.service.ts: Update buildPrompt() to include location context
    - openai.service.ts: Restructure prompt to put variant instruction first
  5. Variant Config/Data Updates
    - Update variant configs/seed data to use duration-aware instructions (`{{duration}}` tokens) and reinforce personality copy.
    - Confirm whether the instructions live in migrations, seed scripts, or config files before choosing a migration vs. data patch.

  ---
  Expected Outcome:

  After these changes, variants will be dramatically different because:

  ✅ Precision will generate structured checklists tailored to your specific audience✅ Insight will use data relevant to your session type and audience background✅ Ignite will create
  fast-paced activities appropriate for your duration and location type✅ Connect will design collaborative exercises that work for your meeting platform (virtual vs. physical)

  The AI will have 5x more context to work with:
  - Full audience profile (experience, learning style, examples, avoid topics)
  - Full tone profile (energy, emotional resonance, example phrases)
  - Location context (virtual/physical, platform, capacity)
  - Proper variant personality instruction (prominent and clear)
  - Correct session duration and timing

  ---
  Ready to implement? This will require:
  - 1 migration (variant configs)
  - 4 file edits (DTO, service, openai service, sessions service)
  - Testing with your specific audience/tone/location combinations

> do you suggest making any structural changes to the existing prompts to get more of a personalized output? There seems to be a conflict in the system setup from the previous legacy 
setup that might be restricting this new setup. 

⏺ Excellent question! Yes, there are significant structural conflicts from the legacy setup that are sabotaging the STAR personality variants. Let me show you:

  ---
  🚨 Critical Structural Issues

⏺ Search(pattern: "if \(request\.variantLabel\)|if \(request\.variantInstruction\)|requirements\.push\(request\.variant", path: "src/services/openai.service.ts", output_mode: "content")
  ⎿  Found 25 lines (ctrl+o to expand)

⏺ Problem 1: Variant Instruction is Buried at the Bottom ❌

  Looking at lines 452-460, the variant instruction is appended to the END of a long requirements list:

  requirements.push(request.variantInstruction);  // Line 453 - BURIED!
  parts.push(`\n\nRequirements:\n- ${requirements.join('\n- ')}`);  // Line 460

  This means the AI sees:
  Requirements:
  - Create 3-6 sections that flow logically
  - Include an opening/welcome section
  - Include interactive elements...
  - [10 more generic requirements]
  - Create a highly organized 90-min session... [STAR personality - FINALLY!]

  The personality instruction is requirement #14 out of 15. The AI prioritizes what it sees first.

  ---
  Problem 2: RAG Weight Differentiation Conflicts with STAR ❌

  Look at sessions.service.ts line 1592:

  const ragWeights = [0.8, 0.5, 0.2, 0.0]; // Heavy, Balanced, Light, None

  Each variant gets a different RAG weight, which tells the AI to differentiate based on how much to use knowledge base materials, NOT personality type.

  Then line 448-450 adds this to requirements:
  requirements.push(`Match the reliance on existing knowledge materials to approximately ${Math.round(request.ragWeight * 100)}% emphasis`);

  So you're asking the AI to:
  1. Use 80% knowledge base emphasis (Variant 0)
  2. Be "Precision" personality (Structure-focused)

  These conflict! The AI can't be both "data-driven from KB" AND "structured/orderly" if the KB doesn't contain structured content.

  ---
  Problem 3: System Prompt Doesn't Mention Variants ❌

  The system prompt (buildSystemPrompt()) says:
  You are an expert training content designer specializing in creating engaging, outcome-focused training sessions for financial professionals.

  It never mentions that it should adapt to different personality types or follow variant instructions. The system prompt should prime the AI to expect personality-based differentiation.

  ---
  Problem 4: Legacy Requirements Format is Too Prescriptive ❌

  The requirements list is a wall of 15 bullet points that all say "do this, do that." It leaves no room for personality interpretation. Compare:

  Current (Generic):
  - Create 3-6 sections that flow logically
  - Include an opening/welcome section
  - Include interactive elements and practice opportunities
  - Include a closing section with next steps
  ...

  Personality-First (Better):
  # VARIANT PERSONALITY: Precision
  Create a highly organized session with sequential steps, detailed agendas, and clear time blocks...

  # Session Requirements:
  - Duration: 180 minutes
  - Must cover: Change management frameworks, communication...

  ---
  🎯 Proposed Structural Overhaul

  New Prompt Architecture:

  ┌─────────────────────────────────────────────────────┐
  │ 1. SYSTEM PROMPT (Updated)                         │
  │    "You adapt training content to match specific    │
  │     personality types (STAR framework)..."          │
  └─────────────────────────────────────────────────────┘
                            ↓
  ┌─────────────────────────────────────────────────────┐
  │ 2. USER PROMPT - PERSONALITY FIRST                  │
  │    # VARIANT PERSONALITY: {variantLabel}            │
  │    {variantInstruction}                             │
  │                                                      │
  │    # Session Context                                │
  │    - Category: {category}                           │
  │    - Type: {sessionType}                            │
  │    - Duration: {duration} minutes                   │
  │    - Outcome: {desiredOutcome}                      │
  │    - Problem: {currentProblem}                      │
  │                                                      │
  │    # Audience Context                               │
  │    - Profile: {audienceName}                        │
  │    - Experience: {experienceLevel}                  │
  │    - Learning Style: {preferredLearningStyle}       │
  │    [Special Instructions from audience.prompt...]   │
  │                                                      │
  │    # Tone Guidelines                                │
  │    - Style: {toneStyle}                             │
  │    - Energy: {toneEnergyLevel}                      │
  │    - Emotional Resonance: {emotionalResonance}      │
  │    [Special Instructions from tone.prompt...]       │
  │                                                      │
  │    # Location Context (NEW)                         │
  │    - Type: {locationType}                           │
  │    - Platform: {meetingPlatform}                    │
  │    - Capacity: {capacity}                           │
  │                                                      │
  │    # Knowledge Base References                      │
  │    [RAG context - inspirational only]               │
  │                                                      │
  │    # Output Format                                  │
  │    Return valid JSON with sections array            │
  └─────────────────────────────────────────────────────┘

  ---
  📝 Specific Changes to Make

  1. Update System Prompt to Emphasize Variants

⏺ Read(src/services/openai.service.ts)
  ⎿  Read 50 lines (ctrl+o to expand)

⏺ Change: Make system prompt personality-aware and remove RAG weight differentiation:

  private buildSystemPrompt(): string {  // Remove ragWeight parameter
    return `You are an expert training content designer specializing in creating engaging, outcome-focused training sessions for financial professionals.

  You excel at adapting your content design to match different learning and delivery styles based on the VARIANT PERSONALITY provided. Each variant has a unique approach - follow it 
  precisely.

  Respond ONLY with valid JSON matching this exact structure:
  {
    "suggestedTitle": "string",
    "summary": "string (2-3 sentences)",
    "sections": [
      {
        "title": "string",
        "duration": number,
        "description": "string (2-3 sentences)",
        "learningObjectives": ["string", "string"],
        "suggestedActivities": ["string", "string"]
      }
    ],
    "totalDuration": number,
    "difficulty": "Beginner|Intermediate|Advanced",
    "recommendedAudienceSize": "string"
  }

  CRITICAL: Adapt your section titles, descriptions, activities, and structure to match the VARIANT PERSONALITY instructions. Make each variant measurably different.`;
  }

  ---
  2. Restructure buildPrompt() - Personality First

  Current structure (lines 313-463): ❌
  1. Session context (category, title, outcome, problem)
  2. Audience profile (buried in middle)
  3. Tone profile (buried in middle)
  4. Requirements list (generic + personality at end)

  New structure: ✅
  1. VARIANT PERSONALITY (prominent at top)
  2. Session context (concise)
  3. Audience context (enriched with promptInstructions first)
  4. Tone context (enriched with emotional resonance)
  5. Location context (NEW)
  6. Knowledge base references (inspirational, not directive)
  7. Minimal output requirements (JSON format only)

  Pseudocode:
  private buildPrompt(request: OpenAISessionOutlineRequest): string {
    const sections = [];

    // 1. VARIANT PERSONALITY (FIRST!)
    if (request.variantLabel && request.variantInstruction) {
      sections.push(`# VARIANT PERSONALITY: ${request.variantLabel}\n${request.variantInstruction}`);
    }

    // 2. SESSION CONTEXT (Concise)
    sections.push(`# Session Context
  - Category: ${request.category}
  - Type: ${request.sessionType}
  - Duration: ${request.duration} minutes
  - Desired Outcome: ${request.desiredOutcome}
  ${request.currentProblem ? `- Current Problem: ${request.currentProblem}` : ''}
  ${request.specificTopics ? `- Must Cover: ${request.specificTopics}` : ''}`);

    // 3. AUDIENCE CONTEXT (Special instructions FIRST)
    if (request.audienceName) {
      const audienceLines = [`# Audience Context\n- Profile: ${request.audienceName}`];

      // PRIORITY: Special instructions first
      if (request.audienceInstructions) {
        audienceLines.push(`- **Key Guidance**: ${request.audienceInstructions}`);
      }

      if (request.audienceDescription) audienceLines.push(`- ${request.audienceDescription}`);
      if (request.audienceExperienceLevel) audienceLines.push(`- Experience: ${request.audienceExperienceLevel}`);
      if (request.audienceTechnicalDepth) audienceLines.push(`- Technical Depth: ${request.audienceTechnicalDepth}/5`);
      if (request.audienceLearningStyle) audienceLines.push(`- Learning Preferences: ${request.audienceLearningStyle}`);
      if (request.audienceExampleTypes?.length) audienceLines.push(`- Use Examples From: ${request.audienceExampleTypes.join(', ')}`);
      if (request.audienceAvoidTopics?.length) audienceLines.push(`- **Avoid**: ${request.audienceAvoidTopics.join(', ')}`);

      sections.push(audienceLines.join('\n'));
    }

    // 4. TONE CONTEXT (Emotional resonance emphasized)
    if (request.toneName) {
      const toneLines = [`# Tone Guidelines\n- Style: ${request.toneName}`];

      // PRIORITY: Special instructions first
      if (request.toneInstructions) {
        toneLines.push(`- **Key Guidance**: ${request.toneInstructions}`);
      }

      if (request.toneEmotionalResonance?.length) {
        toneLines.push(`- **Emotional Qualities**: ${request.toneEmotionalResonance.join(', ')}`);
      }
      if (request.toneStyle) toneLines.push(`- ${request.toneStyle} style`);
      if (request.toneEnergyLevel) toneLines.push(`- Energy: ${request.toneEnergyLevel}`);
      if (request.toneFormality) toneLines.push(`- Formality: ${request.toneFormality}/5`);
      if (request.toneSentenceStructure) toneLines.push(`- Sentence Structure: ${request.toneSentenceStructure}`);
      if (request.toneExamplePhrases?.length) {
        toneLines.push(`- Example Phrases:\n  ${request.toneExamplePhrases.map(p => `"${p}"`).join('\n  ')}`);
      }

      sections.push(toneLines.join('\n'));
    }

    // 5. LOCATION CONTEXT (NEW)
    if (request.locationName) {
      const locationLines = [`# Location Context\n- Venue: ${request.locationName}`];
      if (request.locationType) locationLines.push(`- Type: ${request.locationType}`);
      if (request.meetingPlatform) locationLines.push(`- Platform: ${request.meetingPlatform}`);
      if (request.capacity) locationLines.push(`- Capacity: ${request.capacity} people`);
      sections.push(locationLines.join('\n'));
    }

    // 6. OUTPUT REQUIREMENTS (Minimal - just JSON format)
    sections.push(`# Output Requirements
  - Return valid JSON with the specified structure
  - Ensure totalDuration equals ${request.duration} minutes exactly
  - Create 3-6 sections that flow logically
  - Include opening/welcome and closing/commitments sections`);

    return sections.join('\n\n');
  }

  ---
  3. Remove RAG Weight Differentiation

  In sessions.service.ts line 1592, change:

  // BEFORE (conflicts with STAR)
  const ragWeights = [0.8, 0.5, 0.2, 0.0]; // Heavy, Balanced, Light, None

  // AFTER (all variants use same RAG approach)
  const ragWeights = [0.5, 0.5, 0.5, 0.5]; // All use RAG as inspiration, not differentiation

  Or even better - use RAG for ALL variants the same way:
  // Use RAG consistently across all variants
  const ragWeight = ragResults.length > 0 ? 0.5 : 0.0;
  const variantPromises = [0, 1, 2, 3].map(index =>
    this.generateSingleVariant(payload, ragResults, ragWeight, index)

  ---
  4. Add Location Support

  See earlier plan for adding locationId, fetching location data, and passing to OpenAI.

  ---
  🎯 Expected Impact

  Before (Current):

  Prompt to AI:
  1. Generic requirements (15 bullets)
  2. Audience buried in middle
  3. Tone buried in middle
  4. Variant personality (#14 of 15)

  Result: All 4 variants look similar because personality is ignored

  After (Proposed):

  Prompt to AI:
  1. VARIANT PERSONALITY: Precision (Structure) - FIRST!
  2. Session context (concise)
  3. Audience (special instructions prominent)
  4. Tone (emotional resonance prominent)
  5. Location (virtual/physical context)
  6. Minimal requirements (JSON format)

  Result: Each variant has distinct personality because it's the FIRST thing AI sees

  ---
                                                                                                                                                                                          
⏺ User approved Claude's plan:
  ⎿  Structural Overhaul: Fix Prompt Architecture for STAR Differentiation

     Root Cause Issues:

     1. Variant instruction buried at bottom of 15-item requirements list
     2. RAG weight differentiation conflicts with STAR personality instructions
     3. System prompt ignores variant personality adaptation
     4. Legacy requirements format too prescriptive, fights personality
     5. Location data completely unused (virtual/physical/hybrid context missing)

     Proposed Changes:

     1. Restructure buildPrompt() Method

     - Move variant personality to TOP (first thing AI sees)
     - Simplify requirements to minimal JSON format guidance
     - Promote audience.promptInstructions and tone.promptInstructions to top
     - Add location context section (NEW)
     - Remove generic requirement bullets that fight personality

     2. Update System Prompt

     - Remove RAG weight parameter
     - Add STAR personality adaptation instructions
     - Emphasize "make each variant measurably different"

     3. Remove RAG Weight Differentiation

     - Change ragWeights = [0.8, 0.5, 0.2, 0.0] to [0.5, 0.5, 0.5, 0.5]
     - Let STAR personality drive differentiation, not RAG reliance
     - Use RAG as inspiration for ALL variants equally

     4. Add Location Support

     - Update DTOs to include locationId, locationType, meetingPlatform, capacity
     - Fetch location data in generateSingleVariant()
     - Add location context to prompts

     5. Update Variant Configs (Migration)

     - Remove hardcoded "90-min" → use dynamic {duration} minutes
     - Emphasize personality more strongly in instructions

     Files Modified:

     - openai.service.ts - Restructure buildPrompt() and buildSystemPrompt()
     - sessions.service.ts - Remove RAG weight array, add location fetching
     - suggest-outline.dto.ts - Add location fields
     - New migration - Update variant instructions to be duration-aware

     Expected Outcome:

     Variants will be dramatically different because AI sees personality FIRST, not buried at the end. Each variant will adapt to your specific audience, tone, location, and timing 
     context.
  ⎿

  ---
  🛠️ Detailed Implementation Outline

  1. System Prompt Update (`src/services/openai.service.ts`)
     - Replace `buildSystemPrompt(ragWeight: number)` with a parameterless `buildSystemPrompt()`.
     - New content should explicitly mention STAR personalities and reinforce JSON-only responses.

  ```ts
  private buildSystemPrompt(): string {
    return `You are an expert training content designer specializing in creating engaging, outcome-focused training sessions for financial professionals.

  You excel at adapting your content to match the VARIANT PERSONALITY provided in the user prompt. Follow the personality instructions precisely so each session outline feels distinct.

  Respond ONLY with valid JSON using this schema:
  {
    "suggestedTitle": "string",
    "summary": "string (2-3 sentences)",
    "sections": [
      {
        "title": "string",
        "duration": number,
        "description": "string (2-3 sentences)",
        "learningObjectives": ["string"],
        "suggestedActivities": ["string"]
      }
    ],
    "totalDuration": number,
    "difficulty": "Beginner|Intermediate|Advanced",
    "recommendedAudienceSize": "string"
  }

  Make each variant measurably different based on its personality.`;
  }
  ```

  2. Prompt Restructure (`buildPrompt` in `openai.service.ts`)
     - Implement the personality-first structure from the pseudocode above.
     - Promote `audience.promptInstructions` and `tone.promptInstructions` to the top of their sections.
     - Add a new location block that prints type, platform, capacity, and notes when available.
     - Reduce the requirements footer to minimal JSON guidance (duration check + section count + opening/closing reminder).
     - Remove the legacy “Match the reliance on existing knowledge materials…” requirement so variants no longer receive conflicting RAG-vs-personality instructions.
     - Append RAG excerpts after the personality/context sections instead of prepending them, so the model still sees the variant persona first. Update `injectRAGContext` to tack the knowledge base material onto the end with a short connector such as “## Knowledge Base Inspiration”.

  3. Request Contract Adjustments
     - Extend `OpenAISessionOutlineRequest` (and any DTOs or mappers feeding it) with:
       - `locationId`, `locationName`, `locationType`, `meetingPlatform`, `capacity`, `locationTimezone?`, `locationNotes?`.
     - Update `SuggestOutlineDto`, shared type definitions, and the controller to accept the new properties.
     - Ensure the front-end form (and autosave/tests) keeps posting the location + timezone selection by updating `sanitizeSessionBuilderInput` and its associated unit test.

  4. Service Layer Changes (`sessions.service.ts`)
     - Inject the `Location` repository so you can load the entity directly.
     - Fetch audience, tone, and location profiles once before queuing the variant promises; pass the hydrated profiles into each `generateSingleVariant` call to avoid redundant DB queries.
     - Pass the resolved location info into the request object that goes to `generateSingleVariant`.
     - Collapse the `ragWeights` array to a single consistent value. Either use a flat `0.5` for all variants or derive the weight once based on whether RAG results exist.

  ```ts
  const ragWeight = ragResults.length > 0 ? 0.5 : 0.0;
  const variantPromises = [0, 1, 2, 3].map(index =>
    this.generateSingleVariant(payload, ragResults, ragWeight, index)
  );
  ```

  5. Variant Seed Migration
     - Create a migration (or data patch) to swap hard-coded `"90-min"` strings for template strings that reference duration.
     - Example replacement: `Create a 90-min session` → `Create a {{duration}}-minute session`.
     - Reinforce personality language (Precision, Insight, Ignite, Connect) so the prompt’s first lines are vivid.

  6. Variant Assembly Improvements
     - After `balanceDurations`, adjust only the final section’s duration so the summed minutes exactly match the requested duration (eliminate rounding drift without reshaping every block) and cover it with a focused spec in `sessions.service.variants.spec.ts`.
     - Funnel the variant description (or other differentiators returned by `getVariantDescription`) into the OpenAI request so the LLM sees the same nuance users read later.

  7. Response Validation Hardening
     - Layer a lightweight schema validator (e.g., class-transformer/class-validator or Zod) on top of `JSON.parse` to guarantee required fields, numeric durations, and section counts. Fail fast with structured logging when the outline is malformed.

  ---
  🧪 Validation Plan

  - Regression: Run the existing outline generation flow for at least two sessions (one virtual, one physical) to confirm JSON output remains parseable.
  - Variant Differentiation: Capture outputs for all four variants and ensure tone/structure changes are obvious.
  - Duration Accuracy: Verify each response sums to the requested duration exactly (rounding fix should remove ±1 minute drift).
  - Location Context: Confirm virtual sessions mention platform guidance; physical sessions reference capacity or special notes.
  - Conflict Resolution: Provide an audience instruction that contradicts tone and ensure the generated prompt prioritizes audience guidance.
  - Schema Guardrail: Intentionally return malformed JSON from a test double to confirm the validator emits a clear failure instead of silently logging success.

  ---
  📦 Rollout Notes

  - Deploy migration first so variant instructions no longer fight with the new dynamic duration.
  - Release backend/frontend updates together to avoid missing location fields.
  - If you have prompt caching, invalidate cached variants so the new prompt format takes effect immediately.
  - Document the new prompt structure for future contributors—especially how personality takes precedence over RAG weighting.
  - Coordinate validator rollout with debugging dashboards so engineers can spot schema failures quickly during the first few runs.
