"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { actionAplicarCota, actionGerarRanking, actionResultadoFinal, actionSalvarVagas } from "@/app/actions/admin";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

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

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border/70 bg-card/85 p-4 shadow-sm">
      <div className="space-y-2">
        <Label>Total de vagas</Label>
        <Input className="w-32" value={vagas} onChange={(e) => setVagas(e.target.value)} />
      </div>
      <Button
        variant="secondary"
        onClick={async () => {
          await actionSalvarVagas(Number(vagas));
          toast.success("Vagas salvas");
        }}
      >
        Salvar vagas
      </Button>
      <Button
        onClick={async () => {
          try {
            const r = await actionGerarRanking();
            toast.success(`Ranking gerado: ${r.total} projetos`);
            window.location.reload();
          } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Erro");
          }
        }}
      >
        Gerar ranking
      </Button>
      <Button
        variant="outline"
        onClick={async () => {
          try {
            const r = await actionAplicarCota();
            toast.success(`Cota aplicada — selecionados: ${r.selecionados}`);
            window.location.reload();
          } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Erro");
          }
        }}
      >
        Aplicar cota Sertão
      </Button>
      <Button
        variant="default"
        onClick={async () => {
          await actionResultadoFinal();
          toast.success("Resultado final liberado para página pública");
          window.location.reload();
        }}
      >
        Gerar resultado final (público)
      </Button>
      <div className="flex items-center gap-2">
        <Badge variant="outline">Fase: {fase}</Badge>
        {liberado && <Badge>Resultado público ativo</Badge>}
      </div>
    </div>
  );
}
