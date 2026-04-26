import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { podeEnviarAvaliacaoAgora } from "@/lib/prazo-avaliacoes";
import { AvaliacaoForm } from "../avaliacao-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStatusLabel } from "@/lib/utils/status";

function statusBadgeClass(status: string) {
  switch (status) {
    case "INSCRITO":
      return "border-slate-500/35 bg-slate-500/10 text-slate-700 dark:border-slate-300/35 dark:bg-slate-200/10 dark:text-slate-200";
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

export default async function AvaliarProjetoPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { atribuicao?: string };
}) {
  const supabase = await createServerSupabase();
  const { data: projeto } = await supabase.from("projetos").select("*").eq("id", params.id).single();
  const atribId = searchParams.atribuicao;
  const { data: atrib } = atribId
    ? await supabase.from("atribuicoes").select("*").eq("id", atribId).single()
    : { data: null };

  const { data: exist } = atribId
    ? await supabase.from("avaliacoes").select("*").eq("atribuicao_id", atribId).maybeSingle()
    : { data: null };

  const { data: cfgPrazo } = await supabase
    .from("app_config")
    .select("avaliacoes_inicio, avaliacoes_fim, prorrogacao_fim, prorrogacao_utilizada")
    .eq("id", 1)
    .maybeSingle();
  const prazoEnvio = cfgPrazo ? podeEnviarAvaliacaoAgora(cfgPrazo) : { ok: true as const };

  if (!projeto) return <p>Projeto não encontrado.</p>;
  const visualizarHref = atribId ? `/avaliador/projeto/${projeto.id}?atribuicao=${atribId}` : `/avaliador/projeto/${projeto.id}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-3 rounded-xl border border-border/70 bg-card/80 p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-2xl font-bold">Avaliação: {projeto.nome_projeto}</h1>
          <Badge variant="outline" className={statusBadgeClass(projeto.status)}>
            {getStatusLabel(projeto.status)}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={visualizarHref}>Visualizar projeto</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/docs/manual-avaliador.pdf" target="_blank" rel="noreferrer">
              Manual do avaliador
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/docs/regulamento.pdf" target="_blank" rel="noreferrer">
              Regulamento (edital)
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/avaliador">Voltar para lista</Link>
          </Button>
        </div>
      </div>

      <AvaliacaoForm
        projetoId={projeto.id}
        atribuicaoId={atrib?.id ?? ""}
        readOnly={!!exist || atrib?.status === "CONCLUIDA"}
        motivoBloqueioPrazo={!prazoEnvio.ok ? prazoEnvio.motivo : undefined}
        initial={exist ?? undefined}
      />
    </div>
  );
}
