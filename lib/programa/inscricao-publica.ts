import { createAdminClient } from "@/lib/supabase/admin";
import { getProgramaAbertoInscricao } from "@/lib/programa/context";
import type { Programa } from "@/lib/programa/types";

export type EstadoInscricaoPublica =
  | { aberta: true; programa: Programa }
  | { aberta: false; programa: null; motivo: "sem_programa" | "configuracao" };

/** Estado das inscrições públicas (usa service role — RLS anon não lê EM_PROCESSO). */
export async function getEstadoInscricaoPublica(): Promise<EstadoInscricaoPublica> {
  try {
    const supabase = createAdminClient();
    const programa = await getProgramaAbertoInscricao(supabase);
    if (!programa) {
      return { aberta: false, programa: null, motivo: "sem_programa" };
    }
    return { aberta: true, programa };
  } catch (e) {
    if (e instanceof Error && e.message.includes("vários programas")) {
      throw e;
    }
    return { aberta: false, programa: null, motivo: "configuracao" };
  }
}
