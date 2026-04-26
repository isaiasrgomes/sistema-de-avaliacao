import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createServerSupabase } from "@/lib/supabase/server";
import { BackNav } from "@/components/back-nav";
import { SertaoMakerBrand } from "@/components/brand-logo";

export const dynamic = "force-dynamic";

export default async function AvaliadorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("profiles").select("nome").eq("id", user.id).maybeSingle() : { data: null };
  const displayName = profile?.nome ?? user?.user_metadata?.nome ?? "Usuário";

  return (
    <div className="min-h-screen">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-card/90 px-4 py-3 backdrop-blur-sm">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Link href="/avaliador" prefetch className="min-w-0 shrink">
            <SertaoMakerBrand variant="compact" className="gap-2.5" />
          </Link>
          <span className="hidden h-6 w-px bg-border sm:block" aria-hidden />
          <span className="hidden text-sm font-medium text-muted-foreground sm:inline">Área do avaliador</span>
        </div>
        <div className="flex w-full flex-wrap items-center justify-end gap-2 text-sm text-muted-foreground sm:w-auto">
          <span className="rounded-md px-2 py-1 text-xs font-medium text-foreground">Bem-vindo, {displayName}</span>
          <Link href="/avaliador/manual" className="rounded-md px-2 py-1 text-xs font-medium hover:bg-muted">
            Como usar a plataforma
          </Link>
          <form action="/auth/signout?next=/" method="post">
            <Button variant="ghost" size="sm" type="submit">
              Sair
            </Button>
          </form>
        </div>
      </header>
      <div className="p-4 sm:p-6">
        <BackNav sectionRoot="/avaliador" primaryLabel="Minhas avaliações" />
        {children}
      </div>
    </div>
  );
}
