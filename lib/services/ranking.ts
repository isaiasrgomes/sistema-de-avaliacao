import type { SupabaseClient } from "@supabase/supabase-js";
import type { Projeto, ResultadoStatusFinal } from "@/lib/types/database";

export interface LinhaRanking {
  projeto: Projeto;
  nota_final: number;
  media_equipe: number;
  media_mercado: number;
  media_produto: number;
  media_tecnologia: number;
  qtd_avaliacoes: number;
}

function compareDesempate(a: LinhaRanking, b: LinhaRanking): number {
  if (b.nota_final !== a.nota_final) return b.nota_final - a.nota_final;
  if (b.media_equipe !== a.media_equipe) return b.media_equipe - a.media_equipe;
  if (b.media_mercado !== a.media_mercado) return b.media_mercado - a.media_mercado;
  if (b.media_produto !== a.media_produto) return b.media_produto - a.media_produto;
  if (b.media_tecnologia !== a.media_tecnologia) return b.media_tecnologia - a.media_tecnologia;
  return new Date(a.projeto.timestamp_submissao).getTime() - new Date(b.projeto.timestamp_submissao).getTime();
}

/** Projetos elegíveis: não desclassificados, com ao menos uma avaliação concluída e sem pendência de 3º */
export async function montarLinhasRanking(supabase: SupabaseClient): Promise<LinhaRanking[]> {
  const { data: projetos, error: e1 } = await supabase
    .from("projetos")
    .select("*")
    .neq("status", "DESCLASSIFICADO");

  if (e1 || !projetos) return [];

  const linhas: LinhaRanking[] = [];

  for (const p of projetos as Projeto[]) {
    const { data: atribs } = await supabase
      .from("atribuicoes")
      .select("id, status, ordem")
      .eq("projeto_id", p.id);

    if (!atribs?.length) continue;
    const { data: avs } = await supabase
      .from("avaliacoes")
      .select("*")
      .in(
        "atribuicao_id",
        atribs.map((a) => a.id)
      );

    const concluidasIds = atribs.filter((x) => x.status === "CONCLUIDA").map((x) => x.id);
    const avsConcluidas = (avs ?? []).filter((x) => concluidasIds.includes(x.atribuicao_id));

    const n = avsConcluidas.length;
    if (n < 1) continue;

    if (p.status === "AGUARDANDO_3O_AVALIADOR") continue;

    const notasEq = avsConcluidas.map((x) => x.nota_equipe);
    const notasMc = avsConcluidas.map((x) => x.nota_mercado);
    const notasPr = avsConcluidas.map((x) => x.nota_produto);
    const notasTc = avsConcluidas.map((x) => x.nota_tecnologia);
    const totais = avsConcluidas.map((x) => Number(x.nota_total_ponderada));

    const media = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;

    linhas.push({
      projeto: p,
      nota_final: media(totais),
      media_equipe: media(notasEq),
      media_mercado: media(notasMc),
      media_produto: media(notasPr),
      media_tecnologia: media(notasTc),
      qtd_avaliacoes: n,
    });
  }

  linhas.sort(compareDesempate);
  return linhas;
}

export async function calcularResultados(supabase: SupabaseClient) {
  const linhas = await montarLinhasRanking(supabase);
  let pos = 1;
  for (const l of linhas) {
    await supabase.from("resultados").upsert(
      {
        projeto_id: l.projeto.id,
        nota_final: l.nota_final,
        media_equipe: l.media_equipe,
        media_mercado: l.media_mercado,
        media_produto: l.media_produto,
        media_tecnologia: l.media_tecnologia,
        posicao_geral: pos,
        posicao_sertao: null,
        status_final: "NAO_SELECIONADO",
        enquadramento_cota: false,
        gerado_em: new Date().toISOString(),
      },
      { onConflict: "projeto_id" }
    );
    pos += 1;
  }
  return { total: linhas.length };
}

export async function aplicarCota(
  supabase: SupabaseClient,
  totalVagas: number,
  suplentesExtras = 15
) {
  const { data: res } = await supabase
    .from("resultados")
    .select("*, projetos(*)")
    .order("posicao_geral", { ascending: true, nullsFirst: false });

  if (!res?.length) return { selecionados: 0 };

  const vagasSertao = Math.ceil(totalVagas * 0.5);
  type Row = (typeof res)[0];
  const ordered: Row[] = [...res].sort(
    (a, b) => (a.posicao_geral ?? 9999) - (b.posicao_geral ?? 9999)
  );

  const selectedIds = new Set<string>();
  const cotaIds = new Set<string>();

  const sertaoLinhas = ordered.filter((r) => (r.projetos as Projeto)?.is_sertao);
  let tookSertao = 0;
  for (const row of sertaoLinhas) {
    if (tookSertao >= vagasSertao) break;
    if (selectedIds.size >= totalVagas) break;
    selectedIds.add(row.projeto_id);
    cotaIds.add(row.projeto_id);
    tookSertao++;
  }

  for (const row of ordered) {
    if (selectedIds.size >= totalVagas) break;
    if (selectedIds.has(row.projeto_id)) continue;
    selectedIds.add(row.projeto_id);
  }

  const selectedArr = Array.from(selectedIds);
  const suplentePool = ordered.filter((r) => !selectedIds.has(r.projeto_id));
  const suplentesIds = suplentePool.slice(0, suplentesExtras).map((r) => r.projeto_id);

  const sertaoOrdered = ordered.filter((r) => (r.projetos as Projeto)?.is_sertao);
  const sertaoRank = new Map<string, number>();
  let idx = 1;
  for (const r of sertaoOrdered) {
    sertaoRank.set(r.projeto_id, idx++);
  }

  for (const row of ordered) {
    const p = row.projetos as Projeto;
    let statusFinal: ResultadoStatusFinal = "NAO_SELECIONADO";
    if (selectedIds.has(row.projeto_id)) statusFinal = "SELECIONADO";
    else if (suplentesIds.includes(row.projeto_id)) statusFinal = "SUPLENTE";

    await supabase
      .from("resultados")
      .update({
        status_final: statusFinal,
        enquadramento_cota: cotaIds.has(row.projeto_id),
        posicao_sertao: p?.is_sertao ? sertaoRank.get(row.projeto_id) ?? null : null,
      })
      .eq("projeto_id", row.projeto_id);

    const st =
      statusFinal === "SELECIONADO"
        ? "SELECIONADO"
        : statusFinal === "SUPLENTE"
          ? "SUPLENTE"
          : "NAO_SELECIONADO";
    await supabase.from("projetos").update({ status: st as Projeto["status"] }).eq("id", row.projeto_id);
  }

  return { selecionados: selectedArr.length, vagasSertao };
}
