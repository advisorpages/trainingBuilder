# Database Migration: Update Session Status from 'retired' to 'archived'

## Purpose
Update existing database records to use the new 'archived' status value instead of 'retired'.

## Migration SQL

```sql
-- Migration: Update session status from 'retired' to 'archived'
-- Run this after deploying the code changes

-- Check current retired sessions
SELECT COUNT(*) as retired_count FROM sessions WHERE status = 'retired';

-- Update retired sessions to archived
UPDATE sessions SET status = 'archived' WHERE status = 'retired';

-- Verify the update
SELECT COUNT(*) as archived_count FROM sessions WHERE status = 'archived';
SELECT COUNT(*) as retired_count FROM sessions WHERE status = 'retired';

-- Check for any remaining retired sessions (should be 0)
SELECT id, title, status FROM sessions WHERE status = 'retired';
```

## Steps to Execute

1. **Backup your database** before running this migration
2. **Deploy the code changes** first (updated enums and service methods)
3. **Run the migration SQL** above
4. **Verify the results** - all sessions should now show 'archived' instead of 'retired'

## Rollback (if needed)

```sql
-- Rollback: Change 'archived' back to 'retired' (if something goes wrong)
UPDATE sessions SET status = 'retired' WHERE status = 'archived';
```

## Expected Impact

- **Before**: Sessions with status = 'retired'
- **After**: Sessions with status = 'archived'
- **UI Impact**: None - users still see "Archived" label
- **Functionality**: No change - all filtering and business logic works the same

## Verification Queries

After running the migration, verify:

```sql
-- Should return 0 rows
SELECT * FROM sessions WHERE status = 'retired';

-- Should return the count of previously retired sessions
SELECT COUNT(*) FROM sessions WHERE status = 'archived';