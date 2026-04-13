import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AvaliadorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b bg-card px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/avaliador" className="font-semibold text-primary">
            Área do avaliador
          </Link>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {user?.email}
          <form action="/auth/signout" method="post">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sair</Link>
            </Button>
          </form>
        </div>
      </header>
      <div className="p-6">{children}</div>
    </div>
  );
}
