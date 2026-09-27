-- Pool Party Personality — Supabase schema
-- Run once in the Supabase SQL editor. The app talks to these tables with the
-- service-role key from the server only; RLS stays on with no anon policies so
-- nothing is readable publicly.

create extension if not exists pgcrypto;

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text not null,
  undergraduate_university text,
  graduate_university text,
  cmu_program text,
  avatar_type text,
  quiz_completed_at timestamptz,
  is_seed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists answers (
  participant_id uuid not null references participants(id) on delete cascade,
  question_id text not null,
  normalized_value real not null check (normalized_value >= 0 and normalized_value <= 100),
  display_value text not null,
  primary key (participant_id, question_id)
);

create table if not exists activities (
  id text primary key,
  name text not null
);

insert into activities (id, name) values
  ('swimming', 'Swimming'),
  ('ping_pong', 'Ping Pong'),
  ('pool', 'Pool / Billiards'),
  ('board_games', 'Board Games')
on conflict (id) do nothing;

create table if not exists participant_activities (
  participant_id uuid not null references participants(id) on delete cascade,
  activity_id text not null references activities(id),
  is_interested boolean not null default true,
  primary key (participant_id, activity_id)
);

create index if not exists answers_participant_idx on answers(participant_id);
create index if not exists participant_activities_activity_idx on participant_activities(activity_id);

alter table participants enable row level security;
alter table answers enable row level security;
alter table activities enable row level security;
alter table participant_activities enable row level security;
