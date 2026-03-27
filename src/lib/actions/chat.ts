"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createConversationSchema,
  updateConversationSchema,
  sendMessageSchema,
} from "@/lib/validations/chat";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { callLLMWithTools } from "@/lib/ai/anthropic";
import type { Conversation, Message } from "@/types/database";

export async function getConversations(
  mentorId: string
): Promise<Conversation[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("mentor_id", mentorId)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch conversations: ${error.message}`);
  }

  return (data ?? []) as Conversation[];
}

export async function getConversation(
  id: string
): Promise<Conversation | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("conversations")
    .select("*, messages(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch conversation: ${error.message}`);
  }

  // Sort messages by created_at ascending
  const messages = (data.messages ?? []).sort(
    (a: Message, b: Message) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return {
    ...data,
    messages,
  } as Conversation;
}

export async function createConversation(
  input: unknown
): Promise<Conversation> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const parsed = createConversationSchema.parse(input);

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      mentor_id: parsed.mentor_id,
      user_id: parsed.user_id,
      title: parsed.title,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create conversation: ${error.message}`);
  }

  revalidatePath("/dashboard");
  return data as Conversation;
}

export async function updateConversation(
  input: unknown
): Promise<Conversation> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const parsed = updateConversationSchema.parse(input);

  const { data, error } = await supabase
    .from("conversations")
    .update({ title: parsed.title })
    .eq("id", parsed.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update conversation: ${error.message}`);
  }

  revalidatePath("/dashboard");
  return data as Conversation;
}

export async function deleteConversation(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`Failed to delete conversation: ${error.message}`);
  }

  revalidatePath("/dashboard");
}

export async function sendMessage(input: unknown): Promise<Message> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const parsed = sendMessageSchema.parse(input);

  // 1. Insert user message
  const { data: userMessage, error: userMsgError } = await supabase
    .from("messages")
    .insert({
      conversation_id: parsed.conversation_id,
      role: "user" as const,
      content: parsed.content,
      skill_used: null,
      status: null,
    })
    .select()
    .single();

  if (userMsgError) {
    throw new Error(`Failed to insert user message: ${userMsgError.message}`);
  }

  // 2. Load conversation+mentor+skills and last 10 messages in parallel
  const [conversationResult, messagesResult] = await Promise.all([
    supabase
      .from("conversations")
      .select("*, mentors(*, mentor_skills(*))")
      .eq("id", parsed.conversation_id)
      .single(),
    supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", parsed.conversation_id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (conversationResult.error) {
    throw new Error(
      `Failed to load conversation: ${conversationResult.error.message}`
    );
  }

  if (messagesResult.error) {
    throw new Error(
      `Failed to load messages: ${messagesResult.error.message}`
    );
  }

  const conversation = conversationResult.data;
  const mentor = (conversation as Record<string, unknown>).mentors as Record<
    string,
    unknown
  >;
  const skills = (mentor.mentor_skills as unknown[]) ?? [];

  // 3. Build system prompt
  const systemPrompt = buildSystemPrompt(
    mentor as unknown as import("@/types/database").Mentor,
    skills as unknown as import("@/types/database").MentorSkill[]
  );

  // 4. Format messages for Anthropic (oldest first)
  const recentMessages = (messagesResult.data ?? [])
    .reverse()
    .map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  // 5. Insert placeholder assistant message
  const { data: placeholderMsg, error: placeholderError } = await supabase
    .from("messages")
    .insert({
      conversation_id: parsed.conversation_id,
      role: "assistant" as const,
      content: "Thinking...",
      skill_used: null,
      status: "generating" as const,
    })
    .select()
    .single();

  if (placeholderError) {
    throw new Error(
      `Failed to insert placeholder message: ${placeholderError.message}`
    );
  }

  // 6. Create onProgress callback
  const onProgress = async (status: string) => {
    await supabase
      .from("messages")
      .update({ content: status })
      .eq("id", placeholderMsg.id);
  };

  // 7. Call LLM with tools
  const { response, skill_used } = await callLLMWithTools(
    systemPrompt,
    recentMessages,
    onProgress
  );

  // 8. Update placeholder with final response
  const { data: assistantMessage, error: updateError } = await supabase
    .from("messages")
    .update({
      content: response,
      skill_used,
      status: null,
    })
    .eq("id", placeholderMsg.id)
    .select()
    .single();

  if (updateError) {
    throw new Error(
      `Failed to update assistant message: ${updateError.message}`
    );
  }

  // 9. Auto-generate title on first exchange
  const allUserMessages = (messagesResult.data ?? []).filter(
    (m: { role: string }) => m.role === "user"
  );

  if (
    allUserMessages.length === 1 &&
    conversation.title === "New Conversation"
  ) {
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
                content: `User message: "${parsed.content}"\n\nAssistant response: "${response.slice(0, 200)}"`,
              },
            ],
          }),
        }
      );

      if (titleResponse.ok) {
        const titleData = await titleResponse.json();
        const title =
          titleData.content?.[0]?.text?.trim() ?? "New Conversation";

        await supabase
          .from("conversations")
          .update({ title })
          .eq("id", parsed.conversation_id);
      }
    } catch {
      // Title generation is non-critical, silently ignore errors
    }
  }

  // 10. Touch conversation updated_at
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", parsed.conversation_id);

  revalidatePath("/dashboard");
  return assistantMessage as Message;
}
