import { createServerSupabase } from "@/lib/supabase/server";
import { ProjetosClient } from "./projetos-client";

function normalizeId(value: unknown): string {
  return String(value ?? "").trim();
}

export default async function AdminProjetosPage() {
  const supabase = await createServerSupabase();
  const { data: projetos } = await supabase.from("projetos").select("*").order("nome_projeto", { ascending: true });
  const { data: avaliadores } = await supabase.from("avaliadores").select("id, nome, email").eq("ativo", true).order("nome");

  const projetoIds = (projetos ?? []).map((p) => p.id).filter(Boolean);
  const qtdAvaliadoresByProjetoId = new Map<string, number>();
  const qtdAvaliacoesConcluidasByProjetoId = new Map<string, number>();
  const atribuicoesByAvaliador = new Map<string, number>();
  const finalizadasByAvaliador = new Map<string, number>();
  const avaliadoresByProjetoId = new Map<string, Set<string>>();

  if (projetoIds.length > 0) {
    const { data: atribs } = await supabase
      .from("atribuicoes")
      .select("id, projeto_id, avaliador_id, status")
      .in("projeto_id", projetoIds)
      .order("id", { ascending: true });

    for (const a of atribs ?? []) {
      const projetoId = normalizeId(a.projeto_id);
      const avaliadorId = normalizeId(a.avaliador_id);
      if (!projetoId || !avaliadorId) continue;

      const atual = qtdAvaliadoresByProjetoId.get(projetoId) ?? 0;
      qtdAvaliadoresByProjetoId.set(projetoId, atual + 1);
      const idsProjeto = avaliadoresByProjetoId.get(projetoId) ?? new Set<string>();
      idsProjeto.add(avaliadorId);
      avaliadoresByProjetoId.set(projetoId, idsProjeto);

      const atualAtrib = atribuicoesByAvaliador.get(avaliadorId) ?? 0;
      atribuicoesByAvaliador.set(avaliadorId, atualAtrib + 1);

      if (a.status === "CONCLUIDA") {
        const atualFin = finalizadasByAvaliador.get(avaliadorId) ?? 0;
        finalizadasByAvaliador.set(avaliadorId, atualFin + 1);
        const atualProj = qtdAvaliacoesConcluidasByProjetoId.get(projetoId) ?? 0;
        qtdAvaliacoesConcluidasByProjetoId.set(projetoId, atualProj + 1);
      }
    }
  }

  const projetosEnriquecidos = (projetos ?? []).map((p) => {
    const pid = normalizeId(p.id);
    return {
      ...p,
      qtd_avaliadores_atual: qtdAvaliadoresByProjetoId.get(pid) ?? 0,
      qtd_avaliacoes_finalizadas: qtdAvaliacoesConcluidasByProjetoId.get(pid) ?? 0,
    };
  });
  const avaliadoresResumo = (avaliadores ?? []).map((a) => ({
    id: normalizeId(a.id),
    nome: a.nome,
    email: a.email,
    qtd_atribuidos: atribuicoesByAvaliador.get(normalizeId(a.id)) ?? 0,
    qtd_avaliados: finalizadasByAvaliador.get(normalizeId(a.id)) ?? 0,
  }));
  const avaliadoresPorProjeto = Object.fromEntries(
    Array.from(avaliadoresByProjetoId.entries()).map(([projetoId, avaliadorIds]) => [projetoId, Array.from(avaliadorIds)])
  );

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/70 bg-card/80 p-5 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Projetos - triagem</h1>
        <p className="text-sm text-muted-foreground">Filtre, desclassifique ou reclassifique inscricoes.</p>
      </div>
      <ProjetosClient
        initial={projetosEnriquecidos}
        avaliadoresResumo={avaliadoresResumo}
        avaliadoresPorProjeto={avaliadoresPorProjeto}
      />
    </div>
  );
}
