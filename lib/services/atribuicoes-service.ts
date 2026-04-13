import type { SupabaseClient } from "@supabase/supabase-js";

export async function temImpedimento(
  supabase: SupabaseClient,
  avaliadorId: string,
  projetoId: string
) {
  const { data } = await supabase
    .from("impedimentos")
    .select("id")
    .eq("avaliador_id", avaliadorId)
    .eq("projeto_id", projetoId)
    .maybeSingle();
  return !!data;
}

export async function contarCargaAvaliador(supabase: SupabaseClient, avaliadorId: string) {
  const { count } = await supabase
    .from("atribuicoes")
    .select("*", { count: "exact", head: true })
    .eq("avaliador_id", avaliadorId)
    .in("status", ["PENDENTE", "EM_ANDAMENTO"]);
  return count ?? 0;
}

/**
 * Distribui 2 avaliadores por projeto: menor carga primeiro, sem impedimento.
 */
export async function gerarAtribuicoesAutomaticas(
  supabase: SupabaseClient,
  projetoIds: string[]
) {
  const { data: avaliadores } = await supabase
    .from("avaliadores")
    .select("id")
    .eq("ativo", true);

  if (!avaliadores?.length) return { criadas: 0, msg: "Nenhum avaliador ativo" };

  const idsA = avaliadores.map((a) => a.id);
  let criadas = 0;

  for (const projetoId of projetoIds) {
    const { data: exist } = await supabase
      .from("atribuicoes")
      .select("id")
      .eq("projeto_id", projetoId)
      .limit(1);
    if (exist?.length) continue;

    const scored: { id: string; carga: number }[] = [];
    for (const aid of idsA) {
      if (await temImpedimento(supabase, aid, projetoId)) continue;
      const carga = await contarCargaAvaliador(supabase, aid);
      scored.push({ id: aid, carga });
    }
    scored.sort((x, y) => x.carga - y.carga);
    const pick = scored.slice(0, 2);
    if (pick.length < 2) continue;

    for (let i = 0; i < 2; i++) {
      const { error } = await supabase.from("atribuicoes").insert({
        avaliador_id: pick[i].id,
        projeto_id: projetoId,
        ordem: i + 1,
        status: "PENDENTE",
      });
      if (!error) criadas++;
    }

    await supabase.from("projetos").update({ status: "EM_AVALIACAO" }).eq("id", projetoId);
  }

  return { criadas };
}
