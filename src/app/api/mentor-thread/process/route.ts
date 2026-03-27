import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processThreadMessageSchema } from "@/lib/validations/mentor-threads";
import { buildThreadSystemPrompt, scoreMentorRelevance } from "@/lib/ai/thread-system-prompt";
import { callLLMWithTools } from "@/lib/ai/anthropic";
import type { Mentor, MentorSkill } from "@/types/database";

/**
 * Processes mentor responses SEQUENTIALLY in random order.
 * Placeholders are inserted one-at-a-time so only one mentor
 * appears to "think" at a time — creating organic, riffing conversation.
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const parsed = processThreadMessageSchema.parse(body);
    const { thread_id, mentor_ids } = parsed;

    // Load all participants with mentor data + skills
    const { data: participantsData, error: participantsError } = await supabase
      .from("mentor_thread_participants")
      .select("*, mentors(*, mentor_skills(*))")
      .eq("thread_id", thread_id);

    if (participantsError) {
      throw new Error(`Failed to load participants: ${participantsError.message}`);
    }

    const allParticipantMentors = (participantsData ?? []).map(
      (p: Record<string, unknown>) =>
        p.mentors as unknown as Mentor & { mentor_skills: MentorSkill[] }
    );

    // Check if these are explicitly @mentioned mentors (subset of all participants)
    const allParticipantIds = allParticipantMentors.map((m) => m.id);
    const isExplicitMention = mentor_ids.length < allParticipantIds.length;

    let ordered: Array<{ id: string; score: number }>;

    if (isExplicitMention) {
      // User @mentioned specific mentors — keep their order, all are "primary"
      ordered = mentor_ids.map((id) => ({ id, score: 0 }));
      console.log(
        `[MentorThread] @mentioned: ${ordered.map((m) => {
          const mentor = allParticipantMentors.find((p) => p.id === m.id);
          return mentor?.name;
        }).join(", ")}`
      );
    } else {
      // No @mentions — use relevance scoring
      const { data: recentUserMsgs } = await supabase
        .from("mentor_thread_messages")
        .select("content")
        .eq("thread_id", thread_id)
        .eq("sender_type", "user")
        .order("created_at", { ascending: false })
        .limit(3);

      const userContent = (recentUserMsgs ?? [])
        .map((m: { content: string }) => m.content)
        .join(" ");

      const scoredMentors = mentor_ids
        .map((id) => {
          const mentor = allParticipantMentors.find((m) => m.id === id);
          const score = mentor ? scoreMentorRelevance(mentor, userContent) : 0;
          return { id, score };
        })
        .sort((a, b) => b.score - a.score);

      const allEqual = scoredMentors.every((m) => m.score === scoredMentors[0].score);
      ordered = allEqual
        ? scoredMentors.sort(() => Math.random() - 0.5)
        : scoredMentors;

      console.log(
        `[MentorThread] Relevance order: ${ordered.map((m) => {
          const mentor = allParticipantMentors.find((p) => p.id === m.id);
          return `${mentor?.name}(${m.score})`;
        }).join(" → ")}`
      );
    }

    // Process each mentor sequentially
    for (let i = 0; i < ordered.length; i++) {
      const mentorId = ordered[i].id;
      const isFirst = i === 0;
      // When @mentioned, all mentors are treated as primary experts
      const isPrimaryExpert = isExplicitMention || i === 0;

      try {
        const mentorData = allParticipantMentors.find((m) => m.id === mentorId);
        if (!mentorData) {
          throw new Error(`Mentor ${mentorId} not found in participants`);
        }

        const skills = (mentorData.mentor_skills ?? []) as MentorSkill[];
        const otherParticipants = allParticipantMentors.filter((m) => m.id !== mentorId);

        // Determine initial placeholder content
        let initialContent = "Thinking...";
        if (!isFirst) {
          const prevMentor = allParticipantMentors.find(
            (m) => m.id === ordered[i - 1].id
          );
          const readingMessages = [
            `Reading ${prevMentor?.name || "the other mentor"}'s response...`,
            `Considering ${prevMentor?.name || "the other mentor"}'s points...`,
            `Building on ${prevMentor?.name || "the other mentor"}'s insights...`,
          ];
          initialContent = readingMessages[Math.floor(Math.random() * readingMessages.length)];
        }

        // Insert this mentor's placeholder NOW (not upfront)
        const { data: placeholder, error: placeholderError } = await supabase
          .from("mentor_thread_messages")
          .insert({
            thread_id,
            sender_type: "mentor" as const,
            sender_mentor_id: mentorId,
            content: initialContent,
            status: "generating" as const,
          })
          .select()
          .single();

        if (placeholderError) {
          throw new Error(`Failed to insert placeholder: ${placeholderError.message}`);
        }

        const placeholderMessageId = placeholder.id;

        // If not the first mentor, pause briefly for organic feel
        if (!isFirst) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1500 + Math.random() * 1500)
          );

          // Update to "Analyzing..." before starting LLM call
          await supabase
            .from("mentor_thread_messages")
            .update({ content: "Analyzing..." })
            .eq("id", placeholderMessageId);
        }

        // Load latest messages (includes previous mentors' responses from this batch)
        const { data: messagesData, error: messagesError } = await supabase
          .from("mentor_thread_messages")
          .select("*, mentors(name)")
          .eq("thread_id", thread_id)
          .order("created_at", { ascending: true })
          .limit(20);

        if (messagesError) {
          throw new Error(`Failed to load messages: ${messagesError.message}`);
        }

        const messages = (messagesData ?? []) as Array<{
          id: string;
          sender_type: string;
          sender_mentor_id: string | null;
          content: string;
          status: string | null;
          mentors: { name: string } | null;
        }>;

        // Build message history for THIS mentor
        const anthropicMessages = messages
          .filter((m) => m.status !== "generating")
          .map((m) => {
            if (m.sender_type === "user") {
              return { role: "user" as const, content: m.content };
            }
            if (m.sender_type === "mentor" && m.sender_mentor_id === mentorId) {
              return { role: "assistant" as const, content: m.content };
            }
            const senderName = m.mentors?.name || "System";
            return {
              role: "user" as const,
              content: `[${senderName}]: ${m.content}`,
            };
          });

        // Build system prompt — primary expert gets full response, others stay brief
        const systemPrompt = buildThreadSystemPrompt(
          mentorData as Mentor,
          skills,
          otherParticipants as Mentor[],
          isPrimaryExpert
        );

        // Progress callback updates the placeholder
        const onProgress = async (status: string) => {
          await supabase
            .from("mentor_thread_messages")
            .update({ content: status })
            .eq("id", placeholderMessageId);
        };

        // Call LLM
        const { response, skill_used } = await callLLMWithTools(
          systemPrompt,
          anthropicMessages,
          onProgress
        );

        // Finalize: replace placeholder with actual response
        await supabase
          .from("mentor_thread_messages")
          .update({
            content: response,
            skill_used,
            status: null,
          })
          .eq("id", placeholderMessageId);

        // Note: secondary mentors are already told via system prompt to not
        // ask additional questions and keep responses brief, so no need to
        // break the loop here.
      } catch (err) {
        console.error(`Error processing mentor ${mentorId}:`, err);

        // Insert an error message for this mentor so the UI shows something
        await supabase
          .from("mentor_thread_messages")
          .insert({
            thread_id,
            sender_type: "mentor" as const,
            sender_mentor_id: mentorId,
            content: "Sorry, I encountered an error generating my response. Please try again.",
            status: null,
          });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in thread processing:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
