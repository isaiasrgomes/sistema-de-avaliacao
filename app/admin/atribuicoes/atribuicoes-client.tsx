"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { actionAtribuicaoAuto, actionAtribuicaoManual, actionAtribuirTerceiro } from "@/app/actions/admin";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function AtribuicoesClient({
  projetos,
  avaliadores,
}: {
  projetos: { id: string; nome_projeto: string; status: string }[];
  avaliadores: { id: string; nome: string; email: string }[];
}) {
  const [projetoId, setProjetoId] = useState("");
  const [a1, setA1] = useState("");
  const [a2, setA2] = useState("");
  const [projetoTerceiro, setProjetoTerceiro] = useState("");
  const [a3, setA3] = useState("");
  const [isManualLoading, setIsManualLoading] = useState(false);
  const [isTerceiroLoading, setIsTerceiroLoading] = useState(false);
  const [isAutoLoading, setIsAutoLoading] = useState(false);

  return (
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
        <div className="space-y-2">
          <Label>Avaliador 1</Label>
          <select className="flex h-10 w-full rounded-md border px-3 text-sm" value={a1} onChange={(e) => setA1(e.target.value)}>
            <option value="">—</option>
            {avaliadores.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Avaliador 2</Label>
          <select className="flex h-10 w-full rounded-md border px-3 text-sm" value={a2} onChange={(e) => setA2(e.target.value)}>
            <option value="">—</option>
            {avaliadores.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
        </div>
        <Button
          disabled={!projetoId || !a1 || !a2 || a1 === a2 || isManualLoading}
          onClick={async () => {
            try {
              setIsManualLoading(true);
              await actionAtribuicaoManual(projetoId, a1, a2);
              toast.success("Atribuições salvas");
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
        <h2 className="font-semibold">3º avaliador (CV ≥ 30%)</h2>
        <p className="text-sm text-muted-foreground">
          Projetos em <code>AGUARDANDO_3O_AVALIADOR</code> precisam de uma terceira atribuição (ordem 3).
        </p>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={projetoTerceiro}
          onChange={(e) => setProjetoTerceiro(e.target.value)}
        >
          <option value="">Selecione projeto em aguardo…</option>
          {projetos
            .filter((p) => p.status === "AGUARDANDO_3O_AVALIADOR")
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
              toast.success("3º avaliador atribuído");
              window.location.reload();
            } catch (e: unknown) {
              toast.error(e instanceof Error ? e.message : "Erro");
            } finally {
              setIsTerceiroLoading(false);
            }
          }}
        >
          {isTerceiroLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isTerceiroLoading ? "Processando..." : "Atribuir 3º"}
        </Button>
      </div>
      <div className="space-y-4 rounded-xl border border-border/70 bg-card/85 p-4 shadow-sm">
        <h2 className="font-semibold">Automático</h2>
        <p className="text-sm text-muted-foreground">
          Distribui 2 avaliadores por projeto sem atribuição prévia, equilibrando carga e respeitando impedimentos cadastrados.
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
  );
}
