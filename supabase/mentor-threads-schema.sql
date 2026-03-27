-- =============================================================================
-- MentorThreads Schema (Multi-Mentor Collaborative Conversations)
-- Run this AFTER schema.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Mentor Threads
-- ---------------------------------------------------------------------------
create table public.mentor_threads (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  title      text        not null default 'New Thread',
  status     text        not null default 'active' check (status in ('active', 'completed')),
  max_turns  integer     not null default 50,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. Thread Participants
-- ---------------------------------------------------------------------------
create table public.mentor_thread_participants (
  id        uuid        primary key default gen_random_uuid(),
  thread_id uuid        not null references public.mentor_threads(id) on delete cascade,
  mentor_id uuid        not null references public.mentors(id) on delete cascade,
  role      text        not null default 'participant' check (role in ('participant')),
  joined_at timestamptz not null default now(),
  unique(thread_id, mentor_id)
);

-- ---------------------------------------------------------------------------
-- 3. Thread Messages
-- ---------------------------------------------------------------------------
create table public.mentor_thread_messages (
  id               uuid        primary key default gen_random_uuid(),
  thread_id        uuid        not null references public.mentor_threads(id) on delete cascade,
  sender_type      text        not null check (sender_type in ('user', 'mentor', 'system')),
  sender_mentor_id uuid        references public.mentors(id),
  content          text        not null,
  skill_used       text,
  status           text        check (status in ('generating')),
  created_at       timestamptz not null default now()
);

-- =============================================================================
-- Indexes
-- =============================================================================
create index idx_mentor_threads_user_id on public.mentor_threads(user_id);
create index idx_mentor_thread_participants_thread_id on public.mentor_thread_participants(thread_id);
create index idx_mentor_thread_messages_thread_id on public.mentor_thread_messages(thread_id);

-- =============================================================================
-- Row Level Security
-- =============================================================================

-- Mentor Threads ---------------------------------------------------------------
alter table public.mentor_threads enable row level security;

create policy "Users can read own threads"
  on public.mentor_threads for select
  using (auth.uid() = user_id);

create policy "Users can create own threads"
  on public.mentor_threads for insert
  with check (auth.uid() = user_id);

create policy "Users can update own threads"
  on public.mentor_threads for update
  using (auth.uid() = user_id);

create policy "Users can delete own threads"
  on public.mentor_threads for delete
  using (auth.uid() = user_id);

-- Thread Participants -----------------------------------------------------------
alter table public.mentor_thread_participants enable row level security;

create policy "Users can read participants in own threads"
  on public.mentor_thread_participants for select
  using (
    exists (
      select 1 from public.mentor_threads
      where mentor_threads.id = mentor_thread_participants.thread_id
        and mentor_threads.user_id = auth.uid()
    )
  );

create policy "Users can add participants to own threads"
  on public.mentor_thread_participants for insert
  with check (
    exists (
      select 1 from public.mentor_threads
      where mentor_threads.id = mentor_thread_participants.thread_id
        and mentor_threads.user_id = auth.uid()
    )
  );

create policy "Users can remove participants from own threads"
  on public.mentor_thread_participants for delete
  using (
    exists (
      select 1 from public.mentor_threads
      where mentor_threads.id = mentor_thread_participants.thread_id
        and mentor_threads.user_id = auth.uid()
    )
  );

-- Thread Messages ---------------------------------------------------------------
alter table public.mentor_thread_messages enable row level security;

create policy "Users can read messages in own threads"
  on public.mentor_thread_messages for select
  using (
    exists (
      select 1 from public.mentor_threads
      where mentor_threads.id = mentor_thread_messages.thread_id
        and mentor_threads.user_id = auth.uid()
    )
  );

create policy "Users can create messages in own threads"
  on public.mentor_thread_messages for insert
  with check (
    exists (
      select 1 from public.mentor_threads
      where mentor_threads.id = mentor_thread_messages.thread_id
        and mentor_threads.user_id = auth.uid()
    )
  );

create policy "Users can update messages in own threads"
  on public.mentor_thread_messages for update
  using (
    exists (
      select 1 from public.mentor_threads
      where mentor_threads.id = mentor_thread_messages.thread_id
        and mentor_threads.user_id = auth.uid()
    )
  );

-- =============================================================================
-- Enable Supabase Realtime for thread messages
-- =============================================================================
alter publication supabase_realtime add table public.mentor_thread_messages;
