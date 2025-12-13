-- Consolidate display_name and username into single username field
-- This migration populates username from display_name (slugified) for existing users
-- The 'users' table is the profile table in this project

-- Step 1: Create slugify function if not exists
CREATE OR REPLACE FUNCTION public.slugify(text) RETURNS text AS $$
  SELECT lower(trim(both '-' from regexp_replace($1, '[^a-zA-Z0-9]+', '-', 'g')));
$$ LANGUAGE SQL IMMUTABLE;

-- Step 2: Add username column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'username'
  ) THEN
    ALTER TABLE public.users ADD COLUMN username text;
  END IF;
END $$;

-- Step 3: Populate username from display_name for users who don't have a username yet
-- Use slugified display_name, or email prefix, or 'user' as fallback
WITH base AS (
  SELECT id,
         COALESCE(NULLIF(display_name, ''), split_part(email, '@', 1), 'user') AS raw_name,
         public.slugify(COALESCE(NULLIF(display_name, ''), split_part(email, '@', 1), 'user')) AS base_slug
  FROM public.users
  WHERE username IS NULL OR username = ''
),
ranked AS (
  SELECT id, base_slug, row_number() OVER (PARTITION BY base_slug ORDER BY id) - 1 AS rn FROM base
)
UPDATE public.users p
SET username = CASE
  WHEN r.rn = 0 THEN r.base_slug
  ELSE r.base_slug || '-' || r.rn::text
END
FROM ranked r
WHERE p.id = r.id;

-- Step 4: Trim usernames to max 64 characters and remove leading/trailing hyphens
UPDATE public.users
SET username = left(trim(both '-' FROM username), 64)
WHERE username IS NOT NULL;

-- Step 5: Drop the old case-insensitive unique index if it exists
DROP INDEX IF EXISTS public.users_username_lower_idx;

-- Step 6: Drop the old format check constraint (we only enforce uniqueness now)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS username_format_check;

-- Step 7: Add case-insensitive unique index on username
-- This ensures "Ruthiik" and "ruthiik" are treated as the same username
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_unique_idx
  ON public.users (lower(username));

-- Also add a regular index for faster lookups
CREATE INDEX IF NOT EXISTS users_username_idx
  ON public.users (username);

-- Step 8: Make username NOT NULL after population
-- First ensure all usernames are populated
UPDATE public.users
SET username = public.slugify(COALESCE(NULLIF(display_name, ''), split_part(email, '@', 1), 'user'))
WHERE username IS NULL OR username = '';

-- Then add NOT NULL constraint
ALTER TABLE public.users
ALTER COLUMN username SET NOT NULL;

-- Step 9: Update the trigger to use username instead of display_name
-- The trigger now only sets username (from metadata or email prefix)
-- No format restrictions - username is stored as provided
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_username text;
  attempt_count int := 0;
BEGIN
  -- Get username from metadata, or use email prefix as fallback
  new_username := COALESCE(
    NULLIF(new.raw_user_meta_data->>'username', ''),
    split_part(new.email, '@', 1)
  );

  -- Ensure username is unique (case-insensitive) by appending suffix if needed
  -- This is a safety mechanism in case of race conditions
  WHILE EXISTS (SELECT 1 FROM public.users WHERE lower(username) = lower(new_username)) AND attempt_count < 100 LOOP
    attempt_count := attempt_count + 1;
    new_username := COALESCE(
      NULLIF(new.raw_user_meta_data->>'username', ''),
      split_part(new.email, '@', 1)
    ) || '-' || attempt_count::text;
  END LOOP;

  INSERT INTO public.users (id, email, display_name, username, university_domain, created_at)
  VALUES (
    new.id,
    new.email,
    new_username, -- Use username as display_name for now (backwards compatibility)
    new_username,
    split_part(new.email, '@', 2),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Note: display_name is kept for backwards compatibility
-- It can be safely dropped after confirming all references to display_name
-- in the application have been updated to use username instead.
-- To drop: ALTER TABLE public.users DROP COLUMN display_name;
