import type { SupabaseClient } from "@supabase/supabase-js";

export async function logAuditoria(
  supabase: SupabaseClient,
  params: {
    usuario_id: string | null;
    acao: string;
    entidade: string;
    entidade_id?: string | null;
    detalhes?: Record<string, unknown>;
  }
) {
  await supabase.from("logs_auditoria").insert({
    usuario_id: params.usuario_id,
    acao: params.acao,
    entidade: params.entidade,
    entidade_id: params.entidade_id ?? null,
    detalhes: params.detalhes ?? null,
  });
}
