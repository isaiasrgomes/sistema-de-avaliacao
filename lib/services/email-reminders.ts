import type { SupabaseClient } from "@supabase/supabase-js";

export type LembreteDestinatario = { email: string; nome: string; pendentes: number };
export type CredenciaisAcesso = { email: string; nome: string; senha: string };
export type NovaAtribuicaoEmail = {
  email: string;
  nome: string;
  projetoNome: string;
  ordem: number;
  linkAvaliacao?: string | null;
};

export type RecuperacaoSenhaEmail = {
  email: string;
  nome?: string | null;
  linkRedefinicao: string;
};

function getSiteUrl() {
  const direct =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    "";
  if (direct) return direct.replace(/\/+$/, "");

  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    "";
  if (!vercelHost) return "";

  const host = vercelHost.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  return host ? `https://${host}` : "";
}

function toAbsoluteUrlOrEmpty(url?: string | null) {
  const value = (url ?? "").trim();
  if (!value) return "";
  if (!/^https?:\/\//i.test(value)) return "";
  return value.replace(/\/+$/, "");
}

function buildPublicUrl(pathname: string) {
  const base = getSiteUrl();
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return base ? `${base}${path}` : "";
}

function renderEmailPadrao({
  titulo,
  subtitulo,
  conteudoHtml,
}: {
  titulo: string;
  subtitulo?: string;
  conteudoHtml: string;
}) {
  const logoUrl = buildPublicUrl("/logo-sertao-inovador.svg");
  return `
    <div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#f8fafc;padding:24px">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden">
        ${
          logoUrl
            ? `<div style="padding:18px 22px 0 22px;text-align:center">
                 <img src="${escapeHtml(logoUrl)}" alt="SerTão Inovador" style="max-width:220px;width:100%;height:auto" />
               </div>`
            : ""
        }
        <div style="padding:18px 22px;background:linear-gradient(135deg,#14532d,#166534);color:#ffffff">
          <h2 style="margin:0;font-size:20px;line-height:1.2">${escapeHtml(titulo)}</h2>
          ${subtitulo ? `<p style="margin:8px 0 0 0;font-size:13px;opacity:.9">${escapeHtml(subtitulo)}</p>` : ""}
        </div>
        <div style="padding:20px 22px;color:#0f172a">
          ${conteudoHtml}
          <p style="font-size:12px;color:#64748b;margin-top:18px">Mensagem automática do sistema.</p>
        </div>
      </div>
    </div>
  `;
}

async function enviarViaResend(input: {
  to: string[];
  subject: string;
  html: string;
}): Promise<{ ok: true } | { ok: false; erro: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim().replace(/^["']|["']$/g, "");
  const from = process.env.EMAIL_FROM?.trim().replace(/^["']|["']$/g, "");
  if (!apiKey || !from) {
    return { ok: false, erro: "Configure RESEND_API_KEY e EMAIL_FROM no ambiente do servidor para enviar e-mails." };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    }),
  });

  if (!res.ok) {
    const raw = await res.text();
    const parsed = parseResendErrorBody(raw);
    const prefix = `Resend HTTP ${res.status}`;
    return { ok: false, erro: parsed ? `${prefix}: ${parsed}` : prefix };
  }
  return { ok: true };
}

function parseResendErrorBody(text: string) {
  const t = text.trim();
  if (!t) return "";
  try {
    const j = JSON.parse(t) as { message?: string; name?: string };
    if (j?.message) return j.message;
  } catch {
    /* ignore */
  }
  return t.length > 400 ? `${t.slice(0, 400)}…` : t;
}

/**
 * Lista avaliadores com ao menos uma atribuição pendente (ou em andamento).
 */
export async function listarAvaliadoresComPendencias(
  supabase: SupabaseClient
): Promise<LembreteDestinatario[]> {
  const { data: rows } = await supabase
    .from("atribuicoes")
    .select("avaliador_id, avaliadores(nome, email)")
    .in("status", ["PENDENTE", "EM_ANDAMENTO"]);

  const map = new Map<string, { nome: string; email: string; n: number }>();
  for (const r of rows ?? []) {
    const av = r.avaliadores as unknown as { nome: string; email: string } | null;
    if (!av?.email) continue;
    const email = av.email.trim().toLowerCase();
    const prev = map.get(email);
    if (prev) prev.n += 1;
    else map.set(email, { nome: av.nome, email: av.email, n: 1 });
  }
  return [...map.values()].map((v) => ({ email: v.email, nome: v.nome, pendentes: v.n }));
}

/**
 * Envia lembretes via Resend (https://resend.com). Requer `RESEND_API_KEY` e `EMAIL_FROM`.
 */
export async function enviarLembretesResend(
  destinatarios: LembreteDestinatario[],
  opts: { programaNome?: string | null }
): Promise<{ enviados: number; erro?: string }> {
  let enviados = 0;
  const assunto = opts.programaNome
    ? `Lembrete: avaliações pendentes — ${opts.programaNome}`
    : "Lembrete: avaliações pendentes no sistema";

  for (const d of destinatarios) {
    const html = renderEmailPadrao({
      titulo: "Lembrete de avaliações pendentes",
      subtitulo: opts.programaNome ?? undefined,
      conteudoHtml: `
        <p>Olá, <strong>${escapeHtml(d.nome)}</strong>.</p>
        <p>Você tem <strong>${d.pendentes}</strong> avaliação(ões) pendente(s) na plataforma.</p>
        <p>Acesse o sistema com seu e-mail cadastrado para concluir.</p>
      `,
    });
    const sent = await enviarViaResend({ to: [d.email], subject: assunto, html });
    if (!sent.ok) {
      return { enviados, erro: `Falha ao enviar para ${d.email}: ${sent.erro}` };
    }
    enviados += 1;
  }
  return { enviados };
}

export function gerarSenhaAleatoria(tamanho = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  let senha = "";
  for (let i = 0; i < tamanho; i += 1) {
    senha += chars[Math.floor(Math.random() * chars.length)];
  }
  return senha;
}

export async function enviarCredenciaisAvaliadorResend(
  destinatario: CredenciaisAcesso,
  opts: { programaNome?: string | null; loginUrl?: string | null }
): Promise<{ ok: true } | { ok: false; erro: string }> {
  const loginUrl = toAbsoluteUrlOrEmpty(opts.loginUrl) || buildPublicUrl("/login");
  const resetPasswordHelpUrl = buildPublicUrl("/login");
  const assunto = opts.programaNome
    ? `Seu acesso foi criado — ${opts.programaNome}`
    : "Seu acesso foi criado na plataforma";
  const html = renderEmailPadrao({
    titulo: "Cadastro de avaliador aprovado",
    subtitulo: "Seu acesso já está liberado.",
    conteudoHtml: `
      <p>Olá, <strong>${escapeHtml(destinatario.nome)}</strong>.</p>
      <p>Seu cadastro na plataforma foi aprovado e seu acesso já está liberado.</p>
      <p>Use os dados abaixo no primeiro acesso:</p>
      <div style="margin:14px 0;padding:12px;border-radius:10px;background:#f1f5f9;border:1px solid #cbd5e1">
        <p style="margin:0 0 8px 0"><strong>E-mail:</strong> ${escapeHtml(destinatario.email)}</p>
        <p style="margin:0"><strong>Senha:</strong> ${escapeHtml(destinatario.senha)}</p>
      </div>
      <p style="margin:0 0 10px 0">
        Recomendamos alterar sua senha logo após entrar no sistema para manter sua conta segura.
      </p>
      ${
        loginUrl
          ? `<p><a href="${escapeHtml(loginUrl)}" style="display:inline-block;padding:10px 14px;background:#166534;color:#fff;text-decoration:none;border-radius:8px">Acessar plataforma</a></p>`
          : ""
      }
      ${
        loginUrl
          ? `<p style="font-size:12px;color:#64748b;margin-top:8px">
               Se o botão não funcionar, copie e cole este link no navegador:<br />
               <a href="${escapeHtml(loginUrl)}">${escapeHtml(loginUrl)}</a>
             </p>`
          : `<p style="font-size:12px;color:#64748b;margin-top:8px">
               Não foi possível montar automaticamente o link da plataforma. Entre em contato com o suporte para receber o endereço de acesso.
             </p>`
      }
      ${
        resetPasswordHelpUrl
          ? `<p style="margin-top:10px"><a href="${escapeHtml(resetPasswordHelpUrl)}" style="display:inline-block;padding:10px 14px;background:#0f172a;color:#fff;text-decoration:none;border-radius:8px">Atualizar senha</a></p>`
          : ""
      }
      <p style="font-size:12px;color:#64748b;margin-top:18px">
        Para trocar a senha, abra a tela de login e clique em <strong>Esqueci minha senha</strong>.
      </p>
    `,
  });
  return enviarViaResend({ to: [destinatario.email], subject: assunto, html });
}

export async function enviarNovaAtribuicaoResend(
  destinatario: NovaAtribuicaoEmail,
  opts: { programaNome?: string | null }
): Promise<{ ok: true } | { ok: false; erro: string }> {
  const assunto = opts.programaNome
    ? `Novo projeto para avaliação — ${opts.programaNome}`
    : "Novo projeto para avaliação";

  const html = renderEmailPadrao({
    titulo: "Nova atribuição de avaliação",
    subtitulo: "Você recebeu um novo projeto para avaliar.",
    conteudoHtml: `
      <p>Olá, <strong>${escapeHtml(destinatario.nome)}</strong>.</p>
      <p>Você recebeu um novo projeto para avaliação:</p>
      <div style="margin:14px 0;padding:12px;border-radius:10px;background:#f1f5f9;border:1px solid #cbd5e1">
        <p style="margin:0 0 8px 0"><strong>Projeto:</strong> ${escapeHtml(destinatario.projetoNome)}</p>
        <p style="margin:0"><strong>Ordem de avaliação:</strong> ${destinatario.ordem}</p>
      </div>
      ${
        destinatario.linkAvaliacao
          ? `<p><a href="${escapeHtml(destinatario.linkAvaliacao)}" style="display:inline-block;padding:10px 14px;background:#166534;color:#fff;text-decoration:none;border-radius:8px">Abrir projeto</a></p>`
          : ""
      }
    `,
  });

  return enviarViaResend({ to: [destinatario.email], subject: assunto, html });
}

export async function enviarRecuperacaoSenhaResend(
  destinatario: RecuperacaoSenhaEmail,
  opts: { programaNome?: string | null }
): Promise<{ ok: true } | { ok: false; erro: string }> {
  const assunto = opts.programaNome
    ? `Recuperação de senha — ${opts.programaNome}`
    : "Recuperação de senha";

  const html = renderEmailPadrao({
    titulo: "Recuperação de senha",
    subtitulo: "Foi solicitada a redefinição da sua senha.",
    conteudoHtml: `
      <p>Olá${destinatario.nome ? `, <strong>${escapeHtml(destinatario.nome)}</strong>` : ""}.</p>
      <p>Clique no botão abaixo para redefinir sua senha:</p>
      <p>
        <a href="${escapeHtml(destinatario.linkRedefinicao)}" style="display:inline-block;padding:10px 14px;background:#166534;color:#fff;text-decoration:none;border-radius:8px">
          Redefinir senha
        </a>
      </p>
      <p style="font-size:12px;color:#64748b">Se você não solicitou, ignore este e-mail.</p>
    `,
  });

  return enviarViaResend({ to: [destinatario.email], subject: assunto, html });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
