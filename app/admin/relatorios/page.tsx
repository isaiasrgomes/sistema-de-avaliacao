"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RelatoriosPage() {
  return (
    <div className="max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <p className="text-muted-foreground">Exportações em CSV e PDF (autenticado como coordenador).</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>CSV</CardTitle>
          <CardDescription>Ranking completo</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <a href="/api/export/ranking" target="_blank" rel="noreferrer">
              Baixar ranking CSV
            </a>
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>PDF</CardTitle>
          <CardDescription>Resultado preliminar e final em ordem alfabética</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <a href="/api/relatorios/pdf?tipo=PRELIMINAR" target="_blank" rel="noreferrer">
              Preliminar PDF
            </a>
          </Button>
          <Button asChild variant="secondary">
            <a href="/api/relatorios/pdf?tipo=FINAL" target="_blank" rel="noreferrer">
              Final PDF
            </a>
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Parecer por projeto</CardTitle>
          <CardDescription>Informe o ID do projeto na URL de API ou use o painel (copie da tabela).</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-2 text-sm text-muted-foreground">Ex.: /api/relatorios/pdf?tipo=PARECER&amp;projetoId=UUID</p>
        </CardContent>
      </Card>
    </div>
  );
}
