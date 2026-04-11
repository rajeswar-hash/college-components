insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-media',
  'listing-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view listing media" on storage.objects;
create policy "Public can view listing media"
on storage.objects
for select
using (bucket_id = 'listing-media');

drop policy if exists "Authenticated users can upload own listing media" on storage.objects;
create policy "Authenticated users can upload own listing media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'listing-media'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "Users or admins can update listing media" on storage.objects;
create policy "Users or admins can update listing media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'listing-media'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or public.is_admin()
  )
)
with check (
  bucket_id = 'listing-media'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or public.is_admin()
  )
);

drop policy if exists "Users or admins can delete listing media" on storage.objects;
create policy "Users or admins can delete listing media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'listing-media'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or public.is_admin()
  )
);

create table if not exists public.frontend_error_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  route text,
  source text not null,
  severity text not null default 'error',
  message text not null,
  stack text,
  context jsonb,
  user_id uuid references auth.users(id) on delete set null,
  user_email text
);

create index if not exists frontend_error_logs_created_at_idx
on public.frontend_error_logs (created_at desc);

create index if not exists frontend_error_logs_source_idx
on public.frontend_error_logs (source, created_at desc);

alter table public.frontend_error_logs enable row level security;

drop policy if exists "Anyone can insert frontend error logs" on public.frontend_error_logs;
create policy "Anyone can insert frontend error logs"
on public.frontend_error_logs
for insert
with check (true);

drop policy if exists "Admins can view frontend error logs" on public.frontend_error_logs;
create policy "Admins can view frontend error logs"
on public.frontend_error_logs
for select
using (public.is_admin());

drop policy if exists "Admins can delete frontend error logs" on public.frontend_error_logs;
create policy "Admins can delete frontend error logs"
on public.frontend_error_logs
for delete
using (public.is_admin());

create or replace function public.get_admin_system_health()
returns table (
  listing_count bigint,
  pending_review_count bigint,
  database_usage_bytes bigint,
  listing_storage_bytes bigint,
  listing_storage_growth_7d_bytes bigint,
  storage_object_count bigint,
  frontend_errors_24h bigint
)
language plpgsql
security definer
set search_path = public, storage
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  return query
  select
    (select count(*)::bigint from public.listings),
    (select count(*)::bigint from public.listings where moderation_status = 'pending_review'),
    (
      select coalesce(sum(pg_total_relation_size(format('%I.%I', schemaname, tablename)::regclass)), 0)::bigint
      from pg_tables
      where schemaname = 'public'
        and tablename = any (array[
          'profiles',
          'listings',
          'listing_reports',
          'listing_likes',
          'college_requests',
          'college_overrides',
          'frontend_error_logs'
        ])
    ),
    (
      select coalesce(sum(coalesce((metadata ->> 'size')::bigint, 0)), 0)::bigint
      from storage.objects
      where bucket_id = 'listing-media'
    ),
    (
      select coalesce(sum(coalesce((metadata ->> 'size')::bigint, 0)), 0)::bigint
      from storage.objects
      where bucket_id = 'listing-media'
        and created_at >= now() - interval '7 days'
    ),
    (
      select count(*)::bigint
      from storage.objects
      where bucket_id = 'listing-media'
    ),
    (
      select count(*)::bigint
      from public.frontend_error_logs
      where created_at >= now() - interval '24 hours'
    );
end;
$$;

revoke all on function public.get_admin_system_health() from public;
grant execute on function public.get_admin_system_health() to authenticated;
