-- Update Tiana's role from "Mentor Manager" to "Student Success Agent".
-- Apply manually via the Supabase SQL editor.

update public.mentors
set role = 'Student Success Agent',
    system_prompt = replace(system_prompt, 'Mentor Manager', 'Student Success Agent')
where name = 'Tiana';
