import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SertaoMakerBrand } from "@/components/brand-logo";
import { CadastroRecusadoSignOut } from "./sign-out";

export default async function CadastroRecusadoPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, cadastro_aprovado, cadastro_recusado")
    .eq("id", user.id)
    .single();

  if (profile?.role === "COORDENADOR") redirect("/admin");
  if (profile?.cadastro_aprovado === true) redirect("/avaliador");
  if (profile?.cadastro_recusado !== true) redirect("/aguardando-aprovacao");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="mb-8">
        <SertaoMakerBrand variant="full" align="center" className="justify-center" />
      </div>
      <Card className="w-full max-w-md border-border/70 bg-card/90 shadow-lg">
        <CardHeader>
          <CardTitle>Cadastro não aceito</CardTitle>
          <CardDescription>
            O coordenador não aprovou seu cadastro como avaliador. Você não terá acesso à área de avaliação neste
            edital.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Em caso de dúvida, entre em contato com a coordenação do programa pelo canal oficial do edital.
          </p>
          <CadastroRecusadoSignOut />
          <Button variant="ghost" asChild className="w-full">
            <Link href="/">Página inicial</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
