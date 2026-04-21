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
      const { count } = await supabase
        .from("atribuicoes")
        .select("*", { count: "exact", head: true })
        .eq("avaliador_id", a.id)
        .in("status", ["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA"]);
      return { ...a, carga: count ?? 0 };
    })
  );

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/70 bg-card/80 p-5 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Avaliadores</h1>
        <p className="text-sm text-muted-foreground">
          Avaliadores podem criar conta com e-mail e senha; o coordenador aprova abaixo antes de liberar o acesso. O
          e-mail do cadastro deve ser o mesmo usado no login. Também é possível cadastrar manualmente (sem conta ainda).
        </p>
      </div>
      <AvaliadoresClient initial={comCarga} cadastrosPendentes={pendentes ?? []} />
    </div>
  );
}
