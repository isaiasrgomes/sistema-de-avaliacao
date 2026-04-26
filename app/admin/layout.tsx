import { AdminSidebar } from "@/components/admin-sidebar";
import { BackNav } from "@/components/back-nav";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("profiles").select("nome").eq("id", user.id).maybeSingle() : { data: null };

  const displayName = profile?.nome ?? user?.user_metadata?.nome ?? "Usuário";

  return (
    <div className="flex min-h-screen flex-col bg-transparent md:flex-row">
      <AdminSidebar displayName={displayName} />
      <div className="min-w-0 flex-1 overflow-auto">
        <div className="min-h-screen bg-gradient-to-b from-transparent via-background/80 to-background/95 px-4 py-5 sm:px-6 lg:px-8">
          <BackNav sectionRoot="/admin" primaryLabel="Monitoramento" />
          {children}
        </div>
      </div>
    </div>
  );
}
