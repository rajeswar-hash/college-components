create index if not exists listings_college_visible_created_idx
on public.listings (college, created_at desc)
where moderation_status not in ('pending_review', 'rejected');

create index if not exists listings_seller_created_idx
on public.listings (seller_id, created_at desc);

create index if not exists listings_moderation_created_idx
on public.listings (moderation_status, created_at desc);

create index if not exists listing_likes_user_created_idx
on public.listing_likes (user_id, created_at desc);

create index if not exists listing_likes_listing_idx
on public.listing_likes (listing_id);

create index if not exists listing_reports_listing_idx
on public.listing_reports (listing_id);

create index if not exists college_requests_status_created_idx
on public.college_requests (status, created_at desc);

create index if not exists profiles_email_idx
on public.profiles (lower(email));

create index if not exists college_overrides_action_idx
on public.college_overrides (action, college_name);

create or replace function public.admin_cleanup_database()
returns table (
  old_rejected_college_requests_removed integer,
  duplicate_reports_removed integer,
  empty_college_overrides_removed integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  removed_rejected integer := 0;
  removed_reports integer := 0;
  removed_overrides integer := 0;
begin
  if not public.is_admin() then
    raise exception 'not allowed';
  end if;

  delete from public.college_requests
  where status = 'rejected'
    and created_at < now() - interval '30 days';
  get diagnostics removed_rejected = row_count;

  with ranked_reports as (
    select
      id,
      row_number() over (
        partition by listing_id, reporter_id, reason
        order by created_at desc
      ) as duplicate_rank
    from public.listing_reports
  )
  delete from public.listing_reports
  using ranked_reports
  where public.listing_reports.id = ranked_reports.id
    and ranked_reports.duplicate_rank > 1;
  get diagnostics removed_reports = row_count;

  delete from public.college_overrides
  where trim(college_name) = '';
  get diagnostics removed_overrides = row_count;

  old_rejected_college_requests_removed := removed_rejected;
  duplicate_reports_removed := removed_reports;
  empty_college_overrides_removed := removed_overrides;
  return next;
end;
$$;

revoke all on function public.admin_cleanup_database() from public;
grant execute on function public.admin_cleanup_database() to authenticated;
