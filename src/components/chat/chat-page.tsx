"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useConversations, useConversation } from "@/lib/hooks/use-chat";
import { sendMessage } from "@/lib/actions/chat";
import { ConversationList } from "./conversation-list";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { PanelLeft, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Mentor } from "@/types/database";

interface ChatPageProps {
  mentor: Mentor;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ChatPage({ mentor }: ChatPageProps) {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);
  const [prefillText, setPrefillText] = useState<string | null>(null);
  const creatingRef = useRef(false);

  const {
    conversations,
    create: createConv,
    update: updateConv,
    remove: removeConv,
  } = useConversations(mentor.id);

  const { messages, mutate: mutateConversation } = useConversation(
    activeConversationId,
    isSending
  );

  // Auto-remove empty conversations when navigating away
  const prevActiveIdRef = useRef<string | null>(null);
  useEffect(() => {
    const prevId = prevActiveIdRef.current;
    prevActiveIdRef.current = activeConversationId;

    if (prevId && prevId !== activeConversationId) {
      const prevConv = conversations.find((c) => c.id === prevId);
      if (prevConv && (!prevConv.messages || prevConv.messages.length === 0)) {
        // Check if it actually has no messages by looking at what we know
        // Only remove if it's a brand new empty conversation
        const hasMessages = conversations.find((c) => c.id === prevId)?.messages?.length;
        if (!hasMessages) {
          removeConv(prevId);
        }
      }
    }
  }, [activeConversationId, conversations, removeConv]);

  const handleNewChat = useCallback(async () => {
    if (creatingRef.current) return;
    creatingRef.current = true;
    try {
      const conv = await createConv();
      setActiveConversationId(conv.id);
      setSidebarOpen(false);
    } finally {
      creatingRef.current = false;
    }
  }, [createConv]);

  const ensureConversation = useCallback(async (): Promise<string> => {
    if (activeConversationId) return activeConversationId;
    if (creatingRef.current) {
      // Wait for the current creation to finish
      return new Promise((resolve) => {
        const check = setInterval(() => {
          if (!creatingRef.current) {
            clearInterval(check);
            // At this point activeConversationId might be set
            // but we can't read it here. Return will handle via caller.
          }
        }, 50);
        setTimeout(() => {
          clearInterval(check);
          resolve("");
        }, 5000);
      });
    }
    creatingRef.current = true;
    try {
      const conv = await createConv();
      setActiveConversationId(conv.id);
      return conv.id;
    } finally {
      creatingRef.current = false;
    }
  }, [activeConversationId, createConv]);

  const handleSend = useCallback(
    async (content: string) => {
      const convId = await ensureConversation();
      if (!convId) return;

      setPendingUserMessage(content);
      setIsSending(true);
      try {
        await sendMessage({ conversation_id: convId, content });
        await mutateConversation();
      } finally {
        setPendingUserMessage(null);
        setIsSending(false);
      }
    },
    [ensureConversation, mutateConversation]
  );

  const handleRename = useCallback(
    (id: string, title: string) => {
      updateConv(id, title);
    },
    [updateConv]
  );

  const handleDelete = useCallback(
    (id: string) => {
      removeConv(id);
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
    },
    [removeConv, activeConversationId]
  );

  const handleSkillClick = useCallback((skillName: string) => {
    setPrefillText(`Tell me about ${skillName}`);
  }, []);

  const handlePrefillConsumed = useCallback(() => {
    setPrefillText(null);
  }, []);

  const sidebar = (
    <ConversationList
      conversations={conversations}
      activeId={activeConversationId}
      onSelect={(id) => {
        setActiveConversationId(id);
        setSidebarOpen(false);
      }}
      onCreate={handleNewChat}
      onRename={handleRename}
      onDelete={handleDelete}
    />
  );

  return (
    <div className="flex h-full flex-col">
      {/* Chat header */}
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-card px-3">
        {/* Mobile sidebar trigger */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger>
            <Button variant="ghost" size="icon-sm" className="md:hidden">
              <PanelLeft className="h-4 w-4" />
              <span className="sr-only">Open conversations</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Conversations</SheetTitle>
            {sidebar}
          </SheetContent>
        </Sheet>

        <Link
          href="/dashboard"
          className="hidden text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <Avatar size="sm">
          <AvatarFallback className="bg-primary/10 text-xs text-primary">
            {getInitials(mentor.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-base font-medium text-foreground">{mentor.name}</p>
          <p className="truncate text-sm text-muted-foreground">{mentor.role}</p>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden w-60 shrink-0 border-r border-border bg-card md:block lg:w-72">
          {sidebar}
        </div>

        {/* Chat area */}
        <div className="flex flex-1 flex-col">
          <MessageList
            messages={messages}
            mentor={mentor}
            pendingUserMessage={pendingUserMessage}
            isSending={isSending}
            onSkillClick={handleSkillClick}
          />
          <ChatInput
            onSend={handleSend}
            disabled={isSending}
            placeholder={`Message ${mentor.name}...`}
            prefillText={prefillText}
            onPrefillConsumed={handlePrefillConsumed}
          />
        </div>
      </div>
    </div>
  );
}
