"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { importarCSVProjetos } from "@/lib/services/csv-import";
import { cadastrarOuAtualizarProjetoManual } from "@/lib/services/projeto-manual";
import { projetoManualSchema } from "@/lib/validations/projeto-manual";
import { logAuditoria } from "@/lib/services/audit";
import { calcularResultados, aplicarCota } from "@/lib/services/ranking";
import { gerarAtribuicoesAutomaticas, getAvaliadoresPorProjetoConfig, temImpedimento } from "@/lib/services/atribuicoes-service";
import {
  enviarLembretesResend,
  enviarNovaAtribuicaoResend,
  listarAvaliadoresComPendencias,
} from "@/lib/services/email-reminders";
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

async function notificarNovasAtribuicoes(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  rows: { projeto_id: string; avaliador_id: string; ordem: number; atribuicao_id?: string }[]
) {
  if (!rows.length) return;
  const projetoIds = Array.from(new Set(rows.map((r) => r.projeto_id)));
  const avaliadorIds = Array.from(new Set(rows.map((r) => r.avaliador_id)));
  const [{ data: projetos }, { data: avaliadores }, { data: cfg }] = await Promise.all([
    supabase.from("projetos").select("id, nome_projeto").in("id", projetoIds),
    supabase.from("avaliadores").select("id, nome, email").in("id", avaliadorIds),
    supabase.from("app_config").select("programa_nome").eq("id", 1).maybeSingle(),
  ]);
  const mapProj = new Map((projetos ?? []).map((p) => [p.id, p.nome_projeto]));
  const mapAv = new Map((avaliadores ?? []).map((a) => [a.id, a]));
  const base = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "") || "";

  for (const row of rows) {
    const av = mapAv.get(row.avaliador_id);
    if (!av?.email) continue;
    const projetoNome = mapProj.get(row.projeto_id) ?? row.projeto_id;
    const linkAvaliacao =
      base && row.atribuicao_id ? `${base}/avaliador/projeto/${row.projeto_id}?atribuicao=${row.atribuicao_id}` : null;
    await enviarNovaAtribuicaoResend(
      {
        email: av.email,
        nome: av.nome,
        projetoNome,
        ordem: row.ordem,
        linkAvaliacao,
      },
      { programaNome: cfg?.programa_nome }
    );
  }
}

