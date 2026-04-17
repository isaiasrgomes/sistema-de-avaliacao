"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { destinoAposLogin } from "@/lib/auth/destino-pos-login";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Concluindo login…");

  useEffect(() => {
    const run = async () => {
      const supabase = createClient();

      const url = typeof window !== "undefined" ? new URL(window.location.href) : null;
      if (!url) return;

      const nextRaw = searchParams.get("next") ?? url.searchParams.get("next") ?? "/avaliador";
      const next = nextRaw.startsWith("/") ? nextRaw : "/avaliador";

      const errParam = url.searchParams.get("error") ?? url.searchParams.get("error_code");
      const errDesc =
        url.searchParams.get("error_description")?.replace(/\+/g, " ") ?? url.searchParams.get("error");

      if (errParam) {
        setMessage(errDesc || "Falha na autenticação.");
        router.replace(`/login?error=${encodeURIComponent(errDesc || errParam)}`);
        return;
      }

      const code = url.searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage(error.message);
          router.replace(`/login?error=${encodeURIComponent(error.message)}`);
          return;
        }
      } else if (url.hash && url.hash.length > 1) {
        const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
        const access_token = hash.get("access_token");
        const refresh_token = hash.get("refresh_token");
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) {
            setMessage(error.message);
            router.replace(`/login?error=${encodeURIComponent(error.message)}`);
            return;
          }
        }
      }

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) {
        setMessage("Sessão não foi criada. Verifique as URLs de redirecionamento e domínio do callback no Supabase.");
        router.replace(
          `/login?error=${encodeURIComponent("Link inválido ou expirado. Peça um novo magic link ou use senha.")}`
        );
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, cadastro_aprovado")
        .eq("id", user.id)
        .single();
      const dest = destinoAposLogin(profile?.role, profile?.cadastro_aprovado, next);
      window.location.replace(dest);
    };

    void run();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Carregando…</div>}>
      <AuthCallbackInner />
    </Suspense>
  );
}
