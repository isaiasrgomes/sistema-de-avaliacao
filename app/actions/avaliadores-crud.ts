"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logAuditoria } from "@/lib/services/audit";

async function requireCoord() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "COORDENADOR") throw new Error("Acesso negado");
  return { supabase, user };
}

export async function actionCreateAvaliador(input: {
  nome: string;
  email: string;
  instituicao?: string;
}) {
  const { supabase } = await requireCoord();
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
  const { supabase } = await requireCoord();
  await supabase.from("avaliadores").update({ ativo }).eq("id", id);
  revalidatePath("/admin/avaliadores");
}

export async function actionUpdateAvaliador(
  id: string,
  input: { nome: string; email: string; instituicao?: string }
) {
  const { supabase } = await requireCoord();
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
  const { supabase } = await requireCoord();
  await supabase.from("avaliadores").delete().eq("id", id);
  revalidatePath("/admin/avaliadores");
}

/** Libera o login do avaliador e garante linha em `avaliadores` com o mesmo e-mail. */
export async function actionAprovarCadastroAvaliador(profileId: string) {
  const { supabase, user } = await requireCoord();

  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("id, nome, email, role, cadastro_aprovado")
    .eq("id", profileId)
    .single();

  if (pErr || !profile) throw new Error("Perfil não encontrado.");
  if (profile.role !== "AVALIADOR") throw new Error("Somente cadastros de avaliador são aprovados por aqui.");
  if (profile.cadastro_aprovado) throw new Error("Este cadastro já foi aprovado.");

  const email = (profile.email ?? "").trim().toLowerCase();
  if (!email) throw new Error("Perfil sem e-mail. O avaliador precisa usar o mesmo e-mail do cadastro na plataforma.");

  const { error: u1 } = await supabase.from("profiles").update({ cadastro_aprovado: true }).eq("id", profileId);
  if (u1) throw new Error(u1.message);

  const { data: existing } = await supabase.from("avaliadores").select("id").eq("email", email).maybeSingle();
  if (existing?.id) {
    const { error: u2 } = await supabase.from("avaliadores").update({ nome: profile.nome, ativo: true }).eq("id", existing.id);
    if (u2) throw new Error(u2.message);
  } else {
    const { error: ins } = await supabase.from("avaliadores").insert({
      nome: profile.nome,
      email,
      ativo: true,
    });
    if (ins) throw new Error(ins.message);
  }

  await logAuditoria(supabase, {
    usuario_id: user.id,
    acao: "APROVAR_CADASTRO_AVALIADOR",
    entidade: "profiles",
    entidade_id: profileId,
    detalhes: { email },
  });

  revalidatePath("/admin/avaliadores");
}
