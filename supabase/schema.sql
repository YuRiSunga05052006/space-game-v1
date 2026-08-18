-- Star Blaster player progress (paste into the Supabase SQL Editor and run).
-- Email/password auth is enabled by default. Optional: disable "Confirm email"
-- in Authentication > Providers > Email for easier local testing.

create table if not exists public.player_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.player_progress enable row level security;

revoke all on table public.player_progress from anon;
revoke all on table public.player_progress from public;
grant select, insert, update on table public.player_progress to authenticated;

drop policy if exists "Users can read own progress" on public.player_progress;
create policy "Users can read own progress"
on public.player_progress
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own progress" on public.player_progress;
create policy "Users can insert own progress"
on public.player_progress
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own progress" on public.player_progress;
create policy "Users can update own progress"
on public.player_progress
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Optional: grant Unlock All on the account screen.
-- In Authentication > Users > a user > App metadata, set { "developer": true }
-- then have that user sign out and sign back in.
