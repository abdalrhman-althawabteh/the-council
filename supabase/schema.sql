-- The Council — schema. Single-user app (Abood's channel); no RLS needed since
-- all access is server-side via the service key. Run in the Supabase SQL editor.

create extension if not exists "pgcrypto";

-- Own-channel videos with public stats + private analytics (from sync) ---------
create table if not exists channel_snapshots (
  video_id        text primary key,
  title           text not null,
  published_at    timestamptz,
  thumbnail       text,
  views           bigint default 0,
  likes           bigint default 0,
  comments        bigint default 0,
  -- private analytics (YouTube Analytics API); null until OAuth-connected sync
  avg_view_pct    numeric,        -- average percentage viewed (retention)
  avg_view_sec    numeric,        -- average view duration in seconds
  ctr             numeric,        -- impressions click-through rate
  impressions     bigint,
  synced_at       timestamptz default now()
);

-- Daily research: competitor + niche videos found by the scout ----------------
create table if not exists competitor_videos (
  id            uuid primary key default gen_random_uuid(),
  video_id      text unique not null,
  title         text not null,
  channel_title text,
  channel_id    text,
  url           text,
  thumbnail     text,
  views         bigint default 0,
  published_at  timestamptz,
  query         text,             -- search query that surfaced it
  why_relevant  text,             -- short note (optional, model-filled)
  segment       text default 'market' check (segment in ('tracked','market')),
  found_at      timestamptz default now()
);
-- migration for existing DBs:
-- alter table competitor_videos add column if not exists segment text default 'market';

-- Summarized comment themes (not raw comments) --------------------------------
create table if not exists comment_insights (
  id          uuid primary key default gen_random_uuid(),
  theme       text not null,
  summary     text not null,
  sentiment   text,               -- positive | neutral | negative | mixed
  sample      text,               -- a representative quote
  weight      int default 1,      -- how often it came up
  created_at  timestamptz default now()
);

-- Ideas on the funnel board --------------------------------------------------
create table if not exists ideas (
  id          uuid primary key default gen_random_uuid(),
  title_seed  text not null,
  summary     text,
  funnel      text check (funnel in ('tof','mof','bof')),
  status      text not null default 'proposed'
              check (status in ('proposed','approved','scripted','rejected')),
  score       int,                -- council score 0-100
  source      text,               -- 'council' | 'research' | 'manual'
  source_ref  text,               -- e.g. competitor video_id it came from
  created_at  timestamptz default now()
);

-- Council debate transcript + verdict ----------------------------------------
create table if not exists council_sessions (
  id          uuid primary key default gen_random_uuid(),
  idea_id     uuid references ideas(id) on delete set null,
  topic       text,
  transcript  jsonb not null default '[]'::jsonb,  -- [{agent, round, text}]
  verdict     jsonb,                                -- {score, funnel, strengths[], weaknesses[], recommendation, title}
  created_at  timestamptz default now()
);

-- Generated title + script for approved ideas --------------------------------
create table if not exists scripts (
  id          uuid primary key default gen_random_uuid(),
  idea_id     uuid references ideas(id) on delete cascade,
  title       text not null,
  hook        text,
  script      text not null,
  lang        text not null default 'en' check (lang in ('en','ar')),
  created_at  timestamptz default now()
);

-- Cron run log ---------------------------------------------------------------
create table if not exists research_runs (
  id          uuid primary key default gen_random_uuid(),
  started_at  timestamptz default now(),
  finished_at timestamptz,
  found_count int default 0,
  error       text
);

-- Single-row Google OAuth token store (channel owner) ------------------------
create table if not exists oauth_tokens (
  id            int primary key default 1 check (id = 1),
  refresh_token text not null,
  access_token  text,
  expiry        timestamptz,
  channel_id    text,
  updated_at    timestamptz default now()
);

-- App settings (single row): schedule, tracked competitors, default lang -----
create table if not exists app_settings (
  id            int primary key default 1 check (id = 1),
  research_hour int default 6,                       -- UTC hour for daily job note
  competitors   text[] default '{}',                 -- channel handles/ids to track
  default_lang  text default 'en' check (default_lang in ('en','ar')),
  updated_at    timestamptz default now()
);
insert into app_settings (id) values (1) on conflict (id) do nothing;

create index if not exists ideas_funnel_idx on ideas (funnel, created_at desc);
create index if not exists competitor_found_idx on competitor_videos (found_at desc);
