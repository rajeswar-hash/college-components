alter table public.profiles
add column if not exists seller_verification_status text not null default 'pending',
add column if not exists student_id_card_path text,
add column if not exists student_id_reviewed_at timestamp with time zone,
add column if not exists student_id_rejection_reason text;

create index if not exists profiles_seller_verification_status_idx
on public.profiles (seller_verification_status, created_at desc);

update public.profiles
set seller_verification_status = 'approved',
    student_id_rejection_reason = null
where seller_verification_status is distinct from 'approved'
  and (
    is_admin = true
    or (coalesce(name, '') <> '' and coalesce(phone, '') <> '' and coalesce(college, '') <> '')
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'student-verification',
  'student-verification',
  false,
  4194304,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users or admins can view student verification files" on storage.objects;
create policy "Users or admins can view student verification files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'student-verification'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or public.is_admin()
  )
);

drop policy if exists "Users can upload own student verification files" on storage.objects;
create policy "Users can upload own student verification files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'student-verification'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "Users or admins can update student verification files" on storage.objects;
create policy "Users or admins can update student verification files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'student-verification'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or public.is_admin()
  )
)
with check (
  bucket_id = 'student-verification'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or public.is_admin()
  )
);

drop policy if exists "Users or admins can delete student verification files" on storage.objects;
create policy "Users or admins can delete student verification files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'student-verification'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or public.is_admin()
  )
);
