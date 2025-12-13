-- Add username column to users table (extending auth.users)
-- The 'users' table is the profile table in this project

-- Add username column if it doesn't exist
alter table public.users add column if not exists username text;

-- Create case-insensitive unique index on username
-- This enforces uniqueness while ignoring case (e.g., "Alex" == "alex")
create unique index if not exists users_username_lower_idx on public.users (lower(username));

-- Add a check constraint to ensure username follows a valid pattern
-- Usernames must be 3-20 characters, alphanumeric + underscores, start with letter
alter table public.users
  add constraint if not exists username_format_check
  check (username is null or (username ~ '^[a-zA-Z][a-zA-Z0-9_]{2,19}$'));

-- Create an index on username for faster lookups (in addition to the unique lower index)
create index if not exists users_username_idx on public.users (username);

-- Update the database trigger to handle username on user creation
-- This trigger auto-creates a profile when a user signs up via auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, display_name, username, university_domain, created_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', new.email),
    new.raw_user_meta_data->>'username', -- Extract username from metadata
    split_part(new.email, '@', 2),
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

-- Ensure the trigger is set up (recreate if exists)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
