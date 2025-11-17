-- Fix user profile creation with automatic trigger
-- This ensures profiles are created automatically when users sign up

-- First, drop the existing insert policy and create a better one that handles upsert
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Recreate the insert policy
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Add updated_at column if it doesn't exist (for tracking profile updates)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public'
                 AND table_name = 'users'
                 AND column_name = 'updated_at') THEN
    ALTER TABLE public.users ADD COLUMN updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;
  END IF;
END $$;

-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_display_name TEXT;
  user_domain TEXT;
BEGIN
  -- Get user email from auth.users
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;

  -- Extract display name from metadata or email
  user_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(user_email, '@', 1),
    'User'
  );

  -- Extract university domain
  user_domain := COALESCE(split_part(user_email, '@', 2), '');

  -- Insert into public.users
  INSERT INTO public.users (id, email, display_name, university_domain, created_at, updated_at)
  VALUES (
    NEW.id,
    user_email,
    user_display_name,
    user_domain,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    university_domain = EXCLUDED.university_domain,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;
