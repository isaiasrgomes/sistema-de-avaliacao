"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SertaoMakerBrand } from "@/components/brand-logo";
import { toast } from "sonner";
import { destinoAposLogin } from "@/lib/auth/destino-pos-login";

export function CadastroAvaliadorForm() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [senha2, setSenha2] = useState("");
  const [loading, setLoading] = useState(false);

  async function criarConta() {
    if (!nome.trim() || !email.trim() || !senha) {
      toast.error("Preencha nome, e-mail e senha.");
      return;
    }
    if (senha.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== senha2) {
      toast.error("As senhas não conferem.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/aguardando-aprovacao")}`,
        data: { nome: nome.trim() },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session && data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, cadastro_aprovado")
        .eq("id", data.user.id)
        .single();
      window.location.href = destinoAposLogin(profile?.role, profile?.cadastro_aprovado, "/avaliador");
      return;
    }
    toast.success("Conta criada. Verifique o e-mail para confirmar o cadastro, se solicitado.");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await criarConta();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="order-2 flex items-center justify-center px-4 py-8 sm:px-8 lg:order-2 lg:px-12">
          <Card className="w-full max-w-md border-border/70 bg-card/90 shadow-lg backdrop-blur">
            <CardHeader className="space-y-4">
              <Button variant="ghost" size="sm" className="-ml-2 w-fit gap-1 text-muted-foreground" asChild>
                <Link href="/login">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao login
                </Link>
              </Button>
              <SertaoMakerBrand variant="full" align="center" className="justify-center" />
              <CardTitle className="sr-only">Cadastro de avaliador</CardTitle>
              <CardDescription>
                Após criar a conta, um coordenador precisa aprovar seu cadastro para liberar o acesso às avaliações.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome completo</Label>
                  <Input
                    id="nome"
                    autoComplete="name"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome"
                  />
                </div>
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
                  <Label htmlFor="senha">Senha</Label>
                  <Input
                    id="senha"
                    type="password"
                    autoComplete="new-password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha2">Confirmar senha</Label>
                  <Input
                    id="senha2"
                    type="password"
                    autoComplete="new-password"
                    value={senha2}
                    onChange={(e) => setSenha2(e.target.value)}
                  />
                </div>
                <Button className="w-full" type="submit" disabled={loading}>
                  {loading ? "Criando conta…" : "Criar conta"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Já tem conta?{" "}
                  <Link href="/login" className="underline">
                    Entrar
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
            <h2 className="mt-3 max-w-md text-3xl font-semibold leading-tight">Cadastro de avaliadores</h2>
            <p className="mt-4 max-w-md text-sm text-white/90">
              O acesso à plataforma só é liberado após validação de um coordenador, mantendo o controle de quem pode
              avaliar projetos.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
