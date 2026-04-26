"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  actionAtribuicaoAuto,
  actionAtribuicaoManual,
  actionAtribuirTerceiro,
} from "@/app/actions/admin";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function AtribuicoesClient({
  projetos,
  avaliadores,
  nAvaliadores,
}: {
  projetos: { id: string; nome_projeto: string; status: string }[];
  avaliadores: { id: string; nome: string; email: string }[];
  nAvaliadores: number;
}) {
  const [projetoId, setProjetoId] = useState("");
  const [manualIds, setManualIds] = useState<string[]>(() => Array(Math.max(1, nAvaliadores)).fill(""));
  const [projetoTerceiro, setProjetoTerceiro] = useState("");
  const [a3, setA3] = useState("");
  const [isManualLoading, setIsManualLoading] = useState(false);
  const [isTerceiroLoading, setIsTerceiroLoading] = useState(false);
  const [isAutoLoading, setIsAutoLoading] = useState(false);

  useEffect(() => {
    setManualIds((prev) => {
      const n = Math.max(1, nAvaliadores);
      if (prev.length === n) return prev;
      return Array(n).fill("");
    });
  }, [nAvaliadores]);

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 rounded-xl border border-border/70 bg-card/85 p-4 shadow-sm">
          <h2 className="font-semibold">Manual</h2>
          <div className="space-y-2">
            <Label>Projeto</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={projetoId}
              onChange={(e) => setProjetoId(e.target.value)}
            >
              <option value="">Selecione…</option>
              {projetos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome_projeto} ({p.status})
                </option>
              ))}
            </select>
          </div>
          {Array.from({ length: Math.max(1, nAvaliadores) }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Label>
                Avaliador {i + 1} de {nAvaliadores}
              </Label>
              <select
                className="flex h-10 w-full rounded-md border px-3 text-sm"
                value={manualIds[i] ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setManualIds((prev) => {
                    const next = [...prev];
                    next[i] = v;
                    return next;
                  });
                }}
              >
                <option value="">—</option>
                {avaliadores.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <Button
            disabled={!projetoId || manualIds.some((x) => !x) || new Set(manualIds).size !== manualIds.length || isManualLoading}
            onClick={async () => {
              try {
                setIsManualLoading(true);
                await actionAtribuicaoManual(projetoId, manualIds);
                toast.success("Atribuições salvas");
                window.location.reload();
              } catch (e: unknown) {
                toast.error(e instanceof Error ? e.message : "Erro");
              } finally {
                setIsManualLoading(false);
              }
            }}
          >
            {isManualLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isManualLoading ? "Processando..." : "Salvar manual"}
          </Button>
        </div>
        <div className="space-y-4 rounded-xl border border-border/70 bg-card/85 p-4 shadow-sm">
          <h2 className="font-semibold">Adicionar avaliador ao projeto</h2>
          <p className="text-sm text-muted-foreground">
            Adiciona um novo avaliador sem substituir os atuais (próxima ordem livre), inclusive quando alguém não puder
            concluir no prazo.
          </p>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={projetoTerceiro}
            onChange={(e) => setProjetoTerceiro(e.target.value)}
          >
              <option value="">Selecione projeto…</option>
            {projetos
              .filter((p) => ["INSCRITO", "EM_AVALIACAO", "AGUARDANDO_3O_AVALIADOR", "AVALIADO"].includes(p.status))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome_projeto}
                </option>
              ))}
          </select>
          <select className="flex h-10 w-full rounded-md border px-3 text-sm" value={a3} onChange={(e) => setA3(e.target.value)}>
            <option value="">Avaliador…</option>
            {avaliadores.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
          <Button
            variant="secondary"
            disabled={!projetoTerceiro || !a3 || isTerceiroLoading}
            onClick={async () => {
              try {
                setIsTerceiroLoading(true);
                await actionAtribuirTerceiro(projetoTerceiro, a3);
                toast.success("Avaliador atribuído");
                window.location.reload();
              } catch (e: unknown) {
                toast.error(e instanceof Error ? e.message : "Erro");
              } finally {
                setIsTerceiroLoading(false);
              }
            }}
          >
            {isTerceiroLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isTerceiroLoading ? "Processando..." : "Adicionar avaliador"}
          </Button>
        </div>
        <div className="space-y-4 rounded-xl border border-border/70 bg-card/85 p-4 shadow-sm">
          <h2 className="font-semibold">Automático</h2>
          <p className="text-sm text-muted-foreground">
            Distribui {nAvaliadores} avaliador(es) por projeto sem atribuição prévia, equilibrando carga e respeitando
            impedimentos.
          </p>
          <Button
            disabled={isAutoLoading}
            onClick={async () => {
              const ids = projetos.map((p) => p.id);
              try {
                setIsAutoLoading(true);
                const r = await actionAtribuicaoAuto(ids);
                toast.success(`Atribuições criadas: ${r.criadas ?? 0}`);
              } catch (e: unknown) {
                toast.error(e instanceof Error ? e.message : "Erro");
              } finally {
                setIsAutoLoading(false);
              }
            }}
          >
            {isAutoLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isAutoLoading ? "Processando..." : "Rodar automático (todos elegíveis)"}
          </Button>
        </div>
      </div>
    </div>
  );
}
