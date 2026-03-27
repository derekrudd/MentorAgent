"use server";

import { createClient } from "@/lib/supabase/server";
import type { Mentor } from "@/types/database";

export async function getMentors(): Promise<Mentor[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("mentors")
    .select("*, mentor_skills(*)")
    .eq("is_active", true)
    .order("name");

  if (error) {
    throw new Error(`Failed to fetch mentors: ${error.message}`);
  }

  return (data ?? []).map((mentor) => ({
    ...mentor,
    skills: mentor.mentor_skills,
  })) as Mentor[];
}

export async function getMentor(id: string): Promise<Mentor | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("mentors")
    .select("*, mentor_skills(*)")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch mentor: ${error.message}`);
  }

  return {
    ...data,
    skills: data.mentor_skills,
  } as Mentor;
}
