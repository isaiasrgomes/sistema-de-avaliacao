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

  const { data: pendRows } = await supabase
    .from("atribuicoes")
    .select("id, ordem, status, projeto_id, avaliador_id, projetos(nome_projeto, nome_responsavel, municipio), avaliadores(nome, email)")
    .in("status", ["PENDENTE", "EM_ANDAMENTO"])
    .order("projeto_id");

  const pendentesSubstituicao = (pendRows ?? []).map((r) => {
    const pj = r.projetos as unknown as { nome_projeto: string; nome_responsavel: string; municipio: string } | null;
    const av = r.avaliadores as unknown as { nome: string; email: string } | null;
    return {
      id: r.id,
      ordem: r.ordem,
      status: r.status,
      projeto_id: r.projeto_id,
      nome_projeto: pj?.nome_projeto ?? "—",
      responsavel_nome: pj?.nome_responsavel ?? "—",
      municipio: pj?.municipio ?? "—",
      avaliador_nome: av?.nome ?? "—",
      avaliador_id: r.avaliador_id,
    };
  });

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/70 bg-card/80 p-5 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Atribuições</h1>
        <p className="text-sm text-muted-foreground">
          Modo manual com {nAvaliadores} avaliador(es) por proposta (definido em Programa), substituição quando ainda não
          houve envio, distribuição automática e 3º avaliador por divergência (CV).
        </p>
      </div>
      <AtribuicoesClient
        projetos={projetos ?? []}
        avaliadores={avaliadores ?? []}
        nAvaliadores={nAvaliadores}
        pendentesSubstituicao={pendentesSubstituicao}
      />
    </div>
  );
}
