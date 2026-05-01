"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { logAuditoria } from "@/lib/services/audit";
import Papa from "papaparse";
import { enviarCredenciaisAvaliadorResend, gerarSenhaAleatoria } from "@/lib/services/email-reminders";
import { getUserFriendlyErrorMessage } from "@/lib/utils/user-friendly-error";

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
    throw new Error(getUserFriendlyErrorMessage(createErr, "Não foi possível criar o usuário autenticado."));
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
  if (pErr) throw new Error("Não foi possível atualizar os dados de perfil do avaliador.");

  const { error } = await supabase.from("avaliadores").upsert({
    nome,
    email,
    instituicao: input.instituicao?.trim() || null,
    ativo: true,
  });
  if (error) throw new Error("Não foi possível salvar os dados do avaliador.");

  let avisoCredenciais: string | null = null;
  const { data: cfg } = await supabase.from("app_config").select("programa_nome").eq("id", 1).maybeSingle();
  const sent = await enviarCredenciaisAvaliadorResend({ nome, email, senha }, { programaNome: cfg?.programa_nome });
  if (!sent.ok) {
    avisoCredenciais = `Avaliador criado, mas o e-mail de credenciais não foi enviado. Senha definida: ${senha}. Motivo (Resend): ${sent.erro}`;
  }

  await logAuditoria(supabase, {
    usuario_id: user.id,
    acao: "CADASTRO_AVALIADOR",
    entidade: "avaliadores",
    entidade_id: authId,
    detalhes: { email, senhaInformadaManualmente: Boolean(input.senha?.trim()) },
  });
  revalidatePath("/admin/avaliadores");
  return { ok: true, avisoCredenciais };
}

type CsvAvaliadorRow = Record<string, string | undefined>;

