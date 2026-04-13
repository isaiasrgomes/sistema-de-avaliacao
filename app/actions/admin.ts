"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { importarCSVProjetos } from "@/lib/services/csv-import";
import { logAuditoria } from "@/lib/services/audit";
import { calcularResultados, aplicarCota } from "@/lib/services/ranking";
import { gerarAtribuicoesAutomaticas } from "@/lib/services/atribuicoes-service";
import { revalidatePath } from "next/cache";

async function requireCoord() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "COORDENADOR") throw new Error("Acesso negado");
  return { supabase, user };
}

export async function actionImportarCSV(formData: FormData) {
  const { supabase, user } = await requireCoord();
  const text = formData.get("csv") as string;
  if (!text) throw new Error("CSV vazio");
  const res = await importarCSVProjetos(supabase, text);
  await logAuditoria(supabase, {
    usuario_id: user.id,
    acao: "IMPORTAR_CSV",
    entidade: "projetos",
    detalhes: res as unknown as Record<string, unknown>,
  });
  revalidatePath("/admin/projetos");
  revalidatePath("/admin");
  return res;
}

export async function actionDesclassificar(projetoId: string, motivo: string) {
  const { supabase, user } = await requireCoord();
  await supabase
    .from("projetos")
    .update({ status: "DESCLASSIFICADO", motivo_desclassificacao: motivo })
    .eq("id", projetoId);

  const { data: pend } = await supabase
    .from("atribuicoes")
    .select("id")
    .eq("projeto_id", projetoId)
    .in("status", ["PENDENTE", "EM_ANDAMENTO"]);
  for (const p of pend ?? []) {
    await supabase.from("atribuicoes").delete().eq("id", p.id);
  }

  await logAuditoria(supabase, {
    usuario_id: user.id,
    acao: "DESCLASSIFICAR",
    entidade: "projetos",
    entidade_id: projetoId,
    detalhes: { motivo },
  });
  revalidatePath("/admin/projetos");
}

export async function actionReclassificar(projetoId: string) {
  const { supabase, user } = await requireCoord();
  await supabase
    .from("projetos")
    .update({ status: "INSCRITO", motivo_desclassificacao: null })
    .eq("id", projetoId);
  await logAuditoria(supabase, {
    usuario_id: user.id,
    acao: "RECLASSIFICAR",
    entidade: "projetos",
    entidade_id: projetoId,
  });
  revalidatePath("/admin/projetos");
}

export async function actionSalvarVagas(totalVagas: number) {
  const { supabase, user } = await requireCoord();
  await supabase.from("app_config").update({ total_vagas: totalVagas, atualizado_em: new Date().toISOString() }).eq("id", 1);
  await logAuditoria(supabase, {
    usuario_id: user.id,
    acao: "CONFIG_VAGAS",
    entidade: "app_config",
    detalhes: { total_vagas: totalVagas },
  });
  revalidatePath("/admin/ranking");
}

export async function actionGerarRanking() {
  const { supabase, user } = await requireCoord();
  const r = await calcularResultados(supabase);
  await logAuditoria(supabase, {
    usuario_id: user.id,
    acao: "GERAR_RANKING",
    entidade: "resultados",
    detalhes: r as unknown as Record<string, unknown>,
  });
  revalidatePath("/admin/ranking");
  return r;
}

export async function actionAplicarCota() {
  const { supabase, user } = await requireCoord();
  const { data: cfg } = await supabase.from("app_config").select("total_vagas").eq("id", 1).single();
  const n = cfg?.total_vagas ?? 25;
  const r = await aplicarCota(supabase, n);
  await logAuditoria(supabase, {
    usuario_id: user.id,
    acao: "APLICAR_COTA",
    entidade: "resultados",
    detalhes: r as unknown as Record<string, unknown>,
  });
  revalidatePath("/admin/ranking");
  return r;
}

