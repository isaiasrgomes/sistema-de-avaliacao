"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SertaoMakerBrand } from "@/components/brand-logo";
import { toast } from "sonner";

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
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
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
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
    const dest = profile?.role === "COORDENADOR" ? "/admin" : next;
    window.location.href = dest;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="order-2 flex items-center justify-center px-4 py-8 sm:px-8 lg:order-2 lg:px-12">
          <Card className="w-full max-w-md border-border/70 bg-card/90 shadow-lg backdrop-blur">
            <CardHeader className="space-y-4">
              <Button variant="ghost" size="sm" className="-ml-2 w-fit gap-1 text-muted-foreground" asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao início
                </Link>
              </Button>
              <SertaoMakerBrand variant="full" className="flex-col items-start gap-3 sm:flex-row sm:items-center" />
              <CardTitle className="sr-only">Entrar</CardTitle>
              <CardDescription>Acesso ao sistema de avaliação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <Button className="w-full" disabled={loading || !email} onClick={magicLink}>
                Enviar magic link
              </Button>
              <Button variant="secondary" className="w-full" disabled={loading || !email} onClick={passwordLogin}>
                Entrar com senha
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link href="/resultado" className="underline">
                  Resultado público
                </Link>
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="order-1 relative hidden overflow-hidden lg:order-1 lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.20),transparent_36%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.14),transparent_34%),radial-gradient(circle_at_60%_80%,rgba(255,255,255,0.1),transparent_42%)]" />
          <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(to_right,rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:40px_40px]" />
          <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute -right-16 bottom-16 h-80 w-80 rounded-full bg-cyan-200/20 blur-3xl" />

          <div className="relative z-10 flex w-full flex-col justify-end p-12 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100/90">Sertao Maker</p>
            <h2 className="mt-3 max-w-md text-3xl font-semibold leading-tight">
              Plataforma inteligente para avaliação e ranqueamento de projetos.
            </h2>
            <p className="mt-4 max-w-md text-sm text-blue-100/90">
              Ambiente com foco em governança, rastreabilidade e decisões baseadas em critérios técnicos.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
