"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SendHorizontal, Loader2 } from "lucide-react";

interface Participant {
  mentor_id: string;
  mentor?: { id: string; name: string };
}

interface ThreadChatInputProps {
  onSend: (content: string) => void;
  disabled: boolean;
  participants: Participant[];
  placeholder?: string;
}

export function ThreadChatInput({
  onSend,
  disabled,
  participants,
  placeholder = "Type a message...",
}: ThreadChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  const mentorNames = participants
    .map((p) => p.mentor?.name)
    .filter(Boolean) as string[];

  const filteredMentors = mentorNames.filter((name) =>
    name.toLowerCase().startsWith(mentionFilter.toLowerCase())
  );

  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, []);

  function handleSend() {
    const ta = textareaRef.current;
    if (!ta) return;
    const content = ta.value.trim();
    if (!content || disabled) return;
    onSend(content);
    ta.value = "";
    ta.style.height = "auto";
    setShowMentions(false);
  }

  function insertMention(name: string) {
    const ta = textareaRef.current;
    if (!ta) return;

    const value = ta.value;
    const before = value.slice(0, mentionStartIndex);
    const after = value.slice(ta.selectionStart);
    const newValue = `${before}@${name} ${after}`;
    ta.value = newValue;

    const cursorPos = before.length + name.length + 2; // +2 for @ and space
    ta.selectionStart = cursorPos;
    ta.selectionEnd = cursorPos;

    setShowMentions(false);
    setMentionFilter("");
    setMentionStartIndex(-1);
    adjustHeight();
    ta.focus();
  }

  function handleInput() {
    adjustHeight();

    const ta = textareaRef.current;
    if (!ta) return;

    const value = ta.value;
    const cursorPos = ta.selectionStart;

    // Look backwards from cursor for an @ at a word boundary
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex >= 0) {
      // Check that @ is at start or preceded by whitespace
      const charBefore = lastAtIndex > 0 ? value[lastAtIndex - 1] : " ";
      if (charBefore === " " || charBefore === "\n" || lastAtIndex === 0) {
        const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
        // Only show if text after @ has no spaces (still typing the name)
        if (!textAfterAt.includes(" ")) {
          setMentionStartIndex(lastAtIndex);
          setMentionFilter(textAfterAt);
          setShowMentions(true);
          setSelectedMentionIndex(0);
          return;
        }
      }
    }

    setShowMentions(false);
    setMentionFilter("");
    setMentionStartIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (showMentions && filteredMentors.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedMentionIndex((prev) =>
          prev < filteredMentors.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedMentionIndex((prev) =>
          prev > 0 ? prev - 1 : filteredMentors.length - 1
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filteredMentors[selectedMentionIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowMentions(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Close mention popover on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowMentions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="border-t border-border bg-card p-3">
      <div className="relative">
        {/* Mention popover */}
        {showMentions && filteredMentors.length > 0 && (
          <div
            ref={popoverRef}
            className="absolute bottom-full left-0 z-10 mb-1 w-48 overflow-hidden rounded-lg border border-border bg-popover shadow-lg"
          >
            {filteredMentors.map((name, i) => (
              <button
                key={name}
                type="button"
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                  i === selectedMentionIndex
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:bg-accent/50"
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(name);
                }}
                onMouseEnter={() => setSelectedMentionIndex(i)}
              >
                <span className="text-muted-foreground">@</span>
                {name}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            className="min-h-[40px] max-h-[200px] flex-1 resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={placeholder}
            disabled={disabled}
            onInput={handleInput}
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
          </Button>
        </div>
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground/60">
        Tip: Use @name to direct your message to a specific mentor
      </p>
    </div>
  );
}
