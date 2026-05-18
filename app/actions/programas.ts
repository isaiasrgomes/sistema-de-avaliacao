"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { PROGRAMA_MONITOR_COOKIE } from "@/lib/programa/constants";
import { requireCoord, requireCoordProgramaEditavel } from "@/lib/programa/coordenador";
import { finalizarPrograma } from "@/lib/services/finalizar-programa";
import { criarProgramaSchema } from "@/lib/validations/programa";
import { logAuditoria } from "@/lib/services/audit";

export async function actionSelecionarProgramaMonitor(programaId: string) {
  const { supabase } = await requireCoord();
  const { data: programa } = await supabase
    .from("programas")
    .select("id")
    .eq("id", programaId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!programa) throw new Error("Programa não encontrado.");

  const store = await cookies();
  store.set(PROGRAMA_MONITOR_COOKIE, programaId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 90,
  });
  revalidatePath("/admin");
  return { ok: true };
}

export async function actionLimparProgramaMonitor() {
  const store = await cookies();
  store.delete(PROGRAMA_MONITOR_COOKIE);
  revalidatePath("/admin");
}

export async function actionCriarPrograma(data: unknown) {
  const parsed = criarProgramaSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.flatten().fieldErrors.nome?.[0] ?? "Dados inválidos");
  }
  const { supabase, user } = await requireCoord();

  const d = parsed.data;
  const admin = createAdminClient();

  const { count: ativos } = await admin
    .from("programas")
    .select("id", { count: "exact", head: true })
    .eq("status", "EM_PROCESSO")
    .is("deleted_at", null);
  if (ativos && ativos > 0) {
    throw new Error(
      "Já existe um programa em andamento. Finalize-o antes de abrir uma nova edição — só pode haver um programa ativo por vez."
    );
  }

  const { data: inserted, error } = await admin
    .from("programas")
    .insert({
      nome: d.nome.trim(),
      tipo: d.tipo,
      edital: d.edital.trim(),
      status: "EM_PROCESSO",
      data_inicio: d.data_inicio,
      data_fim: d.data_fim,
      avaliacoes_inicio: new Date(d.avaliacoes_inicio).toISOString(),
      avaliacoes_fim: new Date(d.avaliacoes_fim).toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await logAuditoria(supabase, {
    usuario_id: user.id,
    acao: "CRIAR_PROGRAMA",
    entidade: "programas",
    entidade_id: inserted.id,
    detalhes: { nome: d.nome },
  });

  revalidatePath("/admin/programas");
  revalidatePath("/");
  revalidatePath("/inscricao");
  return { id: inserted.id as string };
}

export async function actionFinalizarPrograma() {
  const { supabase, user, programa } = await requireCoordProgramaEditavel();
  const res = await finalizarPrograma(supabase, programa);
  await logAuditoria(supabase, {
    usuario_id: user.id,
    acao: "FINALIZAR_PROGRAMA",
    entidade: "programas",
    entidade_id: programa.id,
    detalhes: res as unknown as Record<string, unknown>,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/programas");
  revalidatePath("/admin/ranking");
  revalidatePath("/historico-programas");
  revalidatePath("/");
  revalidatePath("/inscricao");
  return res;
}
