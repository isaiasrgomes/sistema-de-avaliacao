import { createServerSupabase } from "@/lib/supabase/server";
import { podeEnviarAvaliacaoAgora } from "@/lib/prazo-avaliacoes";
import { ProjetosAvaliadorClient } from "./projetos-client";

export default async function AvaliadorHomePage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: av } = await supabase
    .from("avaliadores")
    .select("id")
    .ilike("email", (user?.email ?? "").trim().toLowerCase())
    .maybeSingle();

  if (!av) {
    return <p className="text-destructive">Seu e-mail não está cadastrado como avaliador. Solicite inclusão à coordenação.</p>;
  }

  const { data: atribs } = await supabase
    .from("atribuicoes")
    .select("id, status, projeto_id")
    .eq("avaliador_id", av.id)
    .order("data_atribuicao", { ascending: false });

  const projetoIds = Array.from(new Set((atribs ?? []).map((a) => a.projeto_id)));
  const { data: projetos } =
    projetoIds.length > 0
      ? await supabase
          .from("projetos")
          .select("id, nome_projeto, status, municipio, fase, nome_responsavel")
          .in("id", projetoIds)
      : { data: [] as { id: string; nome_projeto: string; status: string; municipio: string; fase: string; nome_responsavel: string }[] };

  const mapP = new Map(projetos?.map((p) => [p.id, p]));
  const rows = (atribs ?? []).map((a) => {
    const p = mapP.get(a.projeto_id);
    return {
      id: a.id,
      status: a.status,
      projeto_id: a.projeto_id,
      nome_projeto: p?.nome_projeto ?? a.projeto_id,
      projeto_status: p?.status ?? "INSCRITO",
      municipio: p?.municipio ?? "—",
      fase: p?.fase ?? "—",
      nome_responsavel: p?.nome_responsavel ?? "—",
    };
  });
  const { data: cfgPrazo } = await supabase
    .from("app_config")
    .select("avaliacoes_inicio, avaliacoes_fim, prorrogacao_fim, prorrogacao_utilizada")
    .eq("id", 1)
    .maybeSingle();
  const prazoEnvio = cfgPrazo ? podeEnviarAvaliacaoAgora(cfgPrazo) : { ok: true as const };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/70 bg-card/80 p-5 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Meus projetos</h1>
        <p className="text-sm text-muted-foreground">
          Filtre por pendentes, já avaliados ou todos para organizar melhor sua lista.
        </p>
      </div>
      <ProjetosAvaliadorClient rows={rows} prazoBloqueado={!prazoEnvio.ok} motivoBloqueioPrazo={prazoEnvio.motivo} />
    </div>
  );
}
