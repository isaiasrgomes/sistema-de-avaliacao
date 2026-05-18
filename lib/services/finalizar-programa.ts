import type { SupabaseClient } from "@supabase/supabase-js";
import type { Projeto } from "@/lib/types/database";
import { aplicarCota, calcularResultados, montarLinhasRanking } from "@/lib/services/ranking";
import type { Programa } from "@/lib/programa/types";

export async function finalizarPrograma(supabase: SupabaseClient, programa: Programa) {
  if (programa.status === "FINALIZADO") {
    throw new Error("Este programa já foi finalizado.");
  }

  await calcularResultados(supabase, programa.id);
  await aplicarCota(supabase, programa.total_vagas, 15, programa.id);

  const linhas = await montarLinhasRanking(supabase, programa.id);
  const { data: res } = await supabase
    .from("resultados")
    .select("projeto_id, nota_final, media_equipe, media_mercado, media_produto, media_tecnologia, posicao_geral, posicao_sertao, status_final, enquadramento_cota")
    .eq("programa_id", programa.id);

  const resMap = new Map((res ?? []).map((r) => [r.projeto_id, r]));

  const snapshotRows = linhas.map((l, idx) => {
    const r = resMap.get(l.projeto.id);
    const p = l.projeto as Projeto;
    return {
      programa_id: programa.id,
      projeto_id: p.id,
      nome_projeto: p.nome_projeto,
      nome_responsavel: p.nome_responsavel,
      municipio: p.municipio,
      is_sertao: p.is_sertao,
      nota_final: r?.nota_final ?? l.nota_final,
      media_equipe: r?.media_equipe ?? l.media_equipe,
      media_mercado: r?.media_mercado ?? l.media_mercado,
      media_produto: r?.media_produto ?? l.media_produto,
      media_tecnologia: r?.media_tecnologia ?? l.media_tecnologia,
      posicao_ranking: r?.posicao_geral ?? idx + 1,
      posicao_sertao: r?.posicao_sertao ?? null,
      status_final: r?.status_final ?? "NAO_SELECIONADO",
      enquadramento_cota: r?.enquadramento_cota ?? false,
    };
  });

  if (snapshotRows.length) {
    const { error: snapErr } = await supabase.from("programa_resultado_final").upsert(snapshotRows, {
      onConflict: "programa_id,projeto_id",
    });
    if (snapErr) throw new Error(snapErr.message);
  }

  const agora = new Date().toISOString();
  const { error: updErr } = await supabase
    .from("programas")
    .update({ status: "FINALIZADO", data_finalizacao: agora })
    .eq("id", programa.id);
  if (updErr) throw new Error(updErr.message);

  return { total: snapshotRows.length, data_finalizacao: agora };
}
