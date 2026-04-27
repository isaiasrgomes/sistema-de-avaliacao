import { createServerSupabase } from "@/lib/supabase/server";
import { ProjetosClient } from "./projetos-client";
import { coeficienteVariacaoDoisValores } from "@/lib/services/nota";

export default async function AdminProjetosPage() {
  const supabase = await createServerSupabase();
  const { data: projetos } = await supabase.from("projetos").select("*").order("timestamp_submissao", { ascending: false });

  const projetoIds = (projetos ?? []).map((p) => p.id).filter(Boolean);
  const terceiraByProjetoId = new Map<string, { diffNotas: number | null; precisaTerceiro: boolean | null }>();

  if (projetoIds.length > 0) {
    const { data: atribs } = await supabase
      .from("atribuicoes")
      .select("id, projeto_id, ordem, status")
      .in("projeto_id", projetoIds)
      .order("ordem", { ascending: true });

    const concluidas = (atribs ?? []).filter((a) => a.status === "CONCLUIDA");
    const atribuicaoIds = concluidas.map((a) => a.id);
    const atribuicaoMeta = new Map<string, { projeto_id: string; ordem: number }>();
    for (const a of concluidas) atribuicaoMeta.set(a.id, { projeto_id: a.projeto_id, ordem: a.ordem });

    if (atribuicaoIds.length > 0) {
      const { data: avs } = await supabase
        .from("avaliacoes")
        .select("atribuicao_id, nota_total_ponderada")
        .in("atribuicao_id", atribuicaoIds);

      const totalsByProjeto = new Map<string, { ordem: number; total: number }[]>();
      for (const av of avs ?? []) {
        const meta = atribuicaoMeta.get(av.atribuicao_id);
        if (!meta) continue;
        const arr = totalsByProjeto.get(meta.projeto_id) ?? [];
        arr.push({ ordem: meta.ordem, total: Number(av.nota_total_ponderada) });
        totalsByProjeto.set(meta.projeto_id, arr);
      }

      for (const pid of projetoIds) {
        const orderedTotals = (totalsByProjeto.get(pid) ?? []).sort((a, b) => a.ordem - b.ordem).map((x) => x.total);
        if (orderedTotals.length < 2) {
          terceiraByProjetoId.set(pid, { diffNotas: null, precisaTerceiro: null });
          continue;
        }
        if (orderedTotals.length >= 3) {
          terceiraByProjetoId.set(pid, { diffNotas: null, precisaTerceiro: false });
          continue;
        }

        const a = orderedTotals[0];
        const b = orderedTotals[1];
        const cv = coeficienteVariacaoDoisValores(a, b);
        terceiraByProjetoId.set(pid, { diffNotas: Math.abs(a - b), precisaTerceiro: cv >= 30 });
      }
    }
  }

  const projetosEnriquecidos = (projetos ?? []).map((p) => ({
    ...p,
    diff_notas_para_3o: terceiraByProjetoId.get(p.id)?.diffNotas ?? null,
    precisa_3o_avaliador: terceiraByProjetoId.get(p.id)?.precisaTerceiro ?? null,
  }));

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/70 bg-card/80 p-5 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Projetos - triagem</h1>
        <p className="text-sm text-muted-foreground">Filtre, desclassifique ou reclassifique inscricoes.</p>
      </div>
      <ProjetosClient initial={projetosEnriquecidos} />
    </div>
  );
}
