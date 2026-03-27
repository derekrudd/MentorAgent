-- =============================================================================
-- MentorAgent Database Schema
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Profiles (extends auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id         uuid        primary key references auth.users(id) on delete cascade,
  full_name  text        not null,
  email      text        not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      split_part(new.email, '@', 1)
    ),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. Mentors
-- ---------------------------------------------------------------------------
create table public.mentors (
  id                  uuid        primary key default gen_random_uuid(),
  name                text        not null,
  role                text        not null,
  avatar_url          text,
  personality         text        not null,
  communication_style text        not null,
  system_prompt       text        not null,
  greeting_message    text        not null,
  is_active           boolean     not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. Mentor Skills
-- ---------------------------------------------------------------------------
create table public.mentor_skills (
  id              uuid        primary key default gen_random_uuid(),
  mentor_id       uuid        not null references public.mentors(id) on delete cascade,
  name            text        not null,
  display_name    text        not null,
  description     text        not null,
  category        text        not null default 'specialty',
  trigger_phrases text[]      not null default '{}',
  is_active       boolean     not null default true,
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. Conversations
-- ---------------------------------------------------------------------------
create table public.conversations (
  id         uuid        primary key default gen_random_uuid(),
  mentor_id  uuid        not null references public.mentors(id) on delete cascade,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  title      text        not null default 'New Conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 5. Messages
-- ---------------------------------------------------------------------------
create table public.messages (
  id              uuid        primary key default gen_random_uuid(),
  conversation_id uuid        not null references public.conversations(id) on delete cascade,
  role            text        not null check (role in ('user', 'assistant')),
  content         text        not null,
  skill_used      text,
  status          text        check (status in ('generating')),
  created_at      timestamptz not null default now()
);

-- =============================================================================
-- Indexes
-- =============================================================================
create index idx_conversations_user_id   on public.conversations(user_id);
create index idx_conversations_mentor_id on public.conversations(mentor_id);
create index idx_messages_conversation_id on public.messages(conversation_id);
create index idx_mentor_skills_mentor_id  on public.mentor_skills(mentor_id);

-- =============================================================================
-- Row Level Security
-- =============================================================================

-- Profiles ------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Mentors -------------------------------------------------------------------
alter table public.mentors enable row level security;

create policy "Authenticated users can read mentors"
  on public.mentors for select
  using (auth.role() = 'authenticated');

-- Mentor Skills -------------------------------------------------------------
alter table public.mentor_skills enable row level security;

create policy "Authenticated users can read mentor skills"
  on public.mentor_skills for select
  using (auth.role() = 'authenticated');

-- Conversations -------------------------------------------------------------
alter table public.conversations enable row level security;

create policy "Users can read own conversations"
  on public.conversations for select
  using (auth.uid() = user_id);

create policy "Users can create own conversations"
  on public.conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own conversations"
  on public.conversations for update
  using (auth.uid() = user_id);

create policy "Users can delete own conversations"
  on public.conversations for delete
  using (auth.uid() = user_id);

-- Messages ------------------------------------------------------------------
alter table public.messages enable row level security;

create policy "Users can read messages in own conversations"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
        and conversations.user_id = auth.uid()
    )
  );

create policy "Users can create messages in own conversations"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
        and conversations.user_id = auth.uid()
    )
  );

create policy "Users can update messages in own conversations"
  on public.messages for update
  using (
    exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
        and conversations.user_id = auth.uid()
    )
  );
