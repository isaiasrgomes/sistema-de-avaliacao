import type { SupabaseClient } from "@supabase/supabase-js";
import { coeficienteVariacaoDoisValores } from "./nota";

export interface CvProjetoResult {
  cv: number | null;
  precisaTerceiro: boolean;
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
  const concluidas = atribs.filter((a) => a.status === "CONCLUIDA").sort((x, y) => x.ordem - y.ordem);
  const totais: number[] = [];
  for (const a of concluidas) {
    const n = map.get(a.id);
    if (n != null) totais.push(n);
  }

  if (totais.length < 2) return { cv: null, precisaTerceiro: false, totais };
  if (totais.length >= 3) return { cv: null, precisaTerceiro: false, totais };

  const cv = coeficienteVariacaoDoisValores(totais[0], totais[1]);
  return { cv, precisaTerceiro: cv >= 30, totais };
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
