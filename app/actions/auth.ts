"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarRecuperacaoSenhaResend } from "@/lib/services/email-reminders";
import { getUserFriendlyErrorMessage } from "@/lib/utils/user-friendly-error";

export async function actionEnviarRecuperacaoSenha(input: { email: string; callbackUrl: string }) {
  const email = input.email.trim().toLowerCase();
  const callbackUrl = input.callbackUrl.trim();
  if (!email || !callbackUrl) {
    throw new Error("Informe e-mail e URL de callback para recuperação.");
  }

  const admin = createAdminClient();
  const supabase = await createServerSupabase();
  const { data: cfg } = await supabase.from("app_config").select("programa_nome").eq("id", 1).maybeSingle();

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: callbackUrl },
  });
  if (error) {
    throw new Error(getUserFriendlyErrorMessage(error, "Não foi possível gerar o link de recuperação."));
  }

  const actionLink = data?.properties?.action_link;
  if (!actionLink) {
    throw new Error("Não foi possível gerar o link de recuperação.");
  }

  const nome =
    data?.user?.user_metadata && typeof data.user.user_metadata === "object"
      ? String((data.user.user_metadata as Record<string, unknown>).nome ?? "")
      : "";

  const sent = await enviarRecuperacaoSenhaResend(
    {
      email,
      nome,
      linkRedefinicao: actionLink,
    },
    { programaNome: cfg?.programa_nome }
  );

  if (!sent.ok) throw new Error(sent.erro);
  return { ok: true };
}
