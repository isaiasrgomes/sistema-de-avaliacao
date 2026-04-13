"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Row = {
  nome_projeto: string;
  nome_responsavel: string;
  municipio: string;
  status_final: string;
};

export default function ResultadoPublicoPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState("Carregando…");

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const { data, error } = await supabase
        .from("resultados")
        .select("status_final, projetos(nome_projeto, nome_responsavel, municipio)")
        .in("status_final", ["SELECIONADO", "SUPLENTE"]);

      if (error) {
        setMsg(error.message);
        return;
      }
      const list: Row[] = (data ?? []).map((r) => {
        const p = r.projetos as unknown as { nome_projeto: string; nome_responsavel: string; municipio: string };
        return {
          nome_projeto: p.nome_projeto,
          nome_responsavel: p.nome_responsavel,
          municipio: p.municipio,
          status_final: r.status_final as string,
        };
      });
      list.sort((a, b) => a.nome_projeto.localeCompare(b.nome_projeto, "pt-BR"));
      setRows(list);
      setMsg(list.length ? "" : "Nenhum resultado público disponível ainda.");
    })();
  }, []);

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-primary">Sertão Inovador — Resultado</h1>
        <p className="text-muted-foreground">Edital 45/2026 — ordem alfabética</p>
      </div>
      {msg && <p className="text-center text-sm text-muted-foreground">{msg}</p>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Projeto</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Município</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.nome_projeto + r.nome_responsavel}>
              <TableCell className="font-medium">{r.nome_projeto}</TableCell>
              <TableCell>{r.nome_responsavel}</TableCell>
              <TableCell>{r.municipio}</TableCell>
              <TableCell>{r.status_final === "SELECIONADO" ? "Selecionado" : "Suplente"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </main>
  );
}
