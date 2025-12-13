# PR: Consolidate display_name and username into single username field

## Summary
This PR consolidates the `display_name` and `username` fields into a single `username` field in the existing Supabase project. The migration automatically populates usernames from display names using a slugified format (lowercase, alphanumeric, hyphens).

## Changes Made

### 1. Database Migration
**File**: `supabase/migrations/20251212100000_consolidate_username_displayname.sql`

- Created `slugify()` function to convert display names to URL-friendly usernames
- Populated `username` from `display_name` for all existing users
- Resolved duplicate usernames by appending `-1`, `-2`, etc.
- Added UNIQUE constraint on `username`
- Made `username` NOT NULL
- Updated database trigger to use username instead of display_name

### 2. Application Updates

#### Signup Form (`app/signup/page.tsx`)
- **Removed**: Display Name input field
- **Changed**: Now only collects username and email
- **Format**: Usernames must be slugified (lowercase, hyphens allowed)

#### Signup API (`app/api/auth/signup/route.ts`)
- **Removed**: `displayName` parameter
- **Updated**: Only accepts `username` in request body
- **Validation**: New regex for slugified format: `/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/`

#### Username Input Component (`components/auth/UsernameInput.tsx`)
- **Updated**: Validation regex to accept slugified format
- **Changed**: Error message to reflect new format requirements

#### Username Check API (`app/api/username/check/route.ts`)
- **Updated**: Validation regex for slugified usernames
- **Consistent**: Same validation as signup form

#### Auth Actions (`lib/auth/actions.ts`)
- **Updated**: `checkUsernameAvailability()` function validation
- **Format**: Slugified username validation

## Username Format

### Old Format
- Pattern: `^[a-zA-Z][a-zA-Z0-9_]{2,19}$`
- Examples: `JohnDoe`, `john_123`
- Mixed case, underscores allowed

### New Format
- Pattern: `^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$`
- Examples: `john-doe`, `user-123`
- Lowercase only, hyphens allowed
- 3-64 characters

## Migration SQL

**To run in Supabase SQL Editor**:

```sql
-- See full migration file:
-- supabase/migrations/20251212100000_consolidate_username_displayname.sql
```

The migration handles:
1. Creating slugify function
2. Populating usernames from display names
3. Resolving duplicates
4. Adding constraints
5. Updating trigger

## Testing

**Comprehensive test checklist**: `TESTING_CHECKLIST_USERNAME_CONSOLIDATION.md`

### 3-Step Test Plan:
1. ✅ Run database migration in Supabase
2. ✅ Test new user signup with username validation
3. ✅ Test login with username (backwards compatible with email)

## Backwards Compatibility

### ✅ What's Preserved
- Login still works with username OR email
- `display_name` column kept (for now)
- Database trigger sets `display_name = username` for new users
- All existing users automatically get slugified usernames

### ⚠️ Breaking Changes
- Signup form no longer shows separate display_name field
- Usernames must be slugified (lowercase, hyphens)
- Old username format (uppercase, underscores) no longer accepted

## When to Drop display_name Column

**DO NOT drop yet!** The `display_name` column is kept for backwards compatibility.

**Before dropping**:
1. Search entire codebase for `display_name` references:
   ```bash
   grep -r "display_name" app/ components/ lib/
   ```
2. Update all references to use `username` instead
3. Test thoroughly
4. Then run:
   ```sql
   ALTER TABLE public.users DROP COLUMN display_name;
   ```

## Build Status
✅ Build passes: All 28 pages generated successfully
✅ No TypeScript errors
✅ No linting errors

## Files Changed
```
M  app/api/auth/signup/route.ts
M  app/api/username/check/route.ts
M  app/signup/page.tsx
M  components/auth/UsernameInput.tsx
M  lib/auth/actions.ts
A  supabase/migrations/20251212100000_consolidate_username_displayname.sql
A  TESTING_CHECKLIST_USERNAME_CONSOLIDATION.md
```

## Deployment Checklist

- [ ] Review and merge PR
- [ ] Run migration in Supabase production SQL editor
- [ ] Verify all existing users have usernames
- [ ] Test signup flow with new username format
- [ ] Test login with username and email
- [ ] Monitor for any errors in production
- [ ] (Future) Plan display_name column removal

## Rollback Plan

If issues are discovered:

1. **Code rollback**: `git revert <commit-hash>`
2. **Database rollback**:
   ```sql
   ALTER TABLE public.users ALTER COLUMN username DROP NOT NULL;
   ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_username_key;
   ```

Full rollback instructions in testing checklist.
