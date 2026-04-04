alter table public.listings
add column if not exists resource_link text,
add column if not exists report_count integer not null default 0,
add column if not exists moderation_status text not null default 'active',
add column if not exists hidden_at timestamp with time zone,
add column if not exists ai_verification_status text;

alter table public.profiles
add column if not exists is_banned boolean not null default false,
add column if not exists ban_reason text,
add column if not exists banned_at timestamp with time zone,
add column if not exists violation_count integer not null default 0;

create table if not exists public.listing_reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  created_at timestamp with time zone not null default now(),
  unique (listing_id, reporter_id)
);

alter table public.listing_reports enable row level security;

drop policy if exists "Users can create listing reports" on public.listing_reports;
create policy "Users can create listing reports"
on public.listing_reports
for insert
with check (auth.uid() = reporter_id);

drop policy if exists "Users can view own listing reports" on public.listing_reports;
create policy "Users can view own listing reports"
on public.listing_reports
for select
using (auth.uid() = reporter_id or public.is_admin());

drop policy if exists "Admins can delete listing reports" on public.listing_reports;
create policy "Admins can delete listing reports"
on public.listing_reports
for delete
using (public.is_admin());

create or replace function public.submit_listing_report(p_listing_id uuid, p_reason text)
returns table (report_count integer, moderation_status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  next_count integer;
  next_status text;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.listing_reports (listing_id, reporter_id, reason)
  values (p_listing_id, current_user_id, p_reason)
  on conflict (listing_id, reporter_id) do nothing;

  select count(*)
  into next_count
  from public.listing_reports
  where listing_id = p_listing_id;

  next_status := case when next_count >= 3 then 'hidden' else 'flagged' end;

  update public.listings
  set
    report_count = next_count,
    moderation_status = next_status,
    hidden_at = case when next_count >= 3 then now() else hidden_at end
  where id = p_listing_id;

  return query
  select
    listings.report_count,
    listings.moderation_status
  from public.listings
  where listings.id = p_listing_id;
end;
$$;

revoke all on function public.submit_listing_report(uuid, text) from public;
grant execute on function public.submit_listing_report(uuid, text) to authenticated;
