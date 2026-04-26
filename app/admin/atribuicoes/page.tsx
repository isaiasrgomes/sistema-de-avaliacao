import { createServerSupabase } from "@/lib/supabase/server";
import { AtribuicoesClient } from "./atribuicoes-client";

export default async function AtribuicoesPage() {
  const supabase = await createServerSupabase();
  const { data: cfg } = await supabase.from("app_config").select("avaliadores_por_projeto").eq("id", 1).single();
  const nAvaliadores = cfg?.avaliadores_por_projeto ?? 2;

  const { data: projetos } = await supabase
    .from("projetos")
    .select("id, nome_projeto, status")
    .in("status", ["INSCRITO", "EM_AVALIACAO", "AGUARDANDO_3O_AVALIADOR"])
    .order("nome_projeto");
  const { data: avaliadores } = await supabase.from("avaliadores").select("id, nome, email").eq("ativo", true).order("nome");

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/70 bg-card/80 p-5 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Atribuições</h1>
        <p className="text-sm text-muted-foreground">
          Modo manual com {nAvaliadores} avaliador(es) por proposta (definido em Programa), distribuição automática e
          adição de novos avaliadores quando necessário.
        </p>
      </div>
      <AtribuicoesClient
        projetos={projetos ?? []}
        avaliadores={avaliadores ?? []}
        nAvaliadores={nAvaliadores}
      />
    </div>
  );
}
