"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { logAuditoria } from "@/lib/services/audit";
import Papa from "papaparse";
import { enviarCredenciaisAvaliadorResend, gerarSenhaAleatoria } from "@/lib/services/email-reminders";

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
  senha?: string;
  instituicao?: string;
}) {
  const { supabase, user } = await requireCoord();
  const admin = createAdminClient();
  const nome = input.nome.trim();
  const email = input.email.trim().toLowerCase();
  if (!nome || !email) throw new Error("Informe nome e e-mail.");

  const senha = input.senha?.trim() || gerarSenhaAleatoria(10);
  const generatedPassword = !input.senha?.trim();
  if (senha.length < 6) throw new Error("A senha deve ter ao menos 6 caracteres.");

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome },
  });
  if (createErr) {
    if (/already|exists|registered|duplicate/i.test(createErr.message)) {
      throw new Error("Já existe usuário autenticado com este e-mail.");
    }
    throw new Error(createErr.message);
  }

  const authId = created.user?.id;
  if (!authId) throw new Error("Não foi possível criar usuário de autenticação.");

  const { error: pErr } = await supabase.from("profiles").upsert({
    id: authId,
    role: "AVALIADOR",
    nome,
    email,
    cadastro_aprovado: true,
    cadastro_recusado: false,
  });
  if (pErr) throw new Error(pErr.message);

  const { error } = await supabase.from("avaliadores").upsert({
    nome,
    email,
    instituicao: input.instituicao?.trim() || null,
    ativo: true,
  });
  if (error) throw new Error(error.message);

  let avisoCredenciais: string | null = null;
  if (generatedPassword) {
    const { data: cfg } = await supabase.from("app_config").select("programa_nome").eq("id", 1).maybeSingle();
    const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? ""}/login`;
    const sent = await enviarCredenciaisAvaliadorResend({ nome, email, senha }, { programaNome: cfg?.programa_nome, loginUrl });
    if (!sent.ok) {
      avisoCredenciais = `Avaliador criado, mas o e-mail de credenciais não foi enviado. Senha temporária: ${senha}. Motivo (Resend): ${sent.erro}`;
    }
  }

  await logAuditoria(supabase, {
    usuario_id: user.id,
    acao: "CADASTRO_AVALIADOR",
    entidade: "avaliadores",
    entidade_id: authId,
    detalhes: { email, generatedPassword },
  });
  revalidatePath("/admin/avaliadores");
  return { ok: true, avisoCredenciais };
}

type CsvAvaliadorRow = { nome?: string; email?: string; senha?: string };

export async function actionImportarAvaliadoresCSV(csvText: string) {
  const { supabase, user } = await requireCoord();
  const admin = createAdminClient();
  const parsed = Papa.parse<CsvAvaliadorRow>(csvText, { header: true, skipEmptyLines: true, delimiter: "" });
  if (parsed.errors.length) {
    throw new Error(parsed.errors.map((e) => e.message).join("; "));
  }

  let inseridos = 0;
  const erros: string[] = [];
  const { data: cfg } = await supabase.from("app_config").select("programa_nome").eq("id", 1).maybeSingle();
  const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? ""}/login`;

  for (const row of parsed.data) {
    const nome = (row.nome ?? "").trim();
    const email = (row.email ?? "").trim().toLowerCase();
    if (!nome || !email) {
      erros.push(`Linha inválida (nome/email obrigatórios): ${JSON.stringify(row)}`);
      continue;
    }
    const senha = (row.senha ?? "").trim() || gerarSenhaAleatoria(10);
    if (senha.length < 6) {
      erros.push(`Senha inválida para ${email} (mínimo 6 caracteres).`);
      continue;
    }
    const generatedPassword = !(row.senha ?? "").trim();

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome },
    });
    if (createErr) {
      erros.push(`${email}: ${createErr.message}`);
      continue;
    }
    const authId = created.user?.id;
    if (!authId) {
      erros.push(`${email}: usuário não retornado.`);
      continue;
    }

    const { error: pErr } = await supabase.from("profiles").upsert({
      id: authId,
      role: "AVALIADOR",
      nome,
      email,
      cadastro_aprovado: true,
      cadastro_recusado: false,
    });
    if (pErr) {
      erros.push(`${email}: ${pErr.message}`);
      continue;
    }
    const { error: avErr } = await supabase.from("avaliadores").upsert({
      nome,
      email,
      ativo: true,
    });
    if (avErr) {
      erros.push(`${email}: ${avErr.message}`);
      continue;
    }

    if (generatedPassword) {
      const sent = await enviarCredenciaisAvaliadorResend({ nome, email, senha }, { programaNome: cfg?.programa_nome, loginUrl });
      if (!sent.ok) {
        erros.push(`${email}: criado, mas e-mail não enviado (${sent.erro}).`);
      }
    }
    inseridos += 1;
  }

  await logAuditoria(supabase, {
    usuario_id: user.id,
    acao: "IMPORTAR_AVALIADORES_CSV",
    entidade: "avaliadores",
    detalhes: { inseridos, erros: erros.length },
  });
  revalidatePath("/admin/avaliadores");
  return { inseridos, erros };
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
    .select("id, nome, email, role, cadastro_aprovado, cadastro_recusado")
    .eq("id", profileId)
    .single();

  if (pErr || !profile) throw new Error("Perfil não encontrado.");
  if (profile.role !== "AVALIADOR") throw new Error("Somente cadastros de avaliador são aprovados por aqui.");
  if (profile.cadastro_aprovado) throw new Error("Este cadastro já foi aprovado.");
  if (profile.cadastro_recusado) throw new Error("Este cadastro foi recusado e não pode ser aprovado.");

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

/** Marca o cadastro como não aceito; o usuário deixa de aguardar aprovação e vê aviso ao entrar. */
export async function actionRejeitarCadastroAvaliador(profileId: string) {
  const { supabase, user } = await requireCoord();

  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("id, nome, email, role, cadastro_aprovado, cadastro_recusado")
    .eq("id", profileId)
    .single();

  if (pErr || !profile) throw new Error("Perfil não encontrado.");
  if (profile.role !== "AVALIADOR") throw new Error("Somente cadastros de avaliador podem ser recusados por aqui.");
  if (profile.cadastro_aprovado) throw new Error("Este cadastro já foi aprovado.");
  if (profile.cadastro_recusado) throw new Error("Este cadastro já foi recusado.");

  const { error: u1 } = await supabase.from("profiles").update({ cadastro_recusado: true }).eq("id", profileId);
  if (u1) throw new Error(u1.message);

  await logAuditoria(supabase, {
    usuario_id: user.id,
    acao: "RECUSAR_CADASTRO_AVALIADOR",
    entidade: "profiles",
    entidade_id: profileId,
    detalhes: { email: (profile.email ?? "").trim().toLowerCase() },
  });

  revalidatePath("/admin/avaliadores");
}
