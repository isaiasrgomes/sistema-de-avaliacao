"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  actionAtribuicaoAuto,
  actionAtribuicaoManual,
  actionAtribuirTerceiro,
  actionSubstituirAvaliador,
} from "@/app/actions/admin";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type PendSub = {
  id: string;
  ordem: number;
  status: string;
  projeto_id: string;
  nome_projeto: string;
  responsavel_nome: string;
  municipio: string;
  avaliador_nome: string;
  avaliador_id: string;
};

export function AtribuicoesClient({
  projetos,
  avaliadores,
  nAvaliadores,
  pendentesSubstituicao,
}: {
  projetos: { id: string; nome_projeto: string; status: string }[];
  avaliadores: { id: string; nome: string; email: string }[];
  nAvaliadores: number;
  pendentesSubstituicao: PendSub[];
}) {
  const [projetoId, setProjetoId] = useState("");
  const [manualIds, setManualIds] = useState<string[]>(() => Array(Math.max(1, nAvaliadores)).fill(""));
  const [projetoTerceiro, setProjetoTerceiro] = useState("");
  const [a3, setA3] = useState("");
  const [subNovo, setSubNovo] = useState<Record<string, string>>({});
  const [isManualLoading, setIsManualLoading] = useState(false);
  const [isTerceiroLoading, setIsTerceiroLoading] = useState(false);
  const [isAutoLoading, setIsAutoLoading] = useState(false);
  const [subLoading, setSubLoading] = useState<string | null>(null);

  useEffect(() => {
    setManualIds((prev) => {
      const n = Math.max(1, nAvaliadores);
      if (prev.length === n) return prev;
      return Array(n).fill("");
    });
  }, [nAvaliadores]);

  const projetosSub = (() => {
    const map = new Map<
      string,
      { projeto_id: string; nome_projeto: string; responsavel_nome: string; municipio: string; itens: PendSub[] }
    >();
    for (const row of pendentesSubstituicao) {
      const cur = map.get(row.projeto_id);
      if (cur) cur.itens.push(row);
      else {
        map.set(row.projeto_id, {
          projeto_id: row.projeto_id,
          nome_projeto: row.nome_projeto,
          responsavel_nome: row.responsavel_nome,
          municipio: row.municipio,
          itens: [row],
        });
      }
    }
    return [...map.values()].sort((a, b) => a.nome_projeto.localeCompare(b.nome_projeto, "pt-BR"));
  })();

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
          <h2 className="font-semibold">Avaliador extra (CV ≥ 30%)</h2>
          <p className="text-sm text-muted-foreground">
            Projetos em <code>AGUARDANDO_3O_AVALIADOR</code> recebem mais um avaliador (próxima ordem livre).
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
            {isTerceiroLoading ? "Processando..." : "Atribuir avaliador extra"}
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

      <div className="overflow-hidden rounded-xl border border-border/70 bg-card/85 shadow-sm">
        <div className="border-b border-border/70 px-4 py-3">
          <h2 className="font-semibold">Substituir avaliador</h2>
          <p className="text-sm text-muted-foreground">
            Use quando o avaliador designado não vai participar e ainda não enviou a avaliação. Escolha outro avaliador
            ativo (sem impedimento).
          </p>
        </div>
        {projetosSub.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Nenhuma atribuição pendente para substituição.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projeto</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Município</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projetosSub.map((p) => (
                <TableRow key={p.projeto_id}>
                  <TableCell className="font-medium">{p.nome_projeto}</TableCell>
                  <TableCell>{p.responsavel_nome}</TableCell>
                  <TableCell>{p.municipio}</TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          Mostrar projeto
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>{p.nome_projeto}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-1 text-sm">
                          <p>
                            <strong>Responsável:</strong> {p.responsavel_nome}
                          </p>
                          <p>
                            <strong>Município:</strong> {p.municipio}
                          </p>
                        </div>
                        <div className="overflow-hidden rounded-lg border border-border/70 bg-background/30">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Avaliador atual</TableHead>
                                <TableHead>Ordem</TableHead>
                                <TableHead>Substituir por</TableHead>
                                <TableHead className="text-right">Ação</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {p.itens
                                .slice()
                                .sort((a, b) => a.ordem - b.ordem)
                                .map((row) => (
                                  <TableRow key={row.id}>
                                    <TableCell className="font-medium">{row.avaliador_nome}</TableCell>
                                    <TableCell>{row.ordem}</TableCell>
                                    <TableCell>
                                      <select
                                        className="flex h-9 w-full max-w-[240px] rounded-md border px-2 text-sm"
                                        value={subNovo[row.id] ?? ""}
                                        onChange={(e) => setSubNovo((s) => ({ ...s, [row.id]: e.target.value }))}
                                      >
                                        <option value="">Selecione…</option>
                                        {avaliadores
                                          .filter((a) => a.id !== row.avaliador_id)
                                          .map((a) => (
                                            <option key={a.id} value={a.id}>
                                              {a.nome}
                                            </option>
                                          ))}
                                      </select>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={!subNovo[row.id] || subLoading === row.id}
                                        onClick={async () => {
                                          const novo = subNovo[row.id];
                                          if (!novo) return;
                                          try {
                                            setSubLoading(row.id);
                                            await actionSubstituirAvaliador(row.id, novo);
                                            toast.success("Avaliador substituído");
                                            window.location.reload();
                                          } catch (e: unknown) {
                                            toast.error(e instanceof Error ? e.message : "Erro");
                                          } finally {
                                            setSubLoading(null);
                                          }
                                        }}
                                      >
                                        {subLoading === row.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Substituir
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
