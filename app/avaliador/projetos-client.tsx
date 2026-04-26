"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getStatusLabel } from "@/lib/utils/status";

type Row = {
  id: string;
  status: string;
  projeto_id: string;
  ordem: number;
  nome_projeto: string;
  projeto_status: string;
};

export function ProjetosAvaliadorClient({
  rows,
  prazoBloqueado = false,
  motivoBloqueioPrazo,
}: {
  rows: Row[];
  prazoBloqueado?: boolean;
  motivoBloqueioPrazo?: string;
}) {
  const [filtro, setFiltro] = useState<"TODOS" | "PENDENTES" | "AVALIADOS">("PENDENTES");

  const filtrados = useMemo(() => {
    if (filtro === "TODOS") return rows;
    if (filtro === "AVALIADOS") return rows.filter((r) => r.status === "CONCLUIDA");
    return rows.filter((r) => r.status !== "CONCLUIDA");
  }, [filtro, rows]);

  return (
    <>
      {prazoBloqueado && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-muted-foreground">
          {motivoBloqueioPrazo ?? "O prazo de avaliações está encerrado no momento."}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant={filtro === "PENDENTES" ? "default" : "outline"} size="sm" onClick={() => setFiltro("PENDENTES")}>
          Pendentes
        </Button>
        <Button variant={filtro === "AVALIADOS" ? "default" : "outline"} size="sm" onClick={() => setFiltro("AVALIADOS")}>
          Já avaliados
        </Button>
        <Button variant={filtro === "TODOS" ? "default" : "outline"} size="sm" onClick={() => setFiltro("TODOS")}>
          Todos
        </Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card/85 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Projeto</TableHead>
              <TableHead>Ordem</TableHead>
              <TableHead>Status atribuição</TableHead>
              <TableHead>Projeto (status)</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.nome_projeto}</TableCell>
                <TableCell>{a.ordem}</TableCell>
                <TableCell>
                  <Badge variant="outline">{getStatusLabel(a.status)}</Badge>
                </TableCell>
                <TableCell>{getStatusLabel(a.projeto_status)}</TableCell>
                <TableCell className="text-right">
                  {prazoBloqueado && a.status !== "CONCLUIDA" ? (
                    <Button size="sm" variant="outline" disabled>
                      Prazo encerrado
                    </Button>
                  ) : (
                    <Button asChild size="sm">
                      <Link prefetch href={`/avaliador/projeto/${a.projeto_id}?atribuicao=${a.id}`}>
                        Abrir
                      </Link>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
