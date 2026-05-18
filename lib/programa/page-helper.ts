import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getProgramaMonitorIdFromCookie, loadProgramaById } from "@/lib/programa/context";
import type { Programa } from "@/lib/programa/types";

export async function getProgramaMonitorForPage(supabase: SupabaseClient): Promise<Programa> {
  const id = await getProgramaMonitorIdFromCookie();
  if (!id) redirect("/admin/programas");
  const programa = await loadProgramaById(supabase, id);
  if (!programa) redirect("/admin/programas?erro=programa-invalido");
  return programa;
}
