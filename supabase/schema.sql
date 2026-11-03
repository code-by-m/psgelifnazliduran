create table if not exists public.portfolio_content (
  id text primary key check (id = 'main'),
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.portfolio_content enable row level security;

grant select on public.portfolio_content to anon, authenticated;
grant insert, update on public.portfolio_content to authenticated;

drop policy if exists "Portfolio content is publicly readable" on public.portfolio_content;
create policy "Portfolio content is publicly readable"
  on public.portfolio_content
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can insert portfolio content" on public.portfolio_content;
create policy "Admins can insert portfolio content"
  on public.portfolio_content
  for insert
  to authenticated
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can update portfolio content" on public.portfolio_content;
create policy "Admins can update portfolio content"
  on public.portfolio_content
  for update
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-assets',
  'portfolio-assets',
  true,
  1572864,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/x-icon', 'image/vnd.microsoft.icon']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Portfolio images are publicly readable" on storage.objects;
create policy "Portfolio images are publicly readable"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'portfolio-assets');

drop policy if exists "Admins can upload portfolio images" on storage.objects;
create policy "Admins can upload portfolio images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'portfolio-assets'
    and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- After creating the owner account in Supabase Auth, grant its admin role:
-- update auth.users
-- set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
-- where email = 'owner@example.com';
