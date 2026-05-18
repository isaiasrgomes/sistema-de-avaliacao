"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { cadastrarOuAtualizarProjetoManual } from "@/lib/services/projeto-manual";
import { projetoManualSchema } from "@/lib/validations/projeto-manual";
import { revalidatePath } from "next/cache";

export async function actionInscricaoPublica(data: unknown) {
  const parsed = projetoManualSchema.safeParse(data);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors;
    throw new Error(Object.values(msg).flat().filter(Boolean).join(" ") || "Dados inválidos");
  }

  const supabase = createAdminClient();
  const payload = {
    ...parsed.data,
    timestamp_submissao: new Date().toISOString(),
  };
  const res = await cadastrarOuAtualizarProjetoManual(supabase, payload);
  if (!res.ok) throw new Error(res.erro);

  revalidatePath("/inscricao");
  revalidatePath("/admin/projetos");
  revalidatePath("/admin");
  return res;
}
