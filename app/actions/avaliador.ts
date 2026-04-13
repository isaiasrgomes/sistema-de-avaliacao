"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { logAuditoria } from "@/lib/services/audit";
import { verificarNecessidadeTerceiroAvaliador } from "@/lib/services/cv-service";
import { revalidatePath } from "next/cache";

async function requireAvaliador() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role === "COORDENADOR") throw new Error("Use o painel admin");
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

  const { data: exist } = await supabase.from("avaliacoes").select("id").eq("atribuicao_id", input.atribuicaoId).maybeSingle();
  if (exist) throw new Error("Avaliação já enviada.");

  const { error: e1 } = await supabase.from("avaliacoes").insert({
    atribuicao_id: input.atribuicaoId,
    nota_equipe: input.nota_equipe,
    nota_mercado: input.nota_mercado,
    nota_produto: input.nota_produto,
    nota_tecnologia: input.nota_tecnologia,
    justificativa_geral: input.justificativa_geral || null,
    observacoes_gerais: input.observacoes_gerais || null,
    nota_total_ponderada: 0,
  });
  if (e1) throw new Error(e1.message);

  await supabase
    .from("atribuicoes")
    .update({ status: "CONCLUIDA", data_conclusao: new Date().toISOString() })
    .eq("id", input.atribuicaoId);

  await verificarNecessidadeTerceiroAvaliador(supabase, input.projetoId);

  await logAuditoria(supabase, {
    usuario_id: user.id,
    acao: "ENVIO_AVALIACAO",
    entidade: "avaliacoes",
    entidade_id: input.atribuicaoId,
  });

  revalidatePath("/avaliador");
  revalidatePath(`/avaliador/projeto/${input.projetoId}`);
}

export async function actionDeclararImpedimento(
  projetoId: string,
  atribuicaoId: string,
  tipo: "SOCIETARIO" | "PROFISSIONAL" | "PARENTESCO" | "OUTRO"
) {
  const { supabase, user, avaliadorId } = await requireAvaliador();

  await supabase.from("impedimentos").insert({
    projeto_id: projetoId,
    avaliador_id: avaliadorId,
    tipo,
    declarado_por: "AVALIADOR",
  });

  await supabase.from("avaliacoes").delete().eq("atribuicao_id", atribuicaoId);
  await supabase.from("atribuicoes").delete().eq("id", atribuicaoId);

  await supabase.from("projetos").update({ status: "EM_AVALIACAO" }).eq("id", projetoId);

  await logAuditoria(supabase, {
    usuario_id: user.id,
    acao: "IMPEDIMENTO",
    entidade: "impedimentos",
    entidade_id: projetoId,
    detalhes: { tipo },
  });

  revalidatePath("/avaliador");
}