async function avaliadorJaAvaliouProjeto(supabase: Awaited<ReturnType<typeof createServerSupabase>>, avaliadorId: string, projetoId: string) {
  const { data: atribs } = await supabase
    .from("atribuicoes")
    .select("id")
    .eq("avaliador_id", avaliadorId)
    .eq("projeto_id", projetoId);
  const ids = (atribs ?? []).map((a) => a.id);
  if (!ids.length) return false;
  const { data: av } = await supabase.from("avaliacoes").select("id").in("atribuicao_id", ids).limit(1).maybeSingle();
  return !!av;
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

export async function actionCadastrarProjetoManual(data: unknown) {
  const parsed = projetoManualSchema.safeParse(data);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors;
    throw new Error(Object.values(msg).flat().filter(Boolean).join(" ") || "Dados inválidos");
  }
  const { supabase, user } = await requireCoord();
  const res = await cadastrarOuAtualizarProjetoManual(supabase, parsed.data);
  if (!res.ok) throw new Error(res.erro);
  await logAuditoria(supabase, {
    usuario_id: user.id,
    acao: res.tipo === "inserido" ? "CADASTRO_MANUAL_PROJETO" : "ATUALIZACAO_MANUAL_PROJETO",
    entidade: "projetos",
    entidade_id: res.projetoId,
    detalhes: { nome_projeto: parsed.data.nome_projeto },
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

export async function actionAtribuicaoManual(projetoId: string, avaliadorIds: string[]) {
  const { supabase, user } = await requireCoord();
  const n = await getAvaliadoresPorProjetoConfig(supabase);
  const ids = avaliadorIds.map((x) => x.trim()).filter(Boolean);
  if (ids.length !== n) {
    throw new Error(`Selecione exatamente ${n} avaliador(es) (configuração atual do programa).`);
  }
  const uniq = new Set(ids);
  if (uniq.size !== ids.length) {
    throw new Error("Os avaliadores devem ser distintos.");
  }
  for (const aid of ids) {
    if (await temImpedimento(supabase, aid, projetoId)) {
      throw new Error("Um dos avaliadores possui impedimento declarado neste projeto.");
    }
    if (await avaliadorJaAvaliouProjeto(supabase, aid, projetoId)) {
      throw new Error("Este projeto já foi avaliado por este avaliador. Atribua outro avaliador.");
    }
  }
  const { data: concluidas } = await supabase
    .from("atribuicoes")
    .select("id")
    .eq("projeto_id", projetoId)
    .eq("status", "CONCLUIDA");
  if (concluidas?.length) {
    throw new Error("Projeto já possui avaliação concluída. Reatribuição bloqueada.");
  }
  await supabase.from("atribuicoes").delete().eq("projeto_id", projetoId);
  const rows = ids.map((avaliador_id, i) => ({
    projeto_id: projetoId,
    avaliador_id,
    ordem: i + 1,
    status: "PENDENTE" as const,
  }));
  const { data: inserted, error: insErr } = await supabase.from("atribuicoes").insert(rows).select("id, projeto_id, avaliador_id, ordem");
  if (insErr) throw new Error(insErr.message);
  await notificarNovasAtribuicoes(
    supabase,
    (inserted ?? []).map((r) => ({
      projeto_id: r.projeto_id,
      avaliador_id: r.avaliador_id,
      ordem: r.ordem,
      atribuicao_id: r.id,
    }))
  );
  await supabase.from("projetos").update({ status: "EM_AVALIACAO" }).eq("id", projetoId);
  await logAuditoria(supabase, {
    usuario_id: user.id,
    acao: "ATRIBUICAO_MANUAL",
    entidade: "atribuicoes",
    entidade_id: projetoId,
    detalhes: { avaliadorIds: ids },
  });
  revalidatePath("/admin/atribuicoes");
}

export async function actionAtribuirTerceiro(projetoId: string, avaliadorId: string) {
  const { supabase, user } = await requireCoord();
  const { data: p } = await supabase.from("projetos").select("status").eq("id", projetoId).single();
  if (!p || ["DESCLASSIFICADO", "SELECIONADO", "SUPLENTE", "NAO_SELECIONADO"].includes(p.status)) {
    throw new Error("Projeto não elegível para nova atribuição.");
  }
  if (await temImpedimento(supabase, avaliadorId, projetoId)) {
    throw new Error("Este avaliador possui impedimento declarado neste projeto.");
  }
  const { data: maxRow } = await supabase
    .from("atribuicoes")
    .select("ordem")
    .eq("projeto_id", projetoId)
    .order("ordem", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrdem = (maxRow?.ordem ?? 0) + 1;
  if (nextOrdem > 20) throw new Error("Limite de ordem de atribuições atingido.");
  const { data: dup } = await supabase
    .from("atribuicoes")
    .select("id")
    .eq("projeto_id", projetoId)
    .eq("avaliador_id", avaliadorId)
    .maybeSingle();
  if (dup) throw new Error("Este avaliador já está atribuído a este projeto.");
  if (await avaliadorJaAvaliouProjeto(supabase, avaliadorId, projetoId)) {
    throw new Error("Este projeto já foi avaliado por este avaliador. Atribua outro avaliador.");
  }
  const { data: inserted, error: insErr } = await supabase
    .from("atribuicoes")
    .insert({
      projeto_id: projetoId,
      avaliador_id: avaliadorId,
      ordem: nextOrdem,
      status: "PENDENTE",
    })
    .select("id, projeto_id, avaliador_id, ordem")
    .single();
  if (insErr) throw new Error(insErr.message);
  await notificarNovasAtribuicoes(supabase, [
    {
      projeto_id: inserted.projeto_id,
      avaliador_id: inserted.avaliador_id,
      ordem: inserted.ordem,
      atribuicao_id: inserted.id,
    },
  ]);
  await supabase.from("projetos").update({ status: "EM_AVALIACAO" }).eq("id", projetoId);
  await logAuditoria(supabase, {
    usuario_id: user.id,
    acao: "ATRIBUICAO_ADICIONAL",
    entidade: "atribuicoes",
    entidade_id: projetoId,
    detalhes: { avaliadorId, ordem: nextOrdem },
  });
  revalidatePath("/admin/atribuicoes");
}

export async function actionSalvarPrograma(input: {
  programa_nome: string | null;
  avaliacoes_inicio: string | null;
  avaliacoes_fim: string | null;
  avaliadores_por_projeto: number;
}) {
  const { supabase, user } = await requireCoord();
  const n = Math.min(15, Math.max(1, Math.floor(Number(input.avaliadores_por_projeto) || 2)));
  await supabase
    .from("app_config")
    .update({
      programa_nome: input.programa_nome?.trim() || null,
      avaliacoes_inicio: input.avaliacoes_inicio || null,
      avaliacoes_fim: input.avaliacoes_fim || null,
      avaliadores_por_projeto: n,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", 1);
  await logAuditoria(supabase, {
    usuario_id: user.id,
    acao: "CONFIG_PROGRAMA",
    entidade: "app_config",
    detalhes: { avaliadores_por_projeto: n },
  });
  revalidatePath("/admin/programa");
  revalidatePath("/admin/atribuicoes");
}

/** Prorroga o fim uma única vez; após isso `prorrogacao_utilizada` fica true. */
export async function actionProrrogarPrazo(novaDataFimISO: string) {
  const { supabase, user } = await requireCoord();
  const { data: cfg } = await supabase
    .from("app_config")
    .select("prorrogacao_utilizada, avaliacoes_fim")
    .eq("id", 1)
    .single();
  if (cfg?.prorrogacao_utilizada) {
    throw new Error("A prorrogação já foi utilizada. Não é possível alterar novamente.");
  }
  const fim = new Date(novaDataFimISO);
  if (Number.isNaN(fim.getTime())) throw new Error("Data inválida.");
  await supabase
    .from("app_config")
    .update({
      prorrogacao_fim: fim.toISOString(),
      prorrogacao_utilizada: true,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", 1);
  await logAuditoria(supabase, {
    usuario_id: user.id,
    acao: "PRORROGACAO_PRAZO_AVALIACOES",
    entidade: "app_config",
    detalhes: { novaDataFim: fim.toISOString() },
  });
  revalidatePath("/admin/programa");
}

export async function actionLembreteAvaliadoresPendentes() {
  const { supabase, user } = await requireCoord();
  const { data: cfg } = await supabase.from("app_config").select("programa_nome").eq("id", 1).maybeSingle();
  const lista = await listarAvaliadoresComPendencias(supabase);
  if (!lista.length) {
    return { enviados: 0, aviso: "Nenhum avaliador com avaliações pendentes." };
  }
  const r = await enviarLembretesResend(lista, { programaNome: cfg?.programa_nome });
  await logAuditoria(supabase, {
    usuario_id: user.id,
    acao: "LEMBRETE_EMAIL_AVALIADORES",
    entidade: "atribuicoes",
    detalhes: { enviados: r.enviados, total: lista.length, erro: r.erro },
  });
  revalidatePath("/admin/programa");
  return { enviados: r.enviados, total: lista.length, erro: r.erro };
}

export async function actionAtribuicaoAuto(projetoIds: string[]) {
  const { supabase, user } = await requireCoord();
  const r = await gerarAtribuicoesAutomaticas(supabase, projetoIds);
  await notificarNovasAtribuicoes(
    supabase,
    (r.atribuicoesCriadas ?? []).map((x) => ({
      projeto_id: x.projeto_id,
      avaliador_id: x.avaliador_id,
      ordem: x.ordem,
      atribuicao_id: x.id,
    }))
  );
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
