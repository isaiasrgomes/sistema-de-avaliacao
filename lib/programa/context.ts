import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PROGRAMA_MONITOR_COOKIE } from "@/lib/programa/constants";
import type { Programa } from "@/lib/programa/types";
import { prazoFimEfetivo } from "@/lib/prazo-avaliacoes";
import { programaParaConfigPrazo } from "@/lib/programa/types";

export async function getProgramaMonitorIdFromCookie(): Promise<string | null> {
  const store = await cookies();
  const v = store.get(PROGRAMA_MONITOR_COOKIE)?.value?.trim();
  return v || null;
}

export async function loadProgramaById(
  supabase: SupabaseClient,
  id: string
): Promise<Programa | null> {
  const { data } = await supabase
    .from("programas")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  return (data as Programa | null) ?? null;
}

export async function requireProgramaMonitor(
  supabase: SupabaseClient,
  opts?: { redirectTo?: string }
): Promise<Programa> {
  const id = await getProgramaMonitorIdFromCookie();
  if (!id) {
    redirect(opts?.redirectTo ?? "/admin/programas");
  }
  const programa = await loadProgramaById(supabase, id);
  if (!programa) {
    redirect("/admin/programas?erro=programa-invalido");
  }
  return programa;
}

export function isProgramaFinalizado(programa: Programa) {
  return programa.status === "FINALIZADO";
}

export function assertProgramaEditavel(programa: Programa) {
  if (isProgramaFinalizado(programa)) {
    throw new Error("Este programa está finalizado. Alterações não são permitidas (modo somente leitura).");
  }
}

export function prazoAvaliacaoEncerrado(programa: Programa, agora = new Date()) {
  const fim = prazoFimEfetivo(programaParaConfigPrazo(programa));
  return fim != null && agora > fim;
}

export async function getProgramaAbertoInscricao(supabase: SupabaseClient): Promise<Programa | null> {
  const { data } = await supabase
    .from("programas")
    .select("*")
    .eq("status", "EM_PROCESSO")
    .is("deleted_at", null)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as Programa | null) ?? null;
}
