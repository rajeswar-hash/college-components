create table if not exists public.email_dispatch_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  email_type text not null,
  trigger_source text not null,
  recipient_email text
);

create index if not exists email_dispatch_logs_created_at_idx
on public.email_dispatch_logs (created_at desc);

create index if not exists email_dispatch_logs_type_created_at_idx
on public.email_dispatch_logs (email_type, created_at desc);

alter table public.email_dispatch_logs enable row level security;

drop policy if exists "Admins can view email dispatch logs" on public.email_dispatch_logs;
create policy "Admins can view email dispatch logs"
on public.email_dispatch_logs
for select
using (public.is_admin());

create or replace function public.log_email_dispatch(
  p_email_type text,
  p_trigger_source text,
  p_recipient_email text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.email_dispatch_logs (email_type, trigger_source, recipient_email)
  values (
    left(coalesce(p_email_type, 'unknown'), 80),
    left(coalesce(p_trigger_source, 'unknown'), 120),
    nullif(left(coalesce(p_recipient_email, ''), 255), '')
  );
end;
$$;

revoke all on function public.log_email_dispatch(text, text, text) from public;
grant execute on function public.log_email_dispatch(text, text, text) to anon, authenticated;

create or replace function public.get_today_email_dispatch_count()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  kolkata_midnight timestamptz;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  kolkata_midnight := (date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata');

  return (
    select count(*)::bigint
    from public.email_dispatch_logs
    where created_at >= kolkata_midnight
  );
end;
$$;

revoke all on function public.get_today_email_dispatch_count() from public;
grant execute on function public.get_today_email_dispatch_count() to authenticated;

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
          'frontend_error_logs',
          'email_dispatch_logs'
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
