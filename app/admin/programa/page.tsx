import { createServerSupabase } from "@/lib/supabase/server";
import { getProgramaMonitorForPage } from "@/lib/programa/page-helper";
import { isProgramaFinalizado } from "@/lib/programa/context";
import { ProgramaClient } from "./programa-client";

export default async function ProgramaPage() {
  const supabase = await createServerSupabase();
  const programa = await getProgramaMonitorForPage(supabase);
  const readonly = isProgramaFinalizado(programa);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/70 bg-card/80 p-5 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Programa e prazos</h1>
        <p className="text-sm text-muted-foreground">
          Nome do edital, período de avaliações, quantidade de avaliadores por proposta e prorrogação única do prazo
          final. Lembretes por e-mail usam Resend (variáveis RESEND_API_KEY e EMAIL_FROM).
        </p>
      </div>
      {readonly ? (
        <p className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Programa finalizado — configurações em somente leitura.
        </p>
      ) : null}
      <ProgramaClient
        readonly={readonly}
        initial={{
          programa_nome: programa.nome,
          avaliacoes_inicio: programa.avaliacoes_inicio,
          avaliacoes_fim: programa.avaliacoes_fim,
          prorrogacao_fim: programa.prorrogacao_fim,
          prorrogacao_utilizada: programa.prorrogacao_utilizada,
          avaliadores_por_projeto: programa.avaliadores_por_projeto,
        }}
      />
    </div>
  );
}
