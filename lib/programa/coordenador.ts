import { createServerSupabase } from "@/lib/supabase/server";
import { assertProgramaEditavel, requireProgramaMonitor } from "@/lib/programa/context";

export async function requireCoord() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "COORDENADOR") throw new Error("Acesso negado");
  return { supabase, user };
}

export async function requireCoordPrograma() {
  const { supabase, user } = await requireCoord();
  const programa = await requireProgramaMonitor(supabase);
  return { supabase, user, programa };
}

export async function requireCoordProgramaEditavel() {
  const ctx = await requireCoordPrograma();
  assertProgramaEditavel(ctx.programa);
  return ctx;
}
