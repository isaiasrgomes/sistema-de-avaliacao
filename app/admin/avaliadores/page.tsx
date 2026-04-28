import { createServerSupabase } from "@/lib/supabase/server";
import { AvaliadoresClient } from "./avaliadores-client";

export default async function AvaliadoresPage() {
  const supabase = await createServerSupabase();
  const { data: avaliadores } = await supabase.from("avaliadores").select("*").order("nome");

  const { data: pendentes } = await supabase
    .from("profiles")
    .select("id, nome, email, criado_em")
    .eq("role", "AVALIADOR")
    .eq("cadastro_aprovado", false)
    .eq("cadastro_recusado", false)
    .order("criado_em", { ascending: false });

  const comCarga = await Promise.all(
    (avaliadores ?? []).map(async (a) => {
      const [{ count }, { count: countFinalizadas }] = await Promise.all([
        supabase
          .from("atribuicoes")
          .select("*", { count: "exact", head: true })
          .eq("avaliador_id", a.id)
          .in("status", ["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA"]),
        supabase.from("atribuicoes").select("*", { count: "exact", head: true }).eq("avaliador_id", a.id).eq("status", "CONCLUIDA"),
      ]);
      return { ...a, carga: count ?? 0, avaliacoes_finalizadas: countFinalizadas ?? 0 };
    })
  );
  const integrations = {
    supabaseAdmin: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    resend: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/70 bg-card/80 p-5 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Avaliadores</h1>
        <p className="text-sm text-muted-foreground">
          Avaliadores podem criar conta com e-mail e senha; o coordenador aprova abaixo antes de liberar o acesso. O
          e-mail do cadastro deve ser o mesmo usado no login. Também é possível cadastrar manualmente (sem conta ainda).
        </p>
      </div>
      <AvaliadoresClient initial={comCarga} cadastrosPendentes={pendentes ?? []} integrations={integrations} />
    </div>
  );
}
