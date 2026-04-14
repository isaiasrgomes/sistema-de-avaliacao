"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { actionAplicarCota, actionGerarRanking, actionResultadoFinal, actionSalvarVagas } from "@/app/actions/admin";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export function RankingClient({
  totalVagasInicial,
  fase,
  liberado,
}: {
  totalVagasInicial: number;
  fase: string;
  liberado: boolean;
}) {
  const [vagas, setVagas] = useState(String(totalVagasInicial));
  const [loadingKey, setLoadingKey] = useState<"vagas" | "ranking" | "cota" | "final" | null>(null);

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border/70 bg-card/85 p-4 shadow-sm">
      <div className="space-y-2">
        <Label>Total de vagas</Label>
        <Input className="w-32" value={vagas} onChange={(e) => setVagas(e.target.value)} />
      </div>
      <Button
        variant="secondary"
        disabled={loadingKey !== null}
        onClick={async () => {
          try {
            setLoadingKey("vagas");
            await actionSalvarVagas(Number(vagas));
            toast.success("Vagas salvas");
          } finally {
            setLoadingKey(null);
          }
        }}
      >
        {loadingKey === "vagas" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loadingKey === "vagas" ? "Processando..." : "Salvar vagas"}
      </Button>
      <Button
        disabled={loadingKey !== null}
        onClick={async () => {
          try {
            setLoadingKey("ranking");
            const r = await actionGerarRanking();
            toast.success(`Ranking gerado: ${r.total} projetos`);
            window.location.reload();
          } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Erro");
          } finally {
            setLoadingKey(null);
          }
        }}
      >
        {loadingKey === "ranking" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loadingKey === "ranking" ? "Processando..." : "Gerar ranking"}
      </Button>
      <Button
        variant="outline"
        disabled={loadingKey !== null}
        onClick={async () => {
          try {
            setLoadingKey("cota");
            const r = await actionAplicarCota();
            toast.success(`Cota aplicada — selecionados: ${r.selecionados}`);
            window.location.reload();
          } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Erro");
          } finally {
            setLoadingKey(null);
          }
        }}
      >
        {loadingKey === "cota" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loadingKey === "cota" ? "Processando..." : "Aplicar cota Sertão"}
      </Button>
      <Button
        variant="default"
        disabled={loadingKey !== null}
        onClick={async () => {
          try {
            setLoadingKey("final");
            await actionResultadoFinal();
            toast.success("Resultado final liberado para página pública");
            window.location.reload();
          } finally {
            setLoadingKey(null);
          }
        }}
      >
        {loadingKey === "final" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loadingKey === "final" ? "Processando..." : "Gerar resultado final (público)"}
      </Button>
      <div className="flex items-center gap-2">
        <Badge variant="outline">Fase: {fase}</Badge>
        {liberado && <Badge>Resultado público ativo</Badge>}
      </div>
    </div>
  );
}
