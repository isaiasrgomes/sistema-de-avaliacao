"use client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { SectionCard, SectionCardHeader } from "@/components/layout/section-card";

export default function RelatoriosPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Relatorios"
        description="Exportacoes em CSV e PDF (autenticado como coordenador)."
      />
      <SectionCard>
        <SectionCardHeader title="CSV" description="Ranking completo" className="border-0 pb-4" />
        <Button asChild>
          <a href="/api/export/ranking" target="_blank" rel="noreferrer">
            Baixar ranking CSV
          </a>
        </Button>
      </SectionCard>
      <SectionCard>
        <SectionCardHeader
          title="PDF"
          description="Resultado preliminar e final em ordem alfabética"
          className="border-0 pb-4"
        />
        <div className="flex flex-wrap gap-2">
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
        </div>
      </SectionCard>
      <SectionCard>
        <SectionCardHeader
          title="Parecer por projeto"
          description="Informe o ID do projeto na URL de API ou use o painel (copie da tabela)."
          className="border-0 pb-4"
        />
        <p className="text-sm text-muted-foreground">Ex.: /api/relatorios/pdf?tipo=PARECER&amp;projetoId=UUID</p>
      </SectionCard>
    </div>
  );
}
