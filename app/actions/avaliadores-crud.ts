"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireCoord() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "COORDENADOR") throw new Error("Acesso negado");
  return supabase;
}

export async function actionCreateAvaliador(input: {
  nome: string;
  email: string;
  instituicao?: string;
}) {
  const supabase = await requireCoord();
  const { error } = await supabase.from("avaliadores").insert({
    nome: input.nome,
    email: input.email.trim().toLowerCase(),
    instituicao: input.instituicao ?? null,
    ativo: true,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/avaliadores");
}

export async function actionToggleAvaliador(id: string, ativo: boolean) {
  const supabase = await requireCoord();
  await supabase.from("avaliadores").update({ ativo }).eq("id", id);
  revalidatePath("/admin/avaliadores");
}

export async function actionUpdateAvaliador(
  id: string,
  input: { nome: string; email: string; instituicao?: string }
) {
  const supabase = await requireCoord();
  await supabase
    .from("avaliadores")
    .update({
      nome: input.nome,
      email: input.email.trim().toLowerCase(),
      instituicao: input.instituicao ?? null,
    })
    .eq("id", id);
  revalidatePath("/admin/avaliadores");
}

export async function actionDeleteAvaliador(id: string) {
  const supabase = await requireCoord();
  await supabase.from("avaliadores").delete().eq("id", id);
  revalidatePath("/admin/avaliadores");
}
