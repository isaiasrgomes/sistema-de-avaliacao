"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { getUserFriendlyErrorMessage } from "@/lib/utils/user-friendly-error";

export default function RedefinirSenhaPage() {
  const [senha, setSenha] = useState("");
  const [senha2, setSenha2] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessaoPronta, setSessaoPronta] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (typeof window === "undefined") return;
      const href = window.location.href;
      const hashIndex = href.indexOf("#");
      if (hashIndex === -1) {
        setSessaoPronta(true);
        return;
      }
      const hash = new URLSearchParams(href.slice(hashIndex + 1));
      const access_token = hash.get("access_token");
      const refresh_token = hash.get("refresh_token");
      if (!access_token || !refresh_token) {
        setSessaoPronta(true);
        return;
      }
      const supabase = createClient();
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) {
        toast.error(getUserFriendlyErrorMessage(error, "Não foi possível validar o link. Solicite um novo e-mail de recuperação."));
        setSessaoPronta(true);
        return;
      }
      const u = new URL(window.location.href);
      u.hash = "";
      window.history.replaceState({}, "", u.pathname + u.search);
      setSessaoPronta(true);
    };
    void run();
  }, []);

  async function salvar() {
    if (senha.length < 6) {
      toast.error("A senha deve ter ao menos 6 caracteres.");
      return;
    }
    if (senha !== senha2) {
      toast.error("As senhas não conferem.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: senha });
    setLoading(false);
    if (error) {
      toast.error(getUserFriendlyErrorMessage(error, "Não foi possível atualizar sua senha."));
      return;
    }
    toast.success("Senha atualizada com sucesso. Faça login novamente.");
    window.location.href = "/login";
  }

  if (!sessaoPronta) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-background p-6 text-center">
        <p className="text-muted-foreground">Validando o link de recuperação…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/70 bg-card/90 shadow-lg">
        <CardHeader>
          <CardTitle>Redefinir senha</CardTitle>
          <CardDescription>Defina uma nova senha para sua conta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="senha">Nova senha</Label>
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
            <Label htmlFor="senha2">Confirmar nova senha</Label>
            <Input
              id="senha2"
              type="password"
              autoComplete="new-password"
              value={senha2}
              onChange={(e) => setSenha2(e.target.value)}
            />
          </div>
          <Button className="w-full" disabled={loading} onClick={salvar}>
            {loading ? "Salvando..." : "Salvar nova senha"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="underline">
              Voltar ao login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
