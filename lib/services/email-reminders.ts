import type { SupabaseClient } from "@supabase/supabase-js";

export type LembreteDestinatario = { email: string; nome: string; pendentes: number };

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
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    return {
      enviados: 0,
      erro: "Configure RESEND_API_KEY e EMAIL_FROM no ambiente do servidor para enviar e-mails.",
    };
  }

  let enviados = 0;
  const assunto = opts.programaNome
    ? `Lembrete: avaliações pendentes — ${opts.programaNome}`
    : "Lembrete: avaliações pendentes no sistema";

  for (const d of destinatarios) {
    const html = `
      <p>Olá, ${escapeHtml(d.nome)},</p>
      <p>Você tem <strong>${d.pendentes}</strong> avaliação(ões) pendente(s) na plataforma.</p>
      <p>Acesse o sistema com seu e-mail cadastrado para concluir.</p>
      <p style="color:#64748b;font-size:12px">Mensagem automática — não responda.</p>
    `;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [d.email],
        subject: assunto,
        html,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      return { enviados, erro: `Falha ao enviar para ${d.email}: ${t}` };
    }
    enviados += 1;
  }
  return { enviados };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
