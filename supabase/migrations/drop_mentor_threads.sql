-- Drop the Mentor Threads feature tables.
-- Apply manually via the Supabase SQL editor.

drop table if exists public.mentor_thread_messages cascade;
drop table if exists public.mentor_thread_participants cascade;
drop table if exists public.mentor_threads cascade;