function normalizarCabecalho(chave: string) {
  return chave
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function limparCelula(valor: string | undefined) {
  return (valor ?? "").trim().replace(/^["']|["']$/g, "");
}

function extrairNomeEmail(row: CsvAvaliadorRow) {
  let nome = "";
  let email = "";

  for (const [chave, valor] of Object.entries(row)) {
    const k = normalizarCabecalho(chave);
    const v = limparCelula(valor);
    if (!v) continue;

    if (!nome && (k === "nome" || k === "nomecompleto" || k === "1nomecompleto" || k.includes("nome"))) {
      nome = v;
      continue;
    }
    if (!email && (k === "email" || k === "2email" || k.includes("email"))) {
      email = v.toLowerCase();
    }
  }

  return { nome, email };
}

export async function actionImportarAvaliadoresCSV(csvText: string) {
  const { supabase, user } = await requireCoord();
  const admin = createAdminClient();
  const parsed = Papa.parse<CsvAvaliadorRow>(csvText, { header: true, skipEmptyLines: true, delimiter: "" });
  if (parsed.errors.length) {
    throw new Error(parsed.errors.map((e) => e.message).join("; "));
  }

  let inseridos = 0;
  let atualizados = 0;
  let ignorados = 0;
  const erros: string[] = [];
  const { data: cfg } = await supabase.from("app_config").select("programa_nome").eq("id", 1).maybeSingle();

  for (const [idx, row] of parsed.data.entries()) {
    const { nome, email } = extrairNomeEmail(row);
    if (!nome || !email) {
      ignorados += 1;
      erros.push(`Linha ${idx + 2}: nome/email obrigatórios não encontrados (${JSON.stringify(row)})`);
      continue;
    }
    const senha = gerarSenhaAleatoria(10);

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome },
    });
    let authId = created.user?.id ?? null;
    if (createErr) {
      // Se já existir, tentamos aproveitar o profile existente pelo e-mail.
      if (/already|exists|registered|duplicate/i.test(createErr.message)) {
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", email)
          .maybeSingle();
        authId = existingProfile?.id ?? null;
        if (!authId) {
          ignorados += 1;
          erros.push(`Linha ${idx + 2} (${email}): já existe usuário, mas não encontrei profile por e-mail para vincular.`);
          continue;
        }
      } else {
        ignorados += 1;
        erros.push(`Linha ${idx + 2} (${email}): ${createErr.message}`);
        continue;
      }
    }
    if (!authId) {
      ignorados += 1;
      erros.push(`Linha ${idx + 2} (${email}): usuário não retornado.`);
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
      ignorados += 1;
      erros.push(`Linha ${idx + 2} (${email}): ${pErr.message}`);
      continue;
    }
    const { error: avErr } = await supabase.from("avaliadores").upsert({
      nome,
      email,
      ativo: true,
    });
    if (avErr) {
      ignorados += 1;
      erros.push(`Linha ${idx + 2} (${email}): ${avErr.message}`);
      continue;
    }

    if (createErr) {
      // Já existia. Não enviamos credenciais (senha desconhecida).
      atualizados += 1;
      erros.push(`Linha ${idx + 2} (${email}): usuário já existia — apenas vinculei/atualizei registros (sem envio de senha).`);
    } else {
      const sent = await enviarCredenciaisAvaliadorResend(
        { nome, email, senha },
        { programaNome: cfg?.programa_nome }
      );
      if (!sent.ok) {
        erros.push(`Linha ${idx + 2} (${email}): criado, mas e-mail não enviado (${sent.erro}).`);
      }
      inseridos += 1;
    }
  }

  await logAuditoria(supabase, {
    usuario_id: user.id,
    acao: "IMPORTAR_AVALIADORES_CSV",
    entidade: "avaliadores",
    detalhes: { inseridos, atualizados, ignorados, erros: erros.length },
  });
  revalidatePath("/admin/avaliadores");
  return { inseridos, atualizados, ignorados, erros };
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
  const { supabase, user } = await requireCoord();
  const emailNorm = (s: string) => s.trim().toLowerCase();

  const { data: row, error: fetchErr } = await supabase.from("avaliadores").select("id, nome, email").eq("id", id).maybeSingle();
  if (fetchErr) throw new Error(getUserFriendlyErrorMessage(fetchErr, "Não foi possível carregar o avaliador."));
  if (!row) throw new Error("Avaliador não encontrado.");

  const email = emailNorm(row.email ?? "");
  let authRemovidos = 0;

  if (email) {
    const { data: perfis } = await supabase.from("profiles").select("id, role").eq("email", email);
    const idsAvaliador = (perfis ?? []).filter((p) => p.role === "AVALIADOR").map((p) => p.id);
    if (idsAvaliador.length) {
      const admin = createAdminClient();
      for (const authId of idsAvaliador) {
        const { error: delAuth } = await admin.auth.admin.deleteUser(authId);
        if (delAuth) {
          throw new Error(
            getUserFriendlyErrorMessage(delAuth, "Não foi possível remover o login deste avaliador no provedor de autenticação.")
          );
        }
        authRemovidos += 1;
      }
    }
  }

  const { error: delAv } = await supabase.from("avaliadores").delete().eq("id", id);
  if (delAv) throw new Error(getUserFriendlyErrorMessage(delAv, "Não foi possível excluir o registro do avaliador."));

  await logAuditoria(supabase, {
    usuario_id: user.id,
    acao: "EXCLUIR_AVALIADOR",
    entidade: "avaliadores",
    entidade_id: id,
    detalhes: { nome: row.nome, email: row.email ?? "", usuarios_auth_removidos: authRemovidos },
  });

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
  if (u1) throw new Error("Não foi possível aprovar o cadastro neste momento.");

  const { data: existing } = await supabase.from("avaliadores").select("id").eq("email", email).maybeSingle();
  if (existing?.id) {
    const { error: u2 } = await supabase.from("avaliadores").update({ nome: profile.nome, ativo: true }).eq("id", existing.id);
    if (u2) throw new Error("Não foi possível atualizar o avaliador aprovado.");
  } else {
    const { error: ins } = await supabase.from("avaliadores").insert({
      nome: profile.nome,
      email,
      ativo: true,
    });
    if (ins) throw new Error("Não foi possível criar o avaliador aprovado.");
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
  if (u1) throw new Error("Não foi possível recusar o cadastro neste momento.");

  await logAuditoria(supabase, {
    usuario_id: user.id,
    acao: "RECUSAR_CADASTRO_AVALIADOR",
    entidade: "profiles",
    entidade_id: profileId,
    detalhes: { email: (profile.email ?? "").trim().toLowerCase() },
  });

  revalidatePath("/admin/avaliadores");
}
