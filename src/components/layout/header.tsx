"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { GraduationCap, LogOut } from "lucide-react";

interface HeaderProps {
  user: {
    full_name: string;
    email: string;
  };
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-border bg-card px-4 md:px-6">
      <Link href="/dashboard" className="flex items-center gap-2 text-foreground">
        <GraduationCap className="h-5 w-5 text-primary" />
        <span className="text-base font-semibold tracking-tight">MentorAgent</span>
      </Link>

      <nav className="ml-6 flex items-center gap-4">
        <Link
          href="/dashboard"
          className="text-base text-muted-foreground transition-colors hover:text-foreground"
        >
          Dashboard
        </Link>
        <Link
          href="/threads"
          className="text-base text-muted-foreground transition-colors hover:text-foreground"
        >
          Threads
        </Link>
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <span className="hidden text-base text-muted-foreground sm:inline">
          {user.full_name || user.email}
        </span>
        <Button variant="ghost" size="icon-sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Log out</span>
        </Button>
      </div>
    </header>
  );
}
