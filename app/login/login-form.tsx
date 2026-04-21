"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SertaoMakerBrand } from "@/components/brand-logo";
import { toast } from "sonner";
import { destinoAposLogin } from "@/lib/auth/destino-pos-login";
import { buildAuthCallbackUrl } from "@/lib/auth/auth-redirect-url";

export function LoginForm() {
  const search = useSearchParams();
  const next = search.get("next") || "/avaliador";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const err = search.get("error");
    if (!err) return;
    try {
      toast.error(decodeURIComponent(err));
    } catch {
      toast.error(err);
    }
  }, [search]);

  async function magicLink() {
    setLoading(true);
    const supabase = createClient();
    const callbackUrl = buildAuthCallbackUrl(next);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl || undefined,
      },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Verifique seu e-mail para o link de acesso.");
  }

  async function passwordLogin() {
    setLoading(true);
    const supabase = createClient();
    const password = (document.getElementById("password") as HTMLInputElement)?.value ?? "";
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, cadastro_aprovado, cadastro_recusado")
      .eq("id", data.user.id)
      .single();
    window.location.href = destinoAposLogin(profile?.role, profile?.cadastro_aprovado, next, profile?.cadastro_recusado);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await passwordLogin();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="order-2 flex items-center justify-center px-4 py-8 sm:px-8 lg:order-2 lg:px-12">
          <Card className="w-full max-w-md border-border/70 bg-card/90 shadow-lg backdrop-blur">
            <CardHeader className="space-y-4">
              <SertaoMakerBrand variant="full" align="center" className="justify-center" />
              <CardTitle className="sr-only">Entrar</CardTitle>
              <CardDescription>Acesso ao sistema de avaliação</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha (opcional)</Label>
                  <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" />
                </div>
                <Button type="button" className="w-full" disabled={loading || !email} onClick={magicLink}>
                  Enviar magic link
                </Button>
                <Button variant="secondary" className="w-full" type="submit" disabled={loading || !email}>
                  Entrar com senha
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  <Link href="/cadastro" className="underline">
                    Criar conta (avaliador)
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </section>

        <section className="order-1 relative hidden overflow-hidden lg:order-1 lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.20),transparent_36%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.14),transparent_34%),radial-gradient(circle_at_60%_80%,rgba(255,255,255,0.1),transparent_42%)]" />
          <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(to_right,rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:40px_40px]" />
          <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute -right-16 bottom-16 h-80 w-80 rounded-full bg-cyan-200/20 blur-3xl" />

          <div className="relative z-10 flex w-full flex-col justify-end p-12 text-white">
            <h2 className="mt-3 max-w-md text-3xl font-semibold leading-tight">
              Plataforma inteligente para avaliação e ranqueamento de projetos.
            </h2>
            <p className="mt-4 max-w-md text-sm text-white/90">
              Ambiente com foco em governança, rastreabilidade e decisões baseadas em critérios técnicos.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
