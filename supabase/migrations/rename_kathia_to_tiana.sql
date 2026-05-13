-- Rename mentor "Kathia" to "Tiana" in the live database.
-- Apply manually via the Supabase SQL editor.

update public.mentors
set name = 'Tiana',
    personality = replace(personality, 'Kathia', 'Tiana'),
    system_prompt = replace(system_prompt, 'Kathia', 'Tiana')
where name = 'Kathia';