export async function actionResultadoFinal() {
  const { supabase, user } = await requireCoord();
  await supabase
    .from("app_config")
    .update({
      fase_publicacao: "FINAL",
      resultado_final_liberado: true,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", 1);
  await logAuditoria(supabase, {
    usuario_id: user.id,
    acao: "RESULTADO_FINAL_LIBERADO",
    entidade: "app_config",
  });
  revalidatePath("/resultado");
  revalidatePath("/admin/ranking");
}

export async function actionAtribuicaoManual(projetoId: string, a1: string, a2: string) {
  const { supabase, user } = await requireCoord();
  const { data: concluidas } = await supabase
    .from("atribuicoes")
    .select("id")
    .eq("projeto_id", projetoId)
    .eq("status", "CONCLUIDA");
  if (concluidas?.length) {
    throw new Error("Projeto já possui avaliação concluída. Reatribuição bloqueada.");
  }
  await supabase.from("atribuicoes").delete().eq("projeto_id", projetoId);
  await supabase.from("atribuicoes").insert([
    { projeto_id: projetoId, avaliador_id: a1, ordem: 1, status: "PENDENTE" },
    { projeto_id: projetoId, avaliador_id: a2, ordem: 2, status: "PENDENTE" },
  ]);
  await supabase.from("projetos").update({ status: "EM_AVALIACAO" }).eq("id", projetoId);
  await logAuditoria(supabase, {
    usuario_id: user.id,
    acao: "ATRIBUICAO_MANUAL",
    entidade: "atribuicoes",
    entidade_id: projetoId,
    detalhes: { a1, a2 },
  });
  revalidatePath("/admin/atribuicoes");
}

export async function actionAtribuirTerceiro(projetoId: string, avaliadorId: string) {
  const { supabase, user } = await requireCoord();
  const { data: p } = await supabase.from("projetos").select("status").eq("id", projetoId).single();
  if (p?.status !== "AGUARDANDO_3O_AVALIADOR") {
    throw new Error("Projeto não está em AGUARDANDO_3O_AVALIADOR.");
  }
  const { data: ex } = await supabase.from("atribuicoes").select("id").eq("projeto_id", projetoId).eq("ordem", 3).maybeSingle();
  if (ex) throw new Error("3ª atribuição já existe.");
  await supabase.from("atribuicoes").insert({
    projeto_id: projetoId,
    avaliador_id: avaliadorId,
    ordem: 3,
    status: "PENDENTE",
  });
  await supabase.from("projetos").update({ status: "EM_AVALIACAO" }).eq("id", projetoId);
  await logAuditoria(supabase, {
    usuario_id: user.id,
    acao: "ATRIBUICAO_TERCEIRO",
    entidade: "atribuicoes",
    entidade_id: projetoId,
    detalhes: { avaliadorId },
  });
  revalidatePath("/admin/atribuicoes");
}

export async function actionAtribuicaoAuto(projetoIds: string[]) {
  const { supabase, user } = await requireCoord();
  const r = await gerarAtribuicoesAutomaticas(supabase, projetoIds);
  await logAuditoria(supabase, {
    usuario_id: user.id,
    acao: "ATRIBUICAO_AUTO",
    entidade: "atribuicoes",
    detalhes: r as unknown as Record<string, unknown>,
  });
  revalidatePath("/admin/atribuicoes");
  return r;
}

export async function actionRegistrarRecurso(
  projetoId: string,
  descricao: string,
  parecer: string | null,
  deferido: boolean,
  alteracaoNota: boolean,
  notaAjustada: number | null
) {
  const { supabase, user } = await requireCoord();
  await supabase.from("recursos").insert({
    projeto_id: projetoId,
    descricao,
    parecer_coordenador: parecer,
    deferido,
    alteracao_nota: alteracaoNota,
    nota_ajustada: notaAjustada,
  });
  if (deferido && alteracaoNota && notaAjustada != null) {
    await supabase.from("resultados").update({ nota_final: notaAjustada }).eq("projeto_id", projetoId);
    await logAuditoria(supabase, {
      usuario_id: user.id,
      acao: "ALTERACAO_NOTA_MANUAL",
      entidade: "resultados",
      entidade_id: projetoId,
      detalhes: { nota_ajustada: notaAjustada },
    });
  }
  await logAuditoria(supabase, {
    usuario_id: user.id,
    acao: "RECURSO_REGISTRADO",
    entidade: "recursos",
    entidade_id: projetoId,
  });
  revalidatePath("/admin/recursos");
}

export async function actionRecalcularRanking() {
  return actionGerarRanking();
}
