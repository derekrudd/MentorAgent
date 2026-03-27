"use client";

import useSWR from "swr";
import {
  getConversations,
  getConversation,
  createConversation,
  updateConversation,
  deleteConversation,
  sendMessage,
} from "@/lib/actions/chat";
import { createClient } from "@/lib/supabase/client";
import type { Conversation } from "@/types/database";

export function useConversations(mentorId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    mentorId ? `conversations-${mentorId}` : null,
    () => getConversations(mentorId)
  );

  async function create(title = "New Conversation"): Promise<Conversation> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const conversation = await createConversation({
      mentor_id: mentorId,
      user_id: user.id,
      title,
    });
    await mutate();
    return conversation;
  }

  async function update(id: string, title: string) {
    await updateConversation({ id, title });
    await mutate();
  }

  async function remove(id: string) {
    await deleteConversation(id);
    await mutate();
  }

  return {
    conversations: data ?? [],
    error,
    isLoading,
    mutate,
    create,
    update,
    remove,
  };
}

async function fetchConversationDirect(conversationId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("*, messages(*)")
    .eq("id", conversationId)
    .order("created_at", {
      referencedTable: "messages",
      ascending: true,
    })
    .single();

  if (error) throw error;
  return data as Conversation;
}

export function useConversation(
  conversationId: string | null,
  isSending = false
) {
  const { data, error, isLoading, mutate } = useSWR(
    conversationId ? `conversation-${conversationId}` : null,
    () => {
      if (!conversationId) return null;
      if (isSending) {
        return fetchConversationDirect(conversationId);
      }
      return getConversation(conversationId);
    },
    {
      refreshInterval: isSending ? 2000 : 0,
    }
  );

  async function send(content: string) {
    if (!conversationId) return;
    await sendMessage({ conversation_id: conversationId, content });
    await mutate();
  }

  return {
    conversation: data ?? null,
    messages: data?.messages ?? [],
    error,
    isLoading,
    mutate,
    send,
  };
}
