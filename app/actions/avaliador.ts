"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { logAuditoria } from "@/lib/services/audit";
import { podeEnviarAvaliacaoAgora } from "@/lib/prazo-avaliacoes";
import { verificarNecessidadeTerceiroAvaliador } from "@/lib/services/cv-service";
import { revalidatePath } from "next/cache";
import { getUserFriendlyErrorMessage } from "@/lib/utils/user-friendly-error";

async function requireAvaliador() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, cadastro_aprovado, cadastro_recusado")
    .eq("id", user.id)
    .single();
  if (profile?.role === "COORDENADOR") throw new Error("Use o painel admin");
  if (profile?.cadastro_recusado === true) {
    throw new Error("Seu cadastro como avaliador não foi aceito. Entre em contato com a coordenação.");
  }
  if (profile?.cadastro_aprovado !== true) throw new Error("Seu cadastro ainda não foi aprovado por um coordenador.");
  const email = (user.email ?? "").trim().toLowerCase();
  const { data: av } = await supabase.from("avaliadores").select("id").ilike("email", email).maybeSingle();
  if (!av) throw new Error("Avaliador não vinculado ao e-mail do login. Cadastre o mesmo e-mail em Avaliadores.");
  return { supabase, user, avaliadorId: av.id as string };
}

export async function actionEnviarAvaliacao(input: {
  atribuicaoId: string;
  projetoId: string;
  nota_equipe: number;
  nota_mercado: number;
  nota_produto: number;
  nota_tecnologia: number;
  justificativa_geral: string;
  observacoes_gerais: string;
}) {
  const { supabase, user } = await requireAvaliador();
  const justificativa = input.justificativa_geral.trim();
  if (justificativa.length < 100) {
    throw new Error("Informe uma justificativa geral com pelo menos 100 caracteres.");
  }

  const { data: cfg } = await supabase
    .from("app_config")
    .select("avaliacoes_inicio, avaliacoes_fim, prorrogacao_fim, prorrogacao_utilizada")
    .eq("id", 1)
    .maybeSingle();
  if (cfg) {
    const pr = podeEnviarAvaliacaoAgora(cfg);
    if (!pr.ok) throw new Error(pr.motivo ?? "Prazo de avaliações indisponível.");
  }

  const { data: exist } = await supabase.from("avaliacoes").select("id").eq("atribuicao_id", input.atribuicaoId).maybeSingle();

  const payload = {
    nota_equipe: input.nota_equipe,
    nota_mercado: input.nota_mercado,
    nota_produto: input.nota_produto,
    nota_tecnologia: input.nota_tecnologia,
    justificativa_geral: justificativa || null,
    observacoes_gerais: input.observacoes_gerais || null,
    nota_total_ponderada: 0,
  };

  if (exist) {
    const { data: updatedRows, error: eUpdate } = await supabase
      .from("avaliacoes")
      .update(payload)
      .eq("id", exist.id)
      .select("id");
    if (eUpdate) throw new Error(getUserFriendlyErrorMessage(eUpdate, "Não foi possível atualizar sua avaliação."));
    if (!updatedRows?.length) {
      throw new Error(
        "A atualização não foi aplicada (permissão ou política de segurança). Peça à coordenação para conferir o banco ou tente novamente."
      );
    }
  } else {
    const { error: eInsert } = await supabase.from("avaliacoes").insert({
      atribuicao_id: input.atribuicaoId,
      ...payload,
    });
    if (eInsert) throw new Error(getUserFriendlyErrorMessage(eInsert, "Não foi possível salvar sua avaliação."));
  }

  await supabase
    .from("atribuicoes")
    .update({ status: "CONCLUIDA", data_conclusao: new Date().toISOString() })
    .eq("id", input.atribuicaoId);

  await verificarNecessidadeTerceiroAvaliador(supabase, input.projetoId);

  await logAuditoria(supabase, {
    usuario_id: user.id,
    acao: exist ? "ATUALIZACAO_AVALIACAO" : "ENVIO_AVALIACAO",
    entidade: "avaliacoes",
    entidade_id: exist?.id ?? input.atribuicaoId,
  });

  revalidatePath("/avaliador");
  revalidatePath(`/avaliador/projeto/${input.projetoId}`);
  return { updated: !!exist };
}

export async function actionDeclararImpedimento(
  projetoId: string,
  atribuicaoId: string,
  tipo: "SOCIETARIO" | "PROFISSIONAL" | "PARENTESCO" | "OUTRO",
  justificativa: string
) {
  const { supabase, user, avaliadorId } = await requireAvaliador();
  const motivo = justificativa.trim();
  if (motivo.length < 30) throw new Error("Informe uma justificativa com pelo menos 30 caracteres.");

  await supabase.from("impedimentos").insert({
    projeto_id: projetoId,
    avaliador_id: avaliadorId,
    tipo,
    declarado_por: "AVALIADOR",
    justificativa: motivo,
  });

  await supabase.from("avaliacoes").delete().eq("atribuicao_id", atribuicaoId);
  await supabase.from("atribuicoes").delete().eq("id", atribuicaoId);

  await supabase.from("projetos").update({ status: "EM_AVALIACAO" }).eq("id", projetoId);

  await logAuditoria(supabase, {
    usuario_id: user.id,
    acao: "IMPEDIMENTO",
    entidade: "impedimentos",
    entidade_id: projetoId,
    detalhes: { tipo, justificativa: motivo },
  });

  revalidatePath("/avaliador");
}
