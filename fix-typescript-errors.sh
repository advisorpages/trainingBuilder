#!/bin/bash

# Fix compilation errors in backend
cd packages/backend

# Fix sessions.crud.integration.spec.ts issues
sed -i '' 's/statusHistory\[0\]\.status/statusHistory[0].newStatus/g' src/modules/sessions/__tests__/sessions.crud.integration.spec.ts
sed -i '' 's/statusHistory\[1\]\.status/statusHistory[1].newStatus/g' src/modules/sessions/__tests__/sessions.crud.integration.spec.ts
sed -i '' 's/statusHistory\[2\]\.status/statusHistory[2].newStatus/g' src/modules/sessions/__tests__/sessions.crud.integration.spec.ts
sed -i '' 's/\.maxAttendees/.maxRegistrations/g' src/modules/sessions/__tests__/sessions.crud.integration.spec.ts
sed -i '' 's/participantEmail:/email:/g' src/modules/sessions/__tests__/sessions.crud.integration.spec.ts

# Fix users.crud.integration.spec.ts issues
sed -i '' 's|../../../auth/auth.module|../../../modules/auth/auth.module|g' src/modules/users/__tests__/users.crud.integration.spec.ts
sed -i '' 's/status: "DRAFT"/status: SessionStatus.DRAFT/g' src/modules/users/__tests__/users.crud.integration.spec.ts

echo "TypeScript fixes applied"