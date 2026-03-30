"use client";

import { useState } from "react";
import { useMentors } from "@/lib/hooks/use-mentors";
import { useThreads } from "@/lib/hooks/use-mentor-threads";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Users } from "lucide-react";

const GRADIENT_COLORS = [
  "from-violet-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-blue-600",
  "from-fuchsia-500 to-purple-600",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface CreateThreadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (threadId: string) => void;
}

export function CreateThreadDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateThreadDialogProps) {
  const { data: mentors, isLoading: mentorsLoading } = useMentors();
  const { create } = useThreads();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  function toggleMentor(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((s) => s !== id);
      }
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  async function handleCreate() {
    if (selectedIds.length < 2 || isCreating) return;
    setIsCreating(true);
    try {
      const thread = await create({
        title: title.trim() || "New Thread",
        mentor_ids: selectedIds,
      });
      setSelectedIds([]);
      setTitle("");
      onOpenChange(false);
      onCreated(thread.id);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Start a MentorThread
          </DialogTitle>
          <DialogDescription>
            Select 2-3 mentors for a collaborative conversation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
              Thread title (optional)
            </label>
            <Input
              placeholder="e.g. Career Strategy Discussion"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
              Select mentors ({selectedIds.length}/3)
            </label>
            {mentorsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {mentors?.map((mentor, i) => {
                  const isSelected = selectedIds.includes(mentor.id);
                  const gradient = GRADIENT_COLORS[i % GRADIENT_COLORS.length];

                  return (
                    <button
                      key={mentor.id}
                      type="button"
                      onClick={() => toggleMentor(mentor.id)}
                      className={`flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border bg-card hover:border-muted-foreground/30"
                      }`}
                    >
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-b ${gradient}`}
                      >
                        <span className="text-sm font-semibold text-white">
                          {getInitials(mentor.name)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {mentor.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {mentor.role}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleCreate}
            disabled={selectedIds.length < 2 || isCreating}
            className="gap-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Thread"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
