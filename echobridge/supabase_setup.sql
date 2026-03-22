-- ════════════════════════════════════════════
-- EchoBridge — Supabase Database Setup
-- Run this in your Supabase SQL Editor
-- ════════════════════════════════════════════

-- 1. PROFILES (extends auth.users)
create table if not exists public.profiles (
  id            uuid references auth.users primary key,
  full_name     text,
  age_group     text check (age_group in ('elder', 'teen')),
  bio           text,
  community     text,
  avatar_url    text,
  default_privacy text default 'community',
  created_at    timestamptz default now()
);

-- 2. PROMPTS
create table if not exists public.prompts (
  id        uuid primary key default gen_random_uuid(),
  category  text not null,
  question  text not null,
  created_at timestamptz default now()
);

-- 3. STORIES
create table if not exists public.stories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade,
  title       text not null,
  media_url   text,
  media_type  text check (media_type in ('audio', 'video')),
  prompt_id   uuid references public.prompts(id),
  privacy     text default 'community' check (privacy in ('public','community','private')),
  created_at  timestamptz default now()
);

-- 4. REACTIONS
create table if not exists public.reactions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.profiles(id) on delete cascade,
  story_id        uuid references public.stories(id) on delete cascade,
  reaction_type   text check (reaction_type in ('heart','spark','hug')),
  created_at      timestamptz default now(),
  unique (user_id, story_id)
);

-- 5. COMMENTS
create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade,
  story_id    uuid references public.stories(id) on delete cascade,
  content     text not null,
  created_at  timestamptz default now()
);

-- ════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════════
alter table public.profiles  enable row level security;
alter table public.prompts   enable row level security;
alter table public.stories   enable row level security;
alter table public.reactions enable row level security;
alter table public.comments  enable row level security;

-- Profiles: readable by all authenticated, writable by owner
create policy "profiles_select" on public.profiles for select using (auth.role() = 'authenticated');
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- Prompts: readable by all
create policy "prompts_select" on public.prompts for select using (auth.role() = 'authenticated');

-- Stories: public/community readable, private owner only
create policy "stories_select" on public.stories for select using (
  privacy in ('public','community') or user_id = auth.uid()
);
create policy "stories_insert" on public.stories for insert with check (auth.uid() = user_id);
create policy "stories_delete" on public.stories for delete using (auth.uid() = user_id);

-- Reactions & comments: authenticated users
create policy "reactions_select" on public.reactions for select using (auth.role() = 'authenticated');
create policy "reactions_insert" on public.reactions for insert with check (auth.uid() = user_id);
create policy "reactions_update" on public.reactions for update using (auth.uid() = user_id);
create policy "reactions_delete" on public.reactions for delete using (auth.uid() = user_id);

create policy "comments_select" on public.comments for select using (auth.role() = 'authenticated');
create policy "comments_insert" on public.comments for insert with check (auth.uid() = user_id);
create policy "comments_delete" on public.comments for delete using (auth.uid() = user_id);

-- ════════════════════════════════════════════
-- STORAGE BUCKET
-- ════════════════════════════════════════════
insert into storage.buckets (id, name, public) values ('stories', 'stories', true)
on conflict (id) do nothing;

create policy "stories_upload" on storage.objects for insert
  with check (bucket_id = 'stories' and auth.role() = 'authenticated');
create policy "stories_read" on storage.objects for select
  using (bucket_id = 'stories');

-- ════════════════════════════════════════════
-- SEED PROMPTS
-- ════════════════════════════════════════════
insert into public.prompts (category, question) values
  ('Family & Heritage',    'What is one tradition from your family you want to preserve?'),
  ('Family & Heritage',    'What was your relationship with your grandparents like?'),
  ('Family & Heritage',    'Describe a meal that takes you back to your childhood.'),
  ('Growth & Resilience',  'Tell us about your first job.'),
  ('Growth & Resilience',  'What challenge taught you the most about yourself?'),
  ('Growth & Resilience',  'Describe a moment of courage you are proud of.'),
  ('Advice for Youth',     'What advice would you give your younger self?'),
  ('Advice for Youth',     'What is a skill you wish you had learned earlier?'),
  ('Advice for Youth',     'What does success really mean to you?'),
  ('Education & Learning', 'What was your favourite subject in school and why?'),
  ('Education & Learning', 'What is one thing school never taught you?'),
  ('Education & Learning', 'Who was the most memorable teacher in your life?'),
  ('Community & Culture',  'Describe a moment of unexpected kindness in your community.'),
  ('Community & Culture',  'What does home mean to you?'),
  ('Community & Culture',  'What is a local tradition your community should celebrate more?'),
  ('Funny & Light',        'Tell us about a funny mistake you once made.'),
  ('Funny & Light',        'What was the most embarrassing trend you followed?'),
  ('Funny & Light',        'Describe the best prank you ever pulled or experienced.')
on conflict do nothing;
