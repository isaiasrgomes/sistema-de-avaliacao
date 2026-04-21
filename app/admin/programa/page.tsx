import { createServerSupabase } from "@/lib/supabase/server";
import { ProgramaClient } from "./programa-client";

export default async function ProgramaPage() {
  const supabase = await createServerSupabase();
  const { data: cfg } = await supabase
    .from("app_config")
    .select(
      "programa_nome, avaliacoes_inicio, avaliacoes_fim, prorrogacao_fim, prorrogacao_utilizada, avaliadores_por_projeto"
    )
    .eq("id", 1)
    .single();

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/70 bg-card/80 p-5 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Programa e prazos</h1>
        <p className="text-sm text-muted-foreground">
          Nome do edital, período de avaliações, quantidade de avaliadores por proposta e prorrogação única do prazo
          final. Lembretes por e-mail usam Resend (variáveis RESEND_API_KEY e EMAIL_FROM).
        </p>
      </div>
      <ProgramaClient
        initial={{
          programa_nome: cfg?.programa_nome ?? null,
          avaliacoes_inicio: cfg?.avaliacoes_inicio ?? null,
          avaliacoes_fim: cfg?.avaliacoes_fim ?? null,
          prorrogacao_fim: cfg?.prorrogacao_fim ?? null,
          prorrogacao_utilizada: cfg?.prorrogacao_utilizada ?? false,
          avaliadores_por_projeto: cfg?.avaliadores_por_projeto ?? 2,
        }}
      />
    </div>
  );
}
