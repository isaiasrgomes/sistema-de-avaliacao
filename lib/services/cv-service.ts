import type { SupabaseClient } from "@supabase/supabase-js";
import { dispersaoRelativaPercentual, notasTotaisParPrincipal } from "./nota";

export interface CvProjetoResult {
  cv: number | null;
  precisaTerceiro: boolean;
  /** Notas totais do par principal (ordens 1 e 2), quando ambas existem (0–2 itens). */
  totais: number[];
}

export async function calcularCVProjeto(
  supabase: SupabaseClient,
  projetoId: string
): Promise<CvProjetoResult> {
  const { data: atribs } = await supabase
    .from("atribuicoes")
    .select("id, ordem, status")
    .eq("projeto_id", projetoId)
    .order("ordem", { ascending: true });

  if (!atribs?.length) return { cv: null, precisaTerceiro: false, totais: [] };

  const ids = atribs.map((a) => a.id);
  const { data: avaliacoes } = await supabase
    .from("avaliacoes")
    .select("atribuicao_id, nota_total_ponderada")
    .in("atribuicao_id", ids);

  const map = new Map(avaliacoes?.map((x) => [x.atribuicao_id, Number(x.nota_total_ponderada)]) ?? []);
  const linhas = atribs.map((a) => ({
    ordem: a.ordem,
    status: a.status,
    notaTotal: (() => {
      const n = map.get(a.id);
      return n != null && !Number.isNaN(n) ? n : null;
    })(),
  }));

  const totaisPar = notasTotaisParPrincipal(linhas);
  if (totaisPar.length < 2) return { cv: null, precisaTerceiro: false, totais: totaisPar };

  const cv = dispersaoRelativaPercentual(totaisPar);
  return { cv, precisaTerceiro: (cv ?? 0) >= 30, totais: totaisPar };
}

export async function verificarNecessidadeTerceiroAvaliador(
  supabase: SupabaseClient,
  projetoId: string
) {
  const { data: proj } = await supabase.from("projetos").select("status").eq("id", projetoId).single();
  if (!proj || proj.status === "DESCLASSIFICADO") return { atualizado: false };

  const { cv, precisaTerceiro, totais } = await calcularCVProjeto(supabase, projetoId);
  if (totais.length !== 2) return { atualizado: false, cv };

  if (precisaTerceiro) {
    await supabase
      .from("projetos")
      .update({ status: "AGUARDANDO_3O_AVALIADOR" })
      .eq("id", projetoId);
    return { atualizado: true, cv, status: "AGUARDANDO_3O_AVALIADOR" as const };
  }

  await supabase.from("projetos").update({ status: "AVALIADO" }).eq("id", projetoId);
  return { atualizado: true, cv, status: "AVALIADO" as const };
}
