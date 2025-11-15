-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.listings enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;

-- Users policies
create policy "Users can view all users"
  on public.users for select
  using (true);

create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Listings policies
create policy "Anyone can view listings"
  on public.listings for select
  using (true);

create policy "Authenticated users can create listings"
  on public.listings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own listings"
  on public.listings for update
  using (auth.uid() = user_id);

create policy "Users can delete own listings"
  on public.listings for delete
  using (auth.uid() = user_id);

-- Messages policies
create policy "Users can view messages where they are sender or receiver"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Authenticated users can create messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

create policy "Users can update messages where they are receiver or sender"
  on public.messages for update
  using (auth.uid() = receiver_id or auth.uid() = sender_id);

create policy "Users can delete their own messages"
  on public.messages for delete
  using (auth.uid() = sender_id);

-- Reports policies
create policy "Users can view their own reports"
  on public.reports for select
  using (auth.uid() = reporter_id);

create policy "Authenticated users can create reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

-- Admin policies (you'll need to create an admin role)
-- For now, we'll handle admin access through service role key in the backend
