"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { actionImportarCSV } from "@/app/actions/admin";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ImportarCsvCard({
  programaAtivoNome,
  importacaoDisponivel,
}: {
  programaAtivoNome?: string | null;
  importacaoDisponivel: boolean;
}) {
  const [csv, setCsv] = useState("");
  const [loading, setLoading] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    setCsv(text);
  }

  async function enviar() {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("csv", csv);
      const r = await actionImportarCSV(fd);
      toast.success(`Importação: +${r.inseridos} novos, ${r.atualizados} atualizados, ${r.ignorados} ignorados`);
      if (r.erros.length) toast.message(r.erros.slice(0, 5).join("; "));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importar CSV (Google Forms)</CardTitle>
        <CardDescription>
          {importacaoDisponivel && programaAtivoNome ? (
            <>
              Projetos importados serão vinculados ao programa em andamento:{" "}
              <span className="font-medium text-foreground">{programaAtivoNome}</span>.
            </>
          ) : (
            <>Não há programa em andamento. Crie uma edição ativa em Programas para habilitar a importação.</>
          )}{" "}
          Colunas são mapeadas automaticamente (equipe, mercado, tecnologia e setor de aplicação).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input type="file" accept=".csv,text/csv" onChange={onFile} disabled={!importacaoDisponivel} />
        <Textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={16}
          placeholder="Cole CSV aqui..."
          disabled={!importacaoDisponivel}
        />
        <Button disabled={loading || !csv.trim() || !importacaoDisponivel} onClick={enviar}>
          {loading ? "Importando…" : "Importar"}
        </Button>
      </CardContent>
    </Card>
  );
}
