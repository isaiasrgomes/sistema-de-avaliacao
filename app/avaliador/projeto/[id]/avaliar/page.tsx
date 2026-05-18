import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { podeEnviarAvaliacaoAgora } from "@/lib/prazo-avaliacoes";
import { AvaliacaoForm } from "../avaliacao-form";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/layout/section-card";
import { StatusBadge } from "@/components/ui/status-badge";

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
  const possuiAvaliacao = !!exist;
  const somenteLeitura = possuiAvaliacao && !prazoEnvio.ok;

  if (!projeto) return <p>Projeto não encontrado.</p>;
  const visualizarHref = atribId ? `/avaliador/projeto/${projeto.id}?atribuicao=${atribId}` : `/avaliador/projeto/${projeto.id}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SectionCard className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-2xl font-bold">Avaliação: {projeto.nome_projeto}</h1>
          <StatusBadge status={projeto.status} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={visualizarHref}>Visualizar projeto</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="bg-red-600 text-white hover:bg-red-700 dark:bg-emerald-600 dark:text-white dark:hover:bg-emerald-700"
          >
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
      </SectionCard>

      <AvaliacaoForm
        projetoId={projeto.id}
        atribuicaoId={atrib?.id ?? ""}
        readOnly={somenteLeitura}
        motivoBloqueioPrazo={!prazoEnvio.ok && !possuiAvaliacao ? prazoEnvio.motivo : undefined}
        initial={exist ?? undefined}
      />
    </div>
  );
}
