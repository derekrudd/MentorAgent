"use client";

import { useCallback, useEffect, useRef } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import {
  getThreads,
  getThread,
  createThread,
  deleteThread,
  addUserMessage,
  triggerMentorResponses,
} from "@/lib/actions/mentor-threads";
import type { CreateThreadInput } from "@/lib/validations/mentor-threads";

export function useThreads() {
  const { data, error, isLoading, mutate } = useSWR(
    "mentor-threads",
    () => getThreads()
  );

  const create = useCallback(
    async (input: CreateThreadInput) => {
      const thread = await createThread(input);
      await mutate();
      return thread;
    },
    [mutate]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteThread(id);
      await mutate();
    },
    [mutate]
  );

  return {
    threads: data ?? [],
    error,
    isLoading,
    mutate,
    create,
    remove,
  };
}

export function useThread(threadId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    threadId ? `mentor-thread-${threadId}` : null,
    () => (threadId ? getThread(threadId) : null)
  );

  // Use a ref for mutate so the realtime subscription doesn't resubscribe on every render
  const mutateRef = useRef(mutate);
  useEffect(() => {
    mutateRef.current = mutate;
  }, [mutate]);

  // Supabase Realtime subscription for live message updates
  useEffect(() => {
    if (!threadId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`thread-${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "mentor_thread_messages",
          filter: `thread_id=eq.${threadId}`,
        },
        () => {
          mutateRef.current();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId]);

  /** Send a user message WITHOUT triggering mentor responses */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!threadId) return;
      await addUserMessage({ thread_id: threadId, content });
      await mutate();
    },
    [threadId, mutate]
  );

  /** Trigger mentors to respond. Pass latest user content for @mention parsing. */
  const triggerMentors = useCallback(
    async (latestUserContent?: string) => {
      if (!threadId) return;
      await triggerMentorResponses(threadId, latestUserContent);
    },
    [threadId]
  );

  return {
    thread: data ?? null,
    messages: data?.messages ?? [],
    participants: data?.participants ?? [],
    error,
    isLoading,
    mutate,
    sendMessage,
    triggerMentors,
  };
}
