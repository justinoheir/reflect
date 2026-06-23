-- Reflect — database schema
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query).
-- Safe to re-run.

create extension if not exists "pgcrypto";

-- ── Journal entries ──────────────────────────────────────────────
create table if not exists public.entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  text        text not null,
  mood        text,
  category    text not null,
  prompt      text,
  reflection  text,
  liked       boolean not null default false,
  saved       boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists entries_user_created_idx
  on public.entries (user_id, created_at desc);

-- ── Saved reflections ────────────────────────────────────────────
create table if not exists public.saved_reflections (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  reflection  text not null,
  snippet     text not null,
  category    text not null,
  mood        text,
  entry_date  timestamptz not null,
  created_at  timestamptz not null default now()
);

create index if not exists saved_user_created_idx
  on public.saved_reflections (user_id, created_at desc);

-- ── Row-level security: each user sees only their own rows ────────
alter table public.entries           enable row level security;
alter table public.saved_reflections enable row level security;

drop policy if exists "entries are private to owner" on public.entries;
create policy "entries are private to owner"
  on public.entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "saved are private to owner" on public.saved_reflections;
create policy "saved are private to owner"
  on public.saved_reflections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
