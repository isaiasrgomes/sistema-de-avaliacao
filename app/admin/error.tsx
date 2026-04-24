"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
      <h1 className="text-lg font-semibold text-foreground">Erro ao carregar o painel</h1>
      <p className="text-sm text-muted-foreground">
        Em produção o detalhe do erro fica oculto no navegador. Consulte os logs da Vercel (Functions / Runtime Logs) ou
        rode <code className="rounded bg-muted px-1">npm run dev</code> localmente para ver a mensagem completa.
      </p>
      {error.digest ? (
        <p className="font-mono text-xs text-muted-foreground">
          Digest: <span className="select-all">{error.digest}</span>
        </p>
      ) : null}
      <Button type="button" onClick={() => reset()}>
        Tentar novamente
      </Button>
    </div>
  );
}
