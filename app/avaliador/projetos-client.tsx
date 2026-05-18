"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SectionCard, TableSection } from "@/components/layout/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ClipboardList } from "lucide-react";

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
        <SectionCard className="border-amber-500/40 bg-amber-500/10 text-sm text-muted-foreground">
          {motivoBloqueioPrazo ?? "O prazo de avaliações está encerrado no momento."}
        </SectionCard>
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
      {filtrados.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nenhum projeto neste filtro"
          description="Altere o filtro acima para ver outras atribuições."
        />
      ) : (
        <TableSection>
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
                    <StatusBadge status={a.status} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={a.projeto_status} />
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
        </TableSection>
      )}
    </>
  );
}
