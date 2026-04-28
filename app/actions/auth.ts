"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarRecuperacaoSenhaResend } from "@/lib/services/email-reminders";
import { getUserFriendlyErrorMessage } from "@/lib/utils/user-friendly-error";
import { buildAuthCallbackUrlWithOrigin } from "@/lib/auth/auth-redirect-url";

function publicOriginForRecovery(clientCallbackUrl: string) {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  try {
    return new URL(clientCallbackUrl.trim()).origin;
  } catch {
    return "";
  }
}

export async function actionEnviarRecuperacaoSenha(input: { email: string; callbackUrl: string }) {
  const email = input.email.trim().toLowerCase();
  const clientCallbackUrl = input.callbackUrl.trim();
  if (!email || !clientCallbackUrl) {
    throw new Error("Informe e-mail e URL de callback para recuperação.");
  }

  const origin = publicOriginForRecovery(clientCallbackUrl);
  if (!origin) {
    throw new Error("Defina NEXT_PUBLIC_SITE_URL com a URL pública do app (ex.: https://seu-dominio.com) para o link de recuperação.");
  }
  const callbackUrl = buildAuthCallbackUrlWithOrigin(origin, "/redefinir-senha");
  if (!callbackUrl) {
    throw new Error("Não foi possível montar a URL de retorno da recuperação.");
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
