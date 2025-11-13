-- Create storage bucket for listing images
insert into storage.buckets (id, name, public)
values ('listings', 'listings', true);

-- Storage policies
create policy "Anyone can view listing images"
  on storage.objects for select
  using (bucket_id = 'listings');

create policy "Authenticated users can upload listing images"
  on storage.objects for insert
  with check (
    bucket_id = 'listings' 
    and auth.role() = 'authenticated'
  );

create policy "Users can update own listing images"
  on storage.objects for update
  using (
    bucket_id = 'listings'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own listing images"
  on storage.objects for delete
  using (
    bucket_id = 'listings'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
