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
  nome_projeto: string;
  projeto_status: string;
  municipio: string;
  fase: string;
  nome_responsavel: string;
};

function statusAtribuicaoClass(status: string) {
  switch (status) {
    case "CONCLUIDA":
      return "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:border-emerald-300/40 dark:bg-emerald-300/15 dark:text-emerald-200";
    case "EM_ANDAMENTO":
      return "border-amber-500/35 bg-amber-500/10 text-amber-700 dark:border-amber-300/40 dark:bg-amber-300/15 dark:text-amber-200";
    default:
      return "border-sky-500/35 bg-sky-500/10 text-sky-700 dark:border-sky-300/40 dark:bg-sky-300/15 dark:text-sky-200";
  }
}

function statusProjetoClass(status: string) {
  switch (status) {
    case "EM_AVALIACAO":
      return "border-violet-500/35 bg-violet-500/10 text-violet-700 dark:border-violet-300/40 dark:bg-violet-300/15 dark:text-violet-200";
    case "AGUARDANDO_3O_AVALIADOR":
      return "border-orange-500/35 bg-orange-500/10 text-orange-700 dark:border-orange-300/40 dark:bg-orange-300/15 dark:text-orange-200";
    case "AVALIADO":
      return "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:border-emerald-300/40 dark:bg-emerald-300/15 dark:text-emerald-200";
    default:
      return "border-muted-foreground/30 bg-muted/40 text-foreground dark:border-muted-foreground/40 dark:bg-muted/30 dark:text-foreground";
  }
}

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
              <TableHead>Detalhes</TableHead>
              <TableHead>Status atribuição</TableHead>
              <TableHead>Status projeto</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.nome_projeto}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {a.nome_responsavel} - {a.municipio} - {a.fase}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`whitespace-nowrap ${statusAtribuicaoClass(a.status)}`}>
                    {getStatusLabel(a.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`whitespace-nowrap ${statusProjetoClass(a.projeto_status)}`}>
                    {getStatusLabel(a.projeto_status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link prefetch href={`/avaliador/projeto/${a.projeto_id}?atribuicao=${a.id}`}>
                        Visualizar projeto
                      </Link>
                    </Button>
                    {prazoBloqueado && a.status !== "CONCLUIDA" ? (
                      <Button size="sm" disabled>
                        Prazo encerrado
                      </Button>
                    ) : (
                      <Button asChild size="sm">
                        <Link prefetch href={`/avaliador/projeto/${a.projeto_id}/avaliar?atribuicao=${a.id}`}>
                          {a.status === "CONCLUIDA" ? "Editar avaliação" : "Avaliar"}
                        </Link>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
