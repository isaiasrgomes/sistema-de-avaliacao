"use client";

import { useMemo, useState } from "react";
import type { ResultadoStatusFinal } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SectionCard, TableSection } from "@/components/layout/section-card";
import { StatusBadge } from "@/components/ui/status-badge";

export type RankingTableRow = {
  id: string;
  projeto_id: string;
  posicao_geral: number | null;
  nota_final: number;
  status_final: ResultadoStatusFinal;
  enquadramento_cota: boolean;
  projeto: {
    nome_projeto: string;
    nome_responsavel: string;
    municipio: string;
  };
  stats: {
    qtdNotas: number;
    cvPct: number | null;
    mediaNotaFinal: number | null;
  };
};

type StatusFiltro = ResultadoStatusFinal | "";
type Ordenacao = "RANKING" | "AZ" | "ZA";

const STATUS_OPCOES: { value: StatusFiltro; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "SELECIONADO", label: "Selecionado" },
  { value: "SUPLENTE", label: "Suplente" },
  { value: "NAO_SELECIONADO", label: "Não selecionado" },
];

const ORDENACAO_OPCOES: { value: Ordenacao; label: string }[] = [
  { value: "RANKING", label: "Posição no ranking" },
  { value: "AZ", label: "Projeto (A → Z)" },
  { value: "ZA", label: "Projeto (Z → A)" },
];

function compareRanking(a: RankingTableRow, b: RankingTableRow) {
  const pa = a.posicao_geral ?? Number.MAX_SAFE_INTEGER;
  const pb = b.posicao_geral ?? Number.MAX_SAFE_INTEGER;
  return pa - pb;
}

function compareAlfabetico(a: RankingTableRow, b: RankingTableRow, dir: "AZ" | "ZA") {
  const cmp = a.projeto.nome_projeto.localeCompare(b.projeto.nome_projeto, "pt-BR", { sensitivity: "base" });
  return dir === "AZ" ? cmp : -cmp;
}

function rowMatchesBusca(row: RankingTableRow, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    row.projeto.nome_projeto,
    row.projeto.nome_responsavel,
    row.projeto.municipio,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function RankingTable({ rows }: { rows: RankingTableRow[] }) {
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>("");
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("RANKING");
  const [busca, setBusca] = useState("");

  const exibidos = useMemo(() => {
    let list = rows;
    if (statusFiltro) {
      list = list.filter((r) => r.status_final === statusFiltro);
    }
    if (busca.trim()) {
      list = list.filter((r) => rowMatchesBusca(r, busca));
    }
    const sorted = [...list];
    if (ordenacao === "RANKING") {
      sorted.sort(compareRanking);
    } else {
      sorted.sort((a, b) => compareAlfabetico(a, b, ordenacao));
    }
    return sorted;
  }, [rows, statusFiltro, busca, ordenacao]);

  const temFiltros = Boolean(statusFiltro || busca.trim() || ordenacao !== "RANKING");

  const emptyMessage = busca.trim()
    ? "Nenhum projeto encontrado para esta busca."
    : statusFiltro
      ? "Nenhum projeto com este status."
      : "Nenhum projeto no ranking.";

  return (
    <div className="space-y-3">
      <SectionCard className="grid gap-3 md:grid-cols-3">
        <div className="space-y-2 md:col-span-3">
          <Label htmlFor="ranking-busca">Pesquisar projeto</Label>
          <Input
            id="ranking-busca"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nome do projeto, responsável ou município..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ranking-status-filtro">Status</Label>
          <select
            id="ranking-status-filtro"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value as StatusFiltro)}
          >
            {STATUS_OPCOES.map((o) => (
              <option key={o.value || "todos"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ranking-ordenacao">Ordenar por</Label>
          <select
            id="ranking-ordenacao"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={ordenacao}
            onChange={(e) => setOrdenacao(e.target.value as Ordenacao)}
          >
            {ORDENACAO_OPCOES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col justify-end gap-2">
          <p className="text-sm text-muted-foreground">
            {exibidos.length} de {rows.length} projeto{rows.length === 1 ? "" : "s"}
          </p>
          {temFiltros ? (
            <Button
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => {
                setStatusFiltro("");
                setBusca("");
                setOrdenacao("RANKING");
              }}
            >
              Limpar filtros
            </Button>
          ) : null}
        </div>
      </SectionCard>

      <TableSection>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pos.</TableHead>
              <TableHead>Projeto</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Município</TableHead>
              <TableHead className="text-right">Notas</TableHead>
              <TableHead className="text-right">Dif. %</TableHead>
              <TableHead>Nota final</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cota</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exibidos.length ? (
              exibidos.map((r) => {
                const notaFinalExibida = r.stats.mediaNotaFinal ?? r.nota_final;
                return (
                  <TableRow key={r.id}>
                    <TableCell>{r.posicao_geral ?? "—"}</TableCell>
                    <TableCell className="font-medium">{r.projeto.nome_projeto}</TableCell>
                    <TableCell>{r.projeto.nome_responsavel}</TableCell>
                    <TableCell>{r.projeto.municipio}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.stats.qtdNotas || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.stats.cvPct === null ? "—" : r.stats.cvPct.toFixed(2)}
                    </TableCell>
                    <TableCell className="tabular-nums">{notaFinalExibida.toFixed(2)}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.status_final} />
                    </TableCell>
                    <TableCell>{r.enquadramento_cota ? "Sim" : "—"}</TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableSection>
    </div>
  );
}
