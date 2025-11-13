-- Create users table (extends auth.users)
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  display_name text,
  university_domain text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create listings table
create table public.listings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  title text not null,
  description text not null,
  category text not null,
  price integer not null, -- stored in cents
  image_urls text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create messages table
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid references public.listings on delete cascade not null,
  sender_id uuid references public.users on delete cascade not null,
  receiver_id uuid references public.users on delete cascade not null,
  body text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create reports table
create table public.reports (
  id uuid default gen_random_uuid() primary key,
  reporter_id uuid references public.users on delete cascade not null,
  listing_id uuid references public.listings on delete cascade not null,
  reason text not null,
  status text default 'pending' not null check (status in ('pending', 'resolved', 'dismissed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better query performance
create index listings_user_id_idx on public.listings(user_id);
create index listings_created_at_idx on public.listings(created_at desc);
create index messages_listing_id_idx on public.messages(listing_id);
create index messages_sender_id_idx on public.messages(sender_id);
create index messages_receiver_id_idx on public.messages(receiver_id);
create index reports_listing_id_idx on public.reports(listing_id);
create index reports_status_idx on public.reports(status);
