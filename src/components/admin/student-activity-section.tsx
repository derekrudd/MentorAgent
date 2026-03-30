"use client";

import { useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { useGsapStagger } from "@/lib/animations/use-gsap";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  STUDENT_ACTIVITY,
  type EngagementLevel,
} from "@/lib/data/admin-mock-data";

const LEVEL_STYLES: Record<EngagementLevel, { variant: "default" | "secondary" | "outline"; label: string }> = {
  high: { variant: "default", label: "High" },
  medium: { variant: "secondary", label: "Medium" },
  low: { variant: "outline", label: "Low" },
};

export function StudentActivitySection() {
  const tableRef = useRef<HTMLTableSectionElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  useGsapStagger(tableRef, "tr", { staggerEach: 0.05 });
  useGsapStagger(cardsRef, "> div", { staggerEach: 0.06 });

  return (
    <div>
      <h2 className="mb-4 text-base font-semibold text-foreground">
        Student Activity
      </h2>

      {/* Desktop table */}
      <Card className="hidden overflow-hidden md:block">
        <ScrollArea className="w-full">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Student</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Conversations</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Messages</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Favorite Mentor</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Last Active</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Engagement</th>
              </tr>
            </thead>
            <tbody ref={tableRef}>
              {STUDENT_ACTIVITY.map((student) => {
                const level = LEVEL_STYLES[student.engagementLevel];
                return (
                  <tr
                    key={student.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar size="sm">
                          <AvatarFallback className="bg-primary/10 text-xs text-primary">
                            {student.avatarInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground">{student.totalConversations}</td>
                    <td className="px-4 py-3 text-foreground">{student.totalMessages}</td>
                    <td className="px-4 py-3 text-foreground">{student.favoriteMentor}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDistanceToNow(new Date(student.lastActive), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={level.variant}>{level.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ScrollArea>
      </Card>

      {/* Mobile cards */}
      <div ref={cardsRef} className="flex flex-col gap-3 md:hidden">
        {STUDENT_ACTIVITY.map((student) => {
          const level = LEVEL_STYLES[student.engagementLevel];
          return (
            <Card key={student.id} className="flex items-center gap-3 p-3">
              <Avatar size="sm">
                <AvatarFallback className="bg-primary/10 text-xs text-primary">
                  {student.avatarInitials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-foreground">
                    {student.name}
                  </p>
                  <Badge variant={level.variant} className="shrink-0">
                    {level.label}
                  </Badge>
                </div>
                <div className="mt-0.5 flex gap-3 text-xs text-muted-foreground">
                  <span>{student.totalConversations} chats</span>
                  <span>{student.totalMessages} msgs</span>
                  <span>{student.favoriteMentor}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
