✓ src/components/topics/__tests__/aiTopicEnhancement.test.
ts (12)
 ✓ src/services/__tests__/auth.service.test.ts (13)
 ❯ src/features/session-builder/state/__tests__/SessionBuil
 ✓ src/components/topics/__tests__/aiTopicEnhancement.test.
ts (12)
 ✓ src/services/__tests__/auth.service.test.ts (13)
 ❯ src/features/session-builder/state/__tests__/SessionBuil
 ✓ src/components/topics/__tests__/aiTopicEnhancement.test.
ts (12)
 ✓ src/services/__tests__/auth.service.test.ts (13)
 ❯ src/features/session-builder/state/__tests__/SessionBuil
 ✓ src/components/topics/__tests__/aiTopicEnhancement.test.
ts (12)
 ✓ src/services/__tests__/auth.service.test.ts (13)
 ❯ src/features/session-builder/state/__tests__/SessionBuil
 ✓ src/components/topics/__tests__/aiTopicEnhancement.test.
ts (12)
 ✓ src/services/__tests__/auth.service.test.ts (13)
 ❯ src/features/session-builder/state/__tests__/SessionBuil
 ✓ src/components/topics/__tests__/aiTopicEnhancement.test.
ts (12)
 ✓ src/services/__tests__/auth.service.test.ts (13)
 ❯ src/features/session-builder/state/__tests__/SessionBuil
