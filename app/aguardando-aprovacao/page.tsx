import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SertaoMakerBrand } from "@/components/brand-logo";

export const dynamic = "force-dynamic";

export default async function AguardandoAprovacaoPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground">Sessão expirada.</p>
        <Button asChild>
          <Link href="/login">Entrar</Link>
        </Button>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, email, cadastro_aprovado, cadastro_recusado, role")
    .eq("id", user.id)
    .single();

  if (profile?.cadastro_recusado === true) {
    redirect("/cadastro-recusado");
  }

  if (profile?.role === "COORDENADOR" || profile?.cadastro_aprovado === true) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground">Seu cadastro já está liberado.</p>
        <Button asChild>
          <Link href={profile?.role === "COORDENADOR" ? "/admin" : "/avaliador"}>Continuar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <Card className="w-full max-w-lg border-border/70 bg-card/90 shadow-lg">
        <CardHeader className="space-y-4">
          <SertaoMakerBrand variant="full" className="justify-center" />
          <CardTitle className="text-center text-xl">Aguardando aprovação</CardTitle>
          <CardDescription className="text-center">
            Sua conta foi criada, mas ainda não foi autorizada por um coordenador. Quando isso acontecer, você poderá
            acessar a área do avaliador com o mesmo e-mail e senha.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-center text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">{profile?.nome ?? "—"}</span>
            <br />
            {profile?.email ?? user.email}
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Button variant="outline" asChild>
              <Link href="/login">Voltar ao login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
