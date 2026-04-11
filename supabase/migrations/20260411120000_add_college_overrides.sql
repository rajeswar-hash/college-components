create table if not exists public.college_overrides (
  college_name text primary key,
  action text not null check (action in ('add', 'remove')),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.college_overrides enable row level security;

drop policy if exists "Anyone can view college overrides" on public.college_overrides;
create policy "Anyone can view college overrides"
on public.college_overrides
for select
using (true);

drop policy if exists "Admins can manage college overrides" on public.college_overrides;
create policy "Admins can manage college overrides"
on public.college_overrides
for all
using (public.is_admin())
with check (public.is_admin());

create or replace function public.get_college_overrides()
returns table (
  college_name text,
  action text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    college_overrides.college_name,
    college_overrides.action
  from public.college_overrides
  order by college_overrides.college_name asc;
end;
$$;

revoke all on function public.get_college_overrides() from public;
grant execute on function public.get_college_overrides() to anon;
grant execute on function public.get_college_overrides() to authenticated;
