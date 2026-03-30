"use client";

import { useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { SendHorizontal, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled: boolean;
  placeholder?: string;
  prefillText?: string | null;
  onPrefillConsumed?: () => void;
}

export function ChatInput({
  onSend,
  disabled,
  placeholder = "Type a message...",
  prefillText,
  onPrefillConsumed,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, []);

  useEffect(() => {
    if (prefillText && textareaRef.current) {
      textareaRef.current.value = prefillText;
      adjustHeight();
      textareaRef.current.focus();
      onPrefillConsumed?.();
    }
  }, [prefillText, onPrefillConsumed, adjustHeight]);

  function handleSend() {
    const ta = textareaRef.current;
    if (!ta) return;
    const content = ta.value.trim();
    if (!content || disabled) return;
    onSend(content);
    ta.value = "";
    ta.style.height = "auto";
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="border-t border-border bg-card p-3">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          className="min-h-[44px] max-h-[200px] flex-1 resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={placeholder}
          disabled={disabled}
          onInput={adjustHeight}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <Button
          size="icon"
          disabled={disabled}
          onClick={handleSend}
          className="shrink-0"
        >
          {disabled ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SendHorizontal className="h-4 w-4" />
          )}
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </div>
  );
}
