import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createServerSupabase } from "@/lib/supabase/server";
import { BackNav } from "@/components/back-nav";
import { PageContainer } from "@/components/layout/page-container";
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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Link href="/avaliador" prefetch className="min-w-0 shrink">
              <SertaoMakerBrand variant="compact" className="gap-2.5" />
            </Link>
            <span className="hidden h-6 w-px bg-border sm:block" aria-hidden />
            <span className="hidden text-sm font-medium text-muted-foreground sm:inline">Área do avaliador</span>
          </div>
          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
            <span className="rounded-lg bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground">
              {displayName}
            </span>
            <Link
              href="/avaliador/manual"
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Manual
            </Link>
            <form action="/auth/signout?next=/" method="post">
              <Button variant="outline" size="sm" type="submit">
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="px-4 py-5 sm:px-6 lg:px-8">
        <PageContainer>
          <BackNav sectionRoot="/avaliador" primaryLabel="Minhas avaliações" />
          <div className="animate-fade-in">{children}</div>
        </PageContainer>
      </main>
    </div>
  );
}
