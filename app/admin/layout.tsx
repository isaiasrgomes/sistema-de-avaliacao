import { AdminSidebar } from "@/components/admin-sidebar";
import { BackNav } from "@/components/back-nav";
import { PageContainer } from "@/components/layout/page-container";
import { ProgramaMonitorBar } from "@/components/programa-monitor-bar";
import { createServerSupabase } from "@/lib/supabase/server";
import { getProgramaMonitorIdFromCookie, loadProgramaById } from "@/lib/programa/context";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("profiles").select("nome").eq("id", user.id).maybeSingle() : { data: null };

  const displayName = profile?.nome ?? user?.user_metadata?.nome ?? "Usuário";
  const programaId = await getProgramaMonitorIdFromCookie();
  const programa = programaId ? await loadProgramaById(supabase, programaId) : null;

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <AdminSidebar displayName={displayName} />
      <div className="min-w-0 flex-1">
        <div className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
          <PageContainer>
            <BackNav sectionRoot="/admin" primaryLabel="Monitoramento" />
            {programa ? <ProgramaMonitorBar programa={programa} /> : null}
            <div className="animate-fade-in">{children}</div>
          </PageContainer>
        </div>
      </div>
    </div>
  );
}
