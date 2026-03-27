"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  createThreadSchema,
  sendThreadMessageSchema,
} from "@/lib/validations/mentor-threads";
import type {
  MentorThread,
  MentorThreadParticipant,
  MentorThreadMessage,
} from "@/types/database";

export async function getThreads(): Promise<MentorThread[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("mentor_threads")
    .select("*, mentor_thread_participants(*, mentors(*))")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch threads: ${error.message}`);
  }

  return ((data ?? []) as Record<string, unknown>[]).map((thread) => {
    const participants = (
      (thread.mentor_thread_participants as Record<string, unknown>[]) ?? []
    ).map((p) => ({
      ...p,
      mentor: p.mentors,
      mentors: undefined,
    }));

    return {
      ...thread,
      participants,
      mentor_thread_participants: undefined,
    } as unknown as MentorThread;
  });
}

export async function getThread(id: string): Promise<MentorThread | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("mentor_threads")
    .select(
      "*, mentor_thread_participants(*, mentors(*, mentor_skills(*))), mentor_thread_messages(*, mentors(*))"
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch thread: ${error.message}`);
  }

  // Sort messages by created_at ascending
  const messages = (
    (data.mentor_thread_messages as Record<string, unknown>[]) ?? []
  )
    .sort(
      (a, b) =>
        new Date(a.created_at as string).getTime() -
        new Date(b.created_at as string).getTime()
    )
    .map((m) => ({
      ...m,
      sender_mentor: m.mentors,
      mentors: undefined,
    }));

  const participants = (
    (data.mentor_thread_participants as Record<string, unknown>[]) ?? []
  ).map((p) => ({
    ...p,
    mentor: p.mentors,
    mentors: undefined,
  }));

  return {
    ...data,
    participants,
    messages,
    mentor_thread_participants: undefined,
    mentor_thread_messages: undefined,
  } as unknown as MentorThread;
}

export async function createThread(input: unknown): Promise<MentorThread> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const parsed = createThreadSchema.parse(input);

  // Insert the thread
  const { data: thread, error: threadError } = await supabase
    .from("mentor_threads")
    .insert({
      user_id: user.id,
      title: parsed.title,
    })
    .select()
    .single();

  if (threadError) {
    throw new Error(`Failed to create thread: ${threadError.message}`);
  }

  // Bulk-insert participants
  const participantRows = parsed.mentor_ids.map((mentor_id) => ({
    thread_id: thread.id,
    mentor_id,
    role: "participant" as const,
  }));

  const { data: participants, error: participantError } = await supabase
    .from("mentor_thread_participants")
    .insert(participantRows)
    .select("*, mentors(*)");

  if (participantError) {
    throw new Error(
      `Failed to add participants: ${participantError.message}`
    );
  }

  const mappedParticipants = (participants ?? []).map(
    (p: Record<string, unknown>) => ({
      ...p,
      mentor: p.mentors,
      mentors: undefined,
    })
  );

  revalidatePath("/threads");
  return {
    ...thread,
    participants: mappedParticipants,
  } as unknown as MentorThread;
}

export async function deleteThread(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("mentor_threads")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`Failed to delete thread: ${error.message}`);
  }

  revalidatePath("/threads");
}

/**
 * Adds a user message to the thread WITHOUT triggering mentor responses.
 * The user can send multiple messages before calling triggerMentorResponses.
 */
export async function addUserMessage(
  input: unknown
): Promise<MentorThreadMessage> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const parsed = sendThreadMessageSchema.parse(input);

  const { data: userMessage, error: userMsgError } = await supabase
    .from("mentor_thread_messages")
    .insert({
      thread_id: parsed.thread_id,
      sender_type: "user" as const,
      sender_mentor_id: null,
      content: parsed.content,
      status: null,
    })
    .select()
    .single();

  if (userMsgError) {
    throw new Error(`Failed to insert user message: ${userMsgError.message}`);
  }

  // Auto-generate title on first user message
  const { data: allUserMsgs } = await supabase
    .from("mentor_thread_messages")
    .select("sender_type")
    .eq("thread_id", parsed.thread_id)
    .eq("sender_type", "user");

  const { data: threadData } = await supabase
    .from("mentor_threads")
    .select("title")
    .eq("id", parsed.thread_id)
    .single();

  if ((allUserMsgs ?? []).length === 1 && threadData?.title === "New Thread") {
    try {
      const titleResponse = await fetch(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.ANTHROPIC_API_KEY!,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 30,
            system:
              "Generate a concise title (2-6 words) for this conversation. Return only the title, no quotes or punctuation at the end.",
            messages: [
              {
                role: "user",
                content: `User message: "${parsed.content}"`,
              },
            ],
          }),
        }
      );

      if (titleResponse.ok) {
        const titleData = await titleResponse.json();
        const title = titleData.content?.[0]?.text?.trim() ?? "New Thread";
        await supabase
          .from("mentor_threads")
          .update({ title })
          .eq("id", parsed.thread_id);
      }
    } catch {
      // Non-critical
    }
  }

  await supabase
    .from("mentor_threads")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", parsed.thread_id);

  revalidatePath("/threads");
  return userMessage as MentorThreadMessage;
}

/**
 * Triggers mentor responses for the thread.
 * Pass latestUserContent to parse @mentions directly (avoids DB race conditions).
 * If @mentions found, only those mentors respond. Otherwise, all participate.
 */
export async function triggerMentorResponses(
  threadId: string,
  latestUserContent?: string
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Load thread participants
  const { data: participantsData, error: participantsError } = await supabase
    .from("mentor_thread_participants")
    .select("*, mentors(*)")
    .eq("thread_id", threadId);

  if (participantsError) {
    throw new Error(`Failed to load participants: ${participantsError.message}`);
  }

  const participants = (participantsData ?? []).map(
    (p: Record<string, unknown>) => ({
      id: (p.mentors as Record<string, unknown>).id as string,
      name: (p.mentors as Record<string, unknown>).name as string,
    })
  );

  // If no content passed, read from DB as fallback
  let content = latestUserContent;
  if (!content) {
    const { data: latestUserMsg } = await supabase
      .from("mentor_thread_messages")
      .select("content")
      .eq("thread_id", threadId)
      .eq("sender_type", "user")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    content = latestUserMsg?.content ?? "";
  }

  // Parse @mentions from user content
  let mentorIds: string[];
  const mentionPattern = /@(\w+)/gi;
  const mentions: string[] = [];
  let match;
  while ((match = mentionPattern.exec(content || "")) !== null) {
    mentions.push(match[1].toLowerCase());
  }

  if (mentions.length > 0) {
    const mentionedIds = participants
      .filter((p) => mentions.includes(p.name.toLowerCase()))
      .map((p) => p.id);

    mentorIds = mentionedIds.length > 0 ? mentionedIds : participants.map((p) => p.id);
    console.log(`[MentorThread] @mentions detected: ${mentions.join(", ")} → ${mentorIds.length} mentors`);
  } else {
    mentorIds = participants.map((p) => p.id);
  }

  // Fire-and-forget: trigger sequential LLM processing
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3001");

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  void fetch(`${baseUrl}/api/mentor-thread/process`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      thread_id: threadId,
      mentor_ids: mentorIds,
    }),
  });

  await supabase
    .from("mentor_threads")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", threadId);

  revalidatePath("/threads");
}
