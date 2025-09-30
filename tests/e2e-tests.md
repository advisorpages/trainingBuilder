## Session Builder Test

Run this test to confirm the session builder works from end to end and creates new topics once built.

npm run test --workspace=packages/frontend -- --run src/features/session-builder/state/__tests__/SessionBuilderProvider.test.tsx src/services/__tests__/session-builder.service.test.ts