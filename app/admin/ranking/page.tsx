import { createServerSupabase } from "@/lib/supabase/server";
import { getProgramaMonitorForPage } from "@/lib/programa/page-helper";
import { isProgramaFinalizado } from "@/lib/programa/context";
import { RankingClient } from "./ranking-client";
import { RankingTable, type RankingTableRow } from "./ranking-table";
import { mediaNotasTotaisProjeto, qtdNotasEDispersaoParPrincipal } from "@/lib/services/nota";
import type { ResultadoStatusFinal } from "@/lib/types/database";

export default async function RankingPage() {
  const supabase = await createServerSupabase();
  const programa = await getProgramaMonitorForPage(supabase);
  const cfg = { total_vagas: programa.total_vagas };
  const { data: rows } = await supabase
    .from("resultados")
    .select("*, projetos(*)")
    .eq("programa_id", programa.id)
    .order("posicao_geral", { ascending: true, nullsFirst: false });

  const projetoIds = (rows ?? []).map((r) => r.projeto_id).filter(Boolean);
  const statsByProjetoId = new Map<string, { qtdNotas: number; cvPct: number | null; mediaNotaFinal: number | null }>();

  if (projetoIds.length > 0) {
    const { data: atribs } = await supabase
      .from("atribuicoes")
      .select("id, projeto_id, status, ordem")
      .in("projeto_id", projetoIds);

    const atribsByProjeto = new Map<string, { id: string; ordem: number; status: string }[]>();
    for (const a of atribs ?? []) {
      const pid = a.projeto_id as string;
      const arr = atribsByProjeto.get(pid) ?? [];
      arr.push({ id: a.id, ordem: a.ordem, status: a.status });
      atribsByProjeto.set(pid, arr);
    }

    const atribuicaoIds = (atribs ?? []).map((a) => a.id);
    const notaByAtribId = new Map<string, number>();
    if (atribuicaoIds.length > 0) {
      const { data: avs } = await supabase
        .from("avaliacoes")
        .select("atribuicao_id, nota_total_ponderada")
        .in("atribuicao_id", atribuicaoIds);
      for (const av of avs ?? []) {
        notaByAtribId.set(av.atribuicao_id, Number(av.nota_total_ponderada));
      }
    }

    for (const pid of projetoIds) {
      const list = atribsByProjeto.get(pid) ?? [];
      const stats = qtdNotasEDispersaoParPrincipal(list, notaByAtribId);
      const { media: mediaNotaFinal } = mediaNotasTotaisProjeto(list, notaByAtribId);
      statsByProjetoId.set(pid, { ...stats, mediaNotaFinal });
    }
  }

  const tableRows: RankingTableRow[] = (rows ?? []).map((r) => {
    const p = r.projetos as { nome_projeto: string; nome_responsavel: string; municipio: string };
    const stats = statsByProjetoId.get(r.projeto_id) ?? {
      qtdNotas: 0,
      cvPct: null,
      mediaNotaFinal: null,
    };
    return {
      id: r.id,
      projeto_id: r.projeto_id,
      posicao_geral: r.posicao_geral,
      nota_final: Number(r.nota_final),
      status_final: r.status_final as ResultadoStatusFinal,
      enquadramento_cota: r.enquadramento_cota,
      projeto: {
        nome_projeto: p?.nome_projeto ?? "",
        nome_responsavel: p?.nome_responsavel ?? "",
        municipio: p?.municipio ?? "",
      },
      stats,
    };
  });

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/70 bg-card/80 p-5 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Ranking</h1>
        <p className="text-sm text-muted-foreground">Gere o ranking numérico, defina vagas e aplique a cota do Sertão.</p>
      </div>
      <RankingClient totalVagasInicial={cfg.total_vagas} readonly={isProgramaFinalizado(programa)} />
      <RankingTable rows={tableRows} />
    </div>
  );
}
