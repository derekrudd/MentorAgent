import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const headerUser = {
    full_name: profile?.full_name ?? user.user_metadata?.full_name ?? "",
    email: profile?.email ?? user.email ?? "",
  };

  return (
    <div className="flex h-screen flex-col">
      <Header user={headerUser} />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