stdout | src/__tests__/integration/AuthFlow.test.tsx > Authentication Flow Integration > surface API errors when the login attempt fails
=== LOGIN PAGE LOADING ===
=== LOGIN PAGE STATE === {
  isLoading: true,
  isAuthenticated: false,
  email: 'broker1@company.com',
  hasLoginFunction: true
}
=== LOGIN PAGE LOADING ===
=== LOGIN PAGE STATE === {
  isLoading: false,
  isAuthenticated: false,
  email: 'broker1@company.com',
  hasLoginFunction: true
}
=== BUTTON CLICKED === click
=== FORM ONSUBMIT CALLED ===
=== LOGIN FORM SUBMIT === { email: 'broker1@company.com', password: '***' }
=== CALLING LOGIN ===
=== AUTH CONTEXT LOGIN START ===
=== LOGIN PAGE LOADING ===
=== LOGIN PAGE STATE === {
  isLoading: false,
  isAuthenticated: false,
  email: 'broker1@company.com',
  hasLoginFunction: true
}
=== LOGIN ERROR === Error: Invalid email or password
    at /Users/anthony-macbook/Documents/_DEV/TrainingBuilderv4/packages/frontend/src/__tests__/integration/AuthFlow.test.tsx:111:45
    at file:///Users/anthony-macbook/Documents/_DEV/TrainingBuilderv4/node_modules/@vitest/runner/dist/index.js:135:14
    at file:///Users/anthony-macbook/Documents/_DEV/TrainingBuilderv4/node_modules/@vitest/runner/dist/index.js:60:26
    at runTest (file:///Users/anthony-macbook/Documents/_DEV/TrainingBuilderv4/node_modules/@vitest/runner/dist/index.js:781:17)
    at runSuite (file:///Users/anthony-macbook/Documents/_DEV/TrainingBuilderv4/node_modules/@vitest/runner/dist/index.js:909:15)
    at runSuite (file:///Users/anthony-macbook/Documents/_DEV/TrainingBuilderv4/node_modules/@vitest/runner/dist/index.js:909:15)
    at runFiles (file:///Users/anthony-macbook/Documents/_DEV/TrainingBuilderv4/node_modules/@vitest/runner/dist/index.js:958:5)
    at startTests (file:///Users/anthony-macbook/Documents/_DEV/TrainingBuilderv4/node_modules/@vitest/runner/dist/index.js:967:3)
    at file:///Users/anthony-macbook/Documents/_DEV/TrainingBuilderv4/node_modules/vitest/dist/chunks/runtime-runBaseTests.oAvMKtQC.js:116:7
    at withEnv (file:///Users/anthony-macbook/Documents/_DEV/TrainingBuilderv4/node_modules/vitest/dist/chunks/runtime-runBaseTests.oAvMKtQC.js:83:5)
=== LOGIN PAGE LOADING ===
=== LOGIN PAGE STATE === {
  isLoading: false,
  isAuthenticated: false,
  email: 'broker1@company.com',
  hasLoginFunction: true
}

stderr | src/__tests__/integration/AuthFlow.test.tsx > Authentication Flow Integration > surface API errors when the login attempt fails
Login error: Error: Invalid email or password
    at /Users/anthony-macbook/Documents/_DEV/TrainingBuilderv4/packages/frontend/src/__tests__/integration/AuthFlow.test.tsx:111:45
    at file:///Users/anthony-macbook/Documents/_DEV/TrainingBuilderv4/node_modules/@vitest/runner/dist/index.js:135:14
    at file:///Users/anthony-macbook/Documents/_DEV/TrainingBuilderv4/node_modules/@vitest/runner/dist/index.js:60:26
    at runTest (file:///Users/anthony-macbook/Documents/_DEV/TrainingBuilderv4/node_modules/@vitest/runner/dist/index.js:781:17)
    at runSuite (file:///Users/anthony-macbook/Documents/_DEV/TrainingBuilderv4/node_modules/@vitest/runner/dist/index.js:909:15)
    at runSuite (file:///Users/anthony-macbook/Documents/_DEV/TrainingBuilderv4/node_modules/@vitest/runner/dist/index.js:909:15)
    at runFiles (file:///Users/anthony-macbook/Documents/_DEV/TrainingBuilderv4/node_modules/@vitest/runner/dist/index.js:958:5)
    at startTests (file:///Users/anthony-macbook/Documents/_DEV/TrainingBuilderv4/node_modules/@vitest/runner/dist/index.js:967:3)
    at file:///Users/anthony-macbook/Documents/_DEV/TrainingBuilderv4/node_modules/vitest/dist/chunks/runtime-runBaseTests.oAvMKtQC.js:116:7
    at withEnv (file:///Users/anthony-macbook/Documents/_DEV/TrainingBuilderv4/node_modules/vitest/dist/chunks/runtime-runBaseTests.oAvMKtQC.js:83:5)

 ✓ src/components/topics/__tests__/aiTopicEnhancement.test.
ts (12)
 ✓ src/services/__tests__/auth.service.test.ts (13)
 ❯ src/features/session-builder/state/__tests__/SessionBuil
stdout | src/__tests__/integration/AuthFlow.test.tsx > Authentication Flow Integration > shows a loading indicator while validating an existing session
=== LOGIN PAGE LOADING ===
=== LOGIN PAGE STATE === {
  isLoading: true,
  isAuthenticated: false,
  email: 'broker1@company.com',
  hasLoginFunction: true
}

stdout | src/__tests__/integration/AuthFlow.test.tsx > Authentication Flow Integration > shows a loading indicator while validating an existing session
=== LOGIN PAGE LOADING ===
=== LOGIN PAGE STATE === {
  isLoading: false,
  isAuthenticated: true,
  email: 'broker1@company.com',
  hasLoginFunction: true
}

stderr | src/components/session-builder/__tests__/VariantSelector.test.tsx > VariantSelector > updates loading stage when progress increases
Warning: `ReactDOMTestUtils.act` is deprecated in favor of `React.act`. Import `act` from `react` instead of `react-dom/test-utils`. See https://react.dev/warnings/react-dom-test-utils for more info.

 ✓ src/components/topics/__tests__/aiTopicEnhancement.test.
ts (12)
 ✓ src/components/topics/__tests__/aiTopicEnhancement.test.
ts (12)
 ✓ src/services/__tests__/auth.service.test.ts (13)
 ❯ src/features/session-builder/state/__tests__/SessionBuil
 ✓ src/components/topics/__tests__/aiTopicEnhancement.test.
ts (12)
 ✓ src/services/__tests__/auth.service.test.ts (13)
 ❯ src/features/session-builder/state/__tests__/SessionBuil
derProvider.test.tsx (11) 2514ms
   ✓ SessionBuilderProvider manual autosave (1)
stdout | src/services/__tests__/session-builder.service.test.ts > sessionBuilderService > creates missing topics when publishing a session from outline suggestions
Session data being sent to backend: {
  title: 'Empathetic Leadership Workshop',
  status: 'published',
  readinessScore: 95,
  startTime: '2025-05-01T18:00:00.000Z',
  endTime: '2025-05-01T19:00:00.000Z',
  subtitle: 'Empathy in Action',
  audience: 'Leadership',
  objective: 'Help leaders navigate change with empathy.'
}

 ✓ src/components/topics/__tests__/aiTopicEnhancement.test.
ts (12)
 ✓ src/services/__tests__/auth.service.test.ts (13)
 ❯ src/features/session-builder/state/__tests__/SessionBuil
derProvider.test.tsx (11) 2514ms
   ✓ SessionBuilderProvider manual autosave (1)
 ✓ src/services/__tests__/auth.service.test.ts (13)
 ❯ src/features/session-builder/state/__tests__/SessionBuil
derProvider.test.tsx (11) 2514ms
   ✓ SessionBuilderProvider manual autosave (1)
   ✓ SessionBuilderProvider workflow (1)
   ❯ SessionBuilderProvider variant generation (3) 2043ms
     ✓ requires metadata before generating variants
     × generates variants successfully and tracks analytics
     × selects a variant and logs selection 2017ms
   ✓ SessionBuilderProvider outline section operations (6) 
325ms
 ❯ src/features/session-builder/components/__tests__/Sessio
 ✓ src/services/__tests__/auth.service.test.ts (13)
 ❯ src/features/session-builder/state/__tests__/SessionBuil
derProvider.test.tsx (11) 2514ms
   ✓ SessionBuilderProvider manual autosave (1)
   ✓ SessionBuilderProvider workflow (1)
   ❯ SessionBuilderProvider variant generation (3) 2043ms
     ✓ requires metadata before generating variants
     × generates variants successfully and tracks analytics
     × selects a variant and logs selection 2017ms
   ✓ SessionBuilderProvider outline section operations (6) 
325ms
 ❯ src/features/session-builder/components/__tests__/Sessio
stderr | src/features/session-builder/components/__tests__/AutosaveIndicator.test.tsx > AutosaveIndicator > displays idle status with helper copy
Warning: `ReactDOMTestUtils.act` is deprecated in favor of `React.act`. Import `act` from `react` instead of `react-dom/test-utils`. See https://react.dev/warnings/react-dom-test-utils for more info.

 ✓ src/services/__tests__/auth.service.test.ts (13)
 ❯ src/features/session-builder/state/__tests__/SessionBuil
derProvider.test.tsx (11) 2514ms
   ✓ SessionBuilderProvider manual autosave (1)
   ✓ SessionBuilderProvider workflow (1)
   ❯ SessionBuilderProvider variant generation (3) 2043ms
     ✓ requires metadata before generating variants
     × generates variants successfully and tracks analytics
     × selects a variant and logs selection 2017ms
   ✓ SessionBuilderProvider outline section operations (6) 
325ms
 ❯ src/features/session-builder/components/__tests__/Sessio
 ❯ src/features/session-builder/state/__tests__/SessionBuil
derProvider.test.tsx (11) 2514ms
   ✓ SessionBuilderProvider manual autosave (1)
   ✓ SessionBuilderProvider workflow (1)
   ❯ SessionBuilderProvider variant generation (3) 2043ms
     ✓ requires metadata before generating variants
     × generates variants successfully and tracks analytics
     × selects a variant and logs selection 2017ms
   ✓ SessionBuilderProvider outline section operations (6) 
325ms
 ❯ src/features/session-builder/components/__tests__/Sessio
nMetadataForm.test.tsx (8) 720ms
   ❯ SessionMetadataForm (8) 718ms
stderr | src/components/features/analytics/__tests__/KPIKard.test.tsx > KPIKard > renders KPI card with all props
Warning: `ReactDOMTestUtils.act` is deprecated in favor of `React.act`. Import `act` from `react` instead of `react-dom/test-utils`. See https://react.dev/warnings/react-dom-test-utils for more info.

 ✓ src/components/topics/__tests__/aiTopicEnhancement.test.ts (12)
 ✓ src/services/__tests__/auth.service.test.ts (13)
 ❯ src/features/session-builder/state/__tests__/SessionBuilderProvider.test.tsx (11) 2514ms
   ✓ SessionBuilderProvider manual autosave (1)
   ✓ SessionBuilderProvider workflow (1)
   ❯ SessionBuilderProvider variant generation (3) 2043ms
     ✓ requires metadata before generating variants
     × generates variants successfully and tracks analytics
     × selects a variant and logs selection 2017ms
   ✓ SessionBuilderProvider outline section operations (6) 325ms
 ❯ src/features/session-builder/components/__tests__/SessionMetadataForm.test.tsx (8) 720ms
   ❯ SessionMetadataForm (8) 718ms
     ✓ renders all form fields with correct values 419ms
     ✓ calls onChange when title is updated
     ✓ calls onChange when desired outcome is updated
     × calls onChange when session type is changed
     × passes enriched location details when location changes
     ✓ handles textarea inputs correctly
     ✓ displays all session type options
     ✓ handles date and time inputs
 ✓ src/__tests__/integration/SessionWorkflow.test.tsx (3) 1399ms
 ✓ src/components/sessions/__tests__/SessionForm.test.tsx (5) 1856ms
 ✓ src/features/session-builder/components/__tests__/QuickAddModal.test.tsx (10) 998ms
 ✓ src/contexts/__tests__/AuthContext.test.tsx (6)
 ✓ src/__tests__/integration/AuthFlow.test.tsx (3) 399ms
 ❯ src/components/session-builder/__tests__/VariantSelector.test.tsx (5) 772ms
   ❯ VariantSelector (5) 770ms
     ✓ updates loading stage when progress increases
     ✓ syncs loading stage with external progress
     ✓ renders live progress log when loadingStage provided
     × renders variants and triggers callbacks 666ms
     ✓ omits save-for-later action when handler not provided
 ✓ src/features/session-builder/state/__tests__/builderReducer.test.ts (4)
 ✓ src/features/session-builder/components/__tests__/AutosaveIndicator.test.tsx (9) 464ms
 ✓ src/services/__tests__/session-builder.service.test.ts (1)
 ✓ src/services/session-builder.service.test.ts (1)
 ✓ src/components/features/analytics/__tests__/KPIKard.test.tsx (7)

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ Failed Tests 5 ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/components/session-builder/__tests__/VariantSelector.test.tsx > VariantSelector > renders variants and triggers callbacks
TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "Select & Edit"

Here are the accessible roles:

  heading:

  Name "Choose Your Session Outline":
  <h2
    class="text-lg sm:text-xl font-semibold text-gray-900 mb-2"
  />

  Name "Knowledge Base-Driven":
  <h3
    class="font-semibold text-base sm:text-lg text-gray-900"
  />

  Name "Creative Approach":
  <h3
    class="font-semibold text-base sm:text-lg text-gray-900"
  />

  --------------------------------------------------
  button:

  Name "Select & Edit Select":
  <button
    class="inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 flex-1 text-sm sm:text-base"
  />

  Name "💾":
  <button
    class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3"
    title="Save for later"
  />

  Name "Select & Edit Select":
  <button
    class="inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 flex-1 text-sm sm:text-base"
  />

  Name "💾":
  <button
    class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3"
    title="Save for later"
  />

  --------------------------------------------------

Ignored nodes: comments, script, style
<body>
  <div>
    <div
      class="space-y-4 sm:space-y-6"
    >
      <div
        class="text-center mb-4 sm:mb-6"
      >
        <h2
          class="text-lg sm:text-xl font-semibold text-gray-900 mb-2"
        >
          Choose Your Session Outline
        </h2>
        <p
          class="text-xs sm:text-sm text-gray-600 px-2"
        >
          Select the variant that best fits your needs. You can edit it in the next step.
        </p>
      </div>
      <div
        class="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4"
      >
        <div
          class="border border-gray-200 rounded-lg p-4 sm:p-5 md:p-6 hover:shadow-lg hover:border-blue-300 transition-all"
        >
          <div
            class="flex items-start justify-between mb-3 sm:mb-4 gap-2"
          >
            <div
              class="flex-1 min-w-0"
            >
              <h3
                class="font-semibold text-base sm:text-lg text-gray-900"
              >
                Knowledge Base-Driven
              </h3>
              <p
                class="text-xs sm:text-sm text-gray-600 mt-1"
              >
                Based on your training materials
              </p>
            </div>
            <span
              class="flex-shrink-0 ml-2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap bg-blue-100 text-blue-700"
            >
              RAG
            </span>
          </div>
          <div
            class="space-y-2 sm:space-y-3 mb-3 sm:mb-4 p-3 sm:p-4 bg-gray-50 rounded max-h-64 sm:max-h-80 md:max-h-96 overflow-y-auto"
          >
            <p
              class="text-sm font-medium text-gray-900 leading-tight"
            >
              Leadership Session
            </p>
            <p
              class="text-xs text-gray-500"
            >
              2
               sections • 
              90
               min
            </p>
            <div
              class="space-y-2 sm:space-y-3 mt-2 sm:mt-3"
            >
              <div
                class="border-l-2 border-blue-200 pl-2 sm:pl-3"
              >
                <div
                  class="flex flex-wrap items-baseline gap-1 sm:gap-2"
                >
                  <span
                    class="text-xs font-semibold text-gray-900"
                  >
                    • 
                    Opening
                  </span>
                  <span
                    class="text-xs text-gray-500 whitespace-nowrap"
                  >
                    (
                    15
                     min)
                  </span>
                </div>
                <p
                  class="text-xs text-gray-600 mt-1 leading-relaxed"
                >
                  Kick things off.
                </p>
              </div>
              <div
                class="border-l-2 border-blue-200 pl-2 sm:pl-3"
              >
                <div
                  class="flex flex-wrap items-baseline gap-1 sm:gap-2"
                >
                  <span
                    class="text-xs font-semibold text-gray-900"
                  >
                    • 
                    Workshop
                  </span>
                  <span
                    class="text-xs text-gray-500 whitespace-nowrap"
                  >
                    (
                    60
                     min)
                  </span>
                </div>
                <p
                  class="text-xs text-gray-600 mt-1 leading-relaxed"
                >
                  Hands-on practice.
                </p>
              </div>
            </div>
          </div>
          <div
            class="flex gap-2"
          >
            <button
              class="inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 flex-1 text-sm sm:text-base"
            >
              <span
                class="hidden sm:inline"
              >
                Select & Edit
              </span>
              <span
                class="sm:hidden"
              >
                Select
              </span>
            </button>
            <button
              class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3"
              title="Save for later"
            >
              💾
            </button>
          </div>
        </div>
        <div
          class="border border-gray-200 rounded-lg p-4 sm:p-5 md:p-6 hover:shadow-lg hover:border-blue-300 transition-all"
        >
          <div
            class="flex items-start justify-between mb-3 sm:mb-4 gap-2"
          >
            <div
              class="flex-1 min-w-0"
            >
              <h3
                class="font-semibold text-base sm:text-lg text-gray-900"
              >
                Creative Approach
              </h3>
              <p
                class="text-xs sm:text-sm text-gray-600 mt-1"
              >
                Fresh perspective
              </p>
            </div>
            <span
              class="flex-shrink-0 ml-2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap bg-gray-100 text-gray-700"
            >
              AI
            </span>
          </div>
          <div
            class="space-y-2 sm:space-y-3 mb-3 sm:mb-4 p-3 sm:p-4 bg-gray-50 rounded max-h-64 sm:max-h-80 md:max-h-96 overflow-y-auto"
          >
            <p
              class="text-sm font-medium text-gray-900 leading-tight"
            >
              Leadership Session
            </p>
            <p
              class="text-xs text-gray-500"
            >
              2
               sections • 
              90
               min
            </p>
            <div
              class="space-y-2 sm:space-y-3 mt-2 sm:mt-3"
            >
              <div
                class="border-l-2 border-blue-200 pl-2 sm:pl-3"
              >
                <div
                  class="flex flex-wrap items-baseline gap-1 sm:gap-2"
                >
                  <span
                    class="text-xs font-semibold text-gray-900"
                  >
                    • 
                    Opening
                  </span>
                  <span
                    class="text-xs text-gray-500 whitespace-nowrap"
                  >
                    (
                    15
                     min)
                  </span>
                </div>
                <p
                  class="text-xs text-gray-600 mt-1 leading-relaxed"
                >
                  Kick things off.
                </p>
              </div>
              <div
                class="border-l-2 border-blue-200 pl-2 sm:pl-3"
              >
                <div
                  class="flex flex-wrap items-baseline gap-1 sm:gap-2"
                >
                  <span
                    class="text-xs font-semibold text-gray-900"
                  >
                    • 
                    Workshop
                  </span>
                  <span
                    class="text-xs text-gray-500 whitespace-nowrap"
                  >
                    (
                    60
                     min)
                  </span>
                </div>
                <p
                  class="text-xs text-gray-600 mt-1 leading-relaxed"
                >
                  Hands-on practice.
                </p>
              </div>
            </div>
          </div>
          <div
            class="flex gap-2"
          >
            <button
              class="inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 flex-1 text-sm sm:text-base"
            >
              <span
                class="hidden sm:inline"
              >
                Select & Edit
              </span>
              <span
                class="sm:hidden"
              >
                Select
              </span>
            </button>
            <button
              class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3"
              title="Save for later"
            >
              💾
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
 ❯ Object.getElementError ../../node_modules/@testing-library/react/node_modules/@testing-library/dom/dist/config.js:37:19
 ❯ ../../node_modules/@testing-library/react/node_modules/@testing-library/dom/dist/query-helpers.js:76:38
 ❯ ../../node_modules/@testing-library/react/node_modules/@testing-library/dom/dist/query-helpers.js:109:15
 ❯ src/components/session-builder/__tests__/VariantSelector.test.tsx:124:19
    122|     expect(screen.getByText('Knowledge Base-Drive…
    123|     expect(screen.getByText('Creative Approach'))…
    124|     expect(screen.getAllByRole('button', { name: …
       |                   ^
    125|     expect(screen.getAllByText('RAG')).toHaveLeng…
    126|     expect(screen.getAllByText('AI')).toHaveLengt…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/5]⎯

 FAIL  src/features/session-builder/components/__tests__/SessionMetadataForm.test.tsx > SessionMetadataForm > calls onChange when session type is changed
ReferenceError: mockOnTriggerAI is not defined
 ❯ src/features/session-builder/components/__tests__/SessionMetadataForm.test.tsx:168:22
    166|         metadata={defaultMetadata}
    167|         onChange={mockOnChange}
    168|         onTriggerAI={mockOnTriggerAI}
       |                      ^
    169|       />
    170|     );

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/5]⎯

 FAIL  src/features/session-builder/components/__tests__/SessionMetadataForm.test.tsx > SessionMetadataForm > passes enriched location details when location changes
TestingLibraryElementError: Unable to find an element by: [data-testid="location-select"]

Ignored nodes: comments, script, style
<body>
  <div>
    <div
      class="space-y-6"
    >
      <div
        class="mb-6"
      >
        <h2
          class="text-xl font-bold text-slate-900"
        >
          Session Setup
        </h2>
        <p
          class="text-sm text-slate-600"
        >
          Configure your session details for a tailored outline
        </p>
      </div>
      <div
        class="rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <div
          class="flex flex-col space-y-1.5 border-b border-slate-100 p-6"
        >
          <div
            class="tracking-tight text-base font-semibold"
          >
            Session Configuration
            <span
              class="text-red-500 ml-1"
            >
              *
            </span>
          </div>
        </div>
        <div
          class="p-6 pt-0 space-y-4"
        >
          <div
            class="grid gap-4 sm:grid-cols-2"
          >
            <div
              class="space-y-2"
            >
              <label
                class="text-sm font-medium text-slate-700"
              >
                Target Audience
              </label>
              <div
                class="relative w-full"
              >
                <div
                  class="relative"
                >
                  <input
                    autocomplete="off"
                    class="w-full h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                    placeholder="Loading audiences…"
                    type="text"
                    value="Team Leads"
                  />
                  <button
                    aria-label="Clear selected audience"
                    class="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    type="button"
                  >
                    ×
                  </button>
                  <button
                    aria-label="Toggle audiences"
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:cursor-not-allowed"
                    type="button"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M19 9l-7 7-7-7"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <p
                class="text-xs text-slate-500"
              >
                Optional — tailor prompts for a specific learner group
              </p>
            </div>
            <div
              class="space-y-2"
            >
              <label
                class="text-sm font-medium text-slate-700"
                for="session-category"
              >
                Category 
                <span
                  class="text-red-500"
                >
                  *
                </span>
              </label>
              <div
                class="relative w-full"
              >
                <div
                  class="relative"
                >
                  <input
                    autocomplete="off"
                    class="w-full h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled=""
                    placeholder="Loading categories..."
                    type="text"
                    value="Leadership"
                  />
                  <button
                    class="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    type="button"
                  >
                    ×
                  </button>
                  <button
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:cursor-not-allowed"
                    disabled=""
                    type="button"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M19 9l-7 7-7-7"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width=...
 ❯ Object.getElementError ../../node_modules/@testing-library/react/node_modules/@testing-library/dom/dist/config.js:37:19
 ❯ ../../node_modules/@testing-library/react/node_modules/@testing-library/dom/dist/query-helpers.js:76:38
 ❯ ../../node_modules/@testing-library/react/node_modules/@testing-library/dom/dist/query-helpers.js:52:17
 ❯ ../../node_modules/@testing-library/react/node_modules/@testing-library/dom/dist/query-helpers.js:95:19
 ❯ src/features/session-builder/components/__tests__/SessionMetadataForm.test.tsx:187:34
    185| 
    186|     mockOnChange.mockClear();
    187|     const locationInput = screen.getByTestId('loc…
       |                                  ^
    188|     fireEvent.change(locationInput, { target: { v…
    189| 

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/5]⎯

 FAIL  src/features/session-builder/state/__tests__/SessionBuilderProvider.test.tsx > SessionBuilderProvider variant generation > generates variants successfully and tracks analytics
AssertionError: expected false to be true // Object.is equality

- Expected
+ Received

- true
+ false

 ❯ it.timeout src/features/session-builder/state/__tests__/SessionBuilderProvider.test.tsx:450:20
    448|       result = await harnessRef.current?.generate…
    449|     });
    450|     expect(result).toBe(true);
       |                    ^
    451|     expect(mocks.generateVariantsMock).toHaveBeen…
    452| 

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[4/5]⎯

 FAIL  src/features/session-builder/state/__tests__/SessionBuilderProvider.test.tsx > SessionBuilderProvider variant generation > selects a variant and logs selection
AssertionError: expected 'error' to be 'success' // Object.is equality

Ignored nodes: comments, script, style
<html>
  <head />
  <body>
    <div />
  </body>
</html>

- Expected
+ Received

- success
+ error

 ❯ __vi_import_2__.waitFor.timeout src/features/session-builder/state/__tests__/SessionBuilderProvider.test.tsx:490:73
    488|       await harnessRef.current?.generateVariants(…
    489|     });
    490|     await waitFor(() => expect(harnessRef.current…
       |                                                                         ^
    491| 
    492|     await act(async () => {
 ❯ runWithExpensiveErrorDiagnosticsDisabled ../../node_modules/@testing-library/react/node_modules/@testing-library/dom/dist/config.js:47:12
 ❯ checkCallback ../../node_modules/@testing-library/react/node_modules/@testing-library/dom/dist/wait-for.js:127:77
 ❯ Timeout.checkRealTimersCallback ../../node_modules/@testing-library/react/node_modules/@testing-library/dom/dist/wait-for.js:121:16

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[5/5]⎯

 Test Files  3 failed | 12 passed (15)
      Tests  5 failed | 93 passed (98)
   Start at  13:59:21
   Duration  7.02s (transform 1.26s, setup 5.99s, collect 3.44s, tests 9.45s, environment 13.71s, prepare 4.26s)


 FAIL  Tests failed. Watching for file changes...
       press h to show help, press q to quit
npm error Lifecycle script `test` failed with error:
npm error code 1
npm error path /Users/anthony-macbook/Documents/_DEV/TrainingBuilderv4/packages/frontend
npm error workspace @leadership-training/frontend@1.0.0
npm error location /Users/anthony-macbook/Documents/_DEV/TrainingBuilderv4/packages/frontend
npm error command failed
npm error command sh -c vitest