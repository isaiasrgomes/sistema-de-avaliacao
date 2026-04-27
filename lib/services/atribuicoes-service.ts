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

export async function getAvaliadoresPorProjetoConfig(supabase: SupabaseClient): Promise<number> {
  const { data: cfg } = await supabase.from("app_config").select("avaliadores_por_projeto").eq("id", 1).maybeSingle();
  const n = cfg?.avaliadores_por_projeto ?? 2;
  return Math.min(15, Math.max(1, n));
}

/**
 * Distribui N avaliadores por projeto (N em `app_config.avaliadores_por_projeto`): menor carga primeiro, sem impedimento.
 */
export async function gerarAtribuicoesAutomaticas(
  supabase: SupabaseClient,
  projetoIds: string[]
) {
  if (!projetoIds.length) return { criadas: 0, atribuicoesCriadas: [] };
  const qtd = await getAvaliadoresPorProjetoConfig(supabase);

  const [{ data: avaliadores }, { data: projetosComAtribuicao }, { data: impedimentos }, { data: cargasRows }] = await Promise.all([
    supabase.from("avaliadores").select("id").eq("ativo", true),
    supabase.from("atribuicoes").select("projeto_id").in("projeto_id", projetoIds),
    supabase.from("impedimentos").select("avaliador_id, projeto_id").in("projeto_id", projetoIds),
    supabase
      .from("atribuicoes")
      .select("avaliador_id")
      .in("status", ["PENDENTE", "EM_ANDAMENTO"]),
  ]);

  if (!avaliadores?.length) return { criadas: 0, msg: "Nenhum avaliador ativo" };

  const idsA = avaliadores.map((a) => a.id);
  const projetosJaAtribuidos = new Set((projetosComAtribuicao ?? []).map((r) => r.projeto_id));
  const impedimentosSet = new Set((impedimentos ?? []).map((r) => `${r.avaliador_id}:${r.projeto_id}`));

  const cargaMap = new Map<string, number>();
  for (const aid of idsA) cargaMap.set(aid, 0);
  for (const row of cargasRows ?? []) {
    const aid = row.avaliador_id;
    cargaMap.set(aid, (cargaMap.get(aid) ?? 0) + 1);
  }

  const rowsParaInserir: { avaliador_id: string; projeto_id: string; ordem: number; status: "PENDENTE" }[] = [];

  for (const projetoId of projetoIds) {
    if (projetosJaAtribuidos.has(projetoId)) continue;

    const scored: { id: string; carga: number }[] = [];
    for (const aid of idsA) {
      if (impedimentosSet.has(`${aid}:${projetoId}`)) continue;
      const carga = cargaMap.get(aid) ?? 0;
      scored.push({ id: aid, carga });
    }
    scored.sort((x, y) => x.carga - y.carga);
    const pick = scored.slice(0, qtd);
    if (pick.length < qtd) continue;

    for (let i = 0; i < qtd; i++) {
      const aid = pick[i].id;
      rowsParaInserir.push({
        avaliador_id: aid,
        projeto_id: projetoId,
        ordem: i + 1,
        status: "PENDENTE",
      });
      // Atualiza a carga local para manter o balanceamento entre projetos processados.
      cargaMap.set(aid, (cargaMap.get(aid) ?? 0) + 1);
    }
  }

  if (!rowsParaInserir.length) {
    return { criadas: 0, atribuicoesCriadas: [] };
  }

  const { data: atribuicoesCriadas, error: insertError } = await supabase
    .from("atribuicoes")
    .insert(rowsParaInserir)
    .select("id, projeto_id, avaliador_id, ordem");
  if (insertError) throw new Error(insertError.message || "Falha ao criar atribuições automáticas.");

  const projetoIdsAtualizados = Array.from(new Set(rowsParaInserir.map((r) => r.projeto_id)));
  await supabase.from("projetos").update({ status: "EM_AVALIACAO" }).in("id", projetoIdsAtualizados);

  return { criadas: atribuicoesCriadas?.length ?? 0, atribuicoesCriadas: atribuicoesCriadas ?? [] };
}
