## New Database Move

This app is ready to move to a brand-new, empty Supabase project.

The old Lovable database should be left untouched.

### What to create

New Supabase project selected for `CampusKart`:

- Project id: `vhdrmhnsnngfnnsfbrln`
- Project URL: `https://vhdrmhnsnngfnnsfbrln.supabase.co`

### What to send back here

Provided:

1. `Project URL`
2. `Anon / Publishable key`

### What I will do next

1. Replace the current environment values with the new project values.
2. Apply the schema on the new project from:
   `supabase/migrations/20260319030628_747d3974-faa4-4a27-a05a-301fd816fe37.sql`
3. Verify the app points only to the new empty database.
4. Push the update so Netlify uses the new database.

### Important

- The app config has been updated to the new project.
- No old data needs to be deleted.
- The migration file in this repo creates the required `profiles` and `listings` tables and auth-triggered profile creation.
- Until the SQL migration is run in the new Supabase project, login/listing features will not work yet.
