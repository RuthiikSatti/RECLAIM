# Username Consolidation Testing Checklist

## 3-Step Test Plan

### Step 1: Run Database Migration in Supabase
**Action**: Copy and execute the migration SQL in Supabase SQL Editor

**Migration File**: `supabase/migrations/20251212100000_consolidate_username_displayname.sql`

**What it does**:
1. Creates `slugify()` function for converting display names to URL-friendly usernames
2. Populates `username` column from existing `display_name` values
3. Resolves duplicate usernames by appending `-1`, `-2`, etc.
4. Adds UNIQUE constraint on `username`
5. Makes `username` NOT NULL
6. Updates database trigger to use username instead of display_name

**Verification**:
```sql
-- Check all users have usernames
SELECT COUNT(*) FROM public.users WHERE username IS NULL;
-- Expected: 0

-- Check for duplicate usernames
SELECT username, COUNT(*) FROM public.users GROUP BY username HAVING COUNT(*) > 1;
-- Expected: 0 rows (no duplicates)

-- View sample usernames
SELECT email, display_name, username FROM public.users LIMIT 10;
-- Expected: All rows should have slugified usernames
```

**Expected Result**: All existing users should have unique, slugified usernames based on their display names.

---

### Step 2: Test New User Signup
**Action**: Sign up a new user through the UI

**Test Cases**:

#### Test Case 2.1: Valid Username
1. Navigate to `/signup`
2. Enter username: `john-doe`
3. Enter email: `john@university.edu`
4. Enter password: `SecurePass123!`
5. Click "Sign up"

**Expected Result**:
- Username is accepted (shows green checkmark)
- Signup succeeds
- User profile is created in database with `username = 'john-doe'`
- `display_name` is also set to `'john-doe'` for backwards compatibility

**Verification**:
```sql
SELECT email, username, display_name
FROM public.users
WHERE email = 'john@university.edu';
```

#### Test Case 2.2: Invalid Username Format
1. Navigate to `/signup`
2. Try username: `JohnDoe` (uppercase not allowed)

**Expected Result**:
- Shows error: "Username must be 3-64 characters, lowercase letters, numbers, and hyphens only"
- Cannot submit form

#### Test Case 2.3: Duplicate Username
1. Navigate to `/signup`
2. Enter username: `john-doe` (already exists from Test 2.1)
3. Enter different email: `jane@university.edu`

**Expected Result**:
- Shows error: "Username already exists — try another"
- Cannot submit form

---

### Step 3: Test Login with Username
**Action**: Log in using username instead of email

**Test Case 3.1**: Login with Username
1. Navigate to `/login`
2. Enter username: `john-doe` (no @ symbol)
3. Enter password: `SecurePass123!`
4. Click "Sign in"

**Expected Result**:
- Login succeeds
- User is redirected to `/marketplace`

**Test Case 3.2**: Login with Email (Still Works)
1. Navigate to `/login`
2. Enter email: `john@university.edu`
3. Enter password: `SecurePass123!`
4. Click "Sign in"

**Expected Result**:
- Login succeeds (backwards compatible)
- User is redirected to `/marketplace`

---

## Additional Validation

### Edge Cases to Test

1. **Username with Hyphens**
   - Try: `my-cool-username`
   - Expected: Accepted ✓

2. **Username with Numbers**
   - Try: `user123`
   - Expected: Accepted ✓

3. **Username Too Short**
   - Try: `ab`
   - Expected: Rejected (minimum 3 characters)

4. **Username Too Long**
   - Try: 65-character username
   - Expected: Rejected (maximum 64 characters)

5. **Username with Spaces**
   - Try: `john doe`
   - Expected: Rejected (spaces not allowed)

6. **Username with Special Characters**
   - Try: `john_doe` or `john.doe`
   - Expected: Rejected (only hyphens allowed)

---

## Rollback Plan (If Needed)

If issues are discovered, you can safely rollback by:

1. **Revert Application Code** (before merging PR):
   ```bash
   git revert <commit-hash>
   ```

2. **Database Rollback** (in Supabase SQL Editor):
   ```sql
   -- Remove NOT NULL constraint
   ALTER TABLE public.users ALTER COLUMN username DROP NOT NULL;

   -- Remove UNIQUE constraint
   ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_username_key;

   -- Revert trigger to old version (see previous migration)
   -- This requires restoring the old trigger function
   ```

---

## Success Criteria

✅ All existing users have unique usernames
✅ New signups only require username (not display_name)
✅ Username format is enforced (slugified)
✅ Duplicate usernames are prevented
✅ Login works with both username and email
✅ No TypeScript or build errors

---

## Notes for Future Cleanup

Once all application code has been updated to use `username` instead of `display_name`, you can safely drop the `display_name` column:

```sql
-- ONLY run this after confirming all code references are updated
ALTER TABLE public.users DROP COLUMN display_name;
```

**Before dropping**, search codebase for all references to `display_name`:
```bash
grep -r "display_name" app/ components/ lib/
```

Ensure all references have been migrated to use `username` instead.
