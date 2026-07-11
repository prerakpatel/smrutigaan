-- Smruti Gaan — Supabase schema
-- Run this once in the Supabase dashboard: SQL Editor → New query → paste → Run.

-- ============================================================
-- 1. The shared kirtan library (readable by everyone, editable
--    only by accounts listed in the editors table)
-- ============================================================
create table if not exists public.kirtans (
  id         text primary key,
  title      jsonb not null default '{}'::jsonb,   -- { gu, en }
  lyrics     jsonb not null default '{}'::jsonb,   -- { gu, en }
  categories text[] not null default '{}',
  audio      jsonb,                                -- { url } — Storage or external
  updated_at timestamptz not null default now()
);

alter table public.kirtans enable row level security;

-- ============================================================
-- 2. Editors — WHO CAN EDIT THE LIBRARY.
--    To make someone an editor: they sign in to the app once
--    (so an auth user exists), then you run, right here in the
--    SQL editor:
--
--      insert into public.editors (user_id, email)
--      select id, email from auth.users where email = 'person@gmail.com';
--
--    To revoke: delete their row from public.editors
--    (Table Editor → editors → delete row).
-- ============================================================
create table if not exists public.editors (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  email    text,
  added_at timestamptz not null default now()
);

alter table public.editors enable row level security;

-- each signed-in user may check whether THEY are an editor
create policy "read own editor row" on public.editors
  for select using (auth.uid() = user_id);

-- helper used by the kirtan write policies
create or replace function public.is_editor()
returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.editors where user_id = auth.uid()) $$;

-- kirtan policies: world-readable, editor-writable
create policy "kirtans readable by all" on public.kirtans
  for select using (true);
create policy "editors insert kirtans" on public.kirtans
  for insert with check (public.is_editor());
create policy "editors update kirtans" on public.kirtans
  for update using (public.is_editor());
create policy "editors delete kirtans" on public.kirtans
  for delete using (public.is_editor());

-- ============================================================
-- 3. Per-user sync: favorites, playlists, notes & highlights.
--    One row per user, only readable/writable by its owner.
-- ============================================================
create table if not exists public.user_data (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,  -- { favorites, playlists, annotations }
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

create policy "own data" on public.user_data
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- 4. Audio storage (optional, for hosting recordings):
--    Dashboard → Storage → New bucket → name: audio → Public bucket ON.
--    Then run these policies so only editors can upload:
-- ============================================================
create policy "audio readable by all" on storage.objects
  for select using (bucket_id = 'audio');
create policy "editors upload audio" on storage.objects
  for insert with check (bucket_id = 'audio' and public.is_editor());
create policy "editors update audio" on storage.objects
  for update using (bucket_id = 'audio' and public.is_editor());
create policy "editors delete audio" on storage.objects
  for delete using (bucket_id = 'audio' and public.is_editor());
