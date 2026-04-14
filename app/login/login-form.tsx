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
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
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
    </div>
  );
}
