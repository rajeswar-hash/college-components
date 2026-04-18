create index if not exists listings_college_sold_visible_created_idx
on public.listings (college, created_at desc)
where sold = false
  and moderation_status not in ('pending_review', 'rejected');

create index if not exists listings_college_sold_created_idx
on public.listings (college, sold, created_at desc);

create index if not exists listings_id_seller_idx
on public.listings (id, seller_id);

create index if not exists listing_reports_reporter_listing_idx
on public.listing_reports (reporter_id, listing_id, created_at desc);

create index if not exists college_overrides_college_action_idx
on public.college_overrides (college_name, action);
