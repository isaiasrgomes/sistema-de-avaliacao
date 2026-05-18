import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProjetoDetalhesSetores } from "@/components/projeto-detalhes-setores";
import { SectionCard } from "@/components/layout/section-card";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function AvaliadorProjetoPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { atribuicao?: string };
}) {
  const supabase = await createServerSupabase();
  const { data: projeto } = await supabase.from("projetos").select("*").eq("id", params.id).single();
  const { data: avaliacaoExistente } = searchParams.atribuicao
    ? await supabase.from("avaliacoes").select("id").eq("atribuicao_id", searchParams.atribuicao).maybeSingle()
    : { data: null };

  if (!projeto) return <p>Projeto não encontrado.</p>;

  const avaliarHref = searchParams.atribuicao
    ? `/avaliador/projeto/${projeto.id}/avaliar?atribuicao=${searchParams.atribuicao}`
    : `/avaliador/projeto/${projeto.id}/avaliar`;
  const rotuloBotaoAvaliacao = avaliacaoExistente ? "Editar avaliação" : "Avaliar";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SectionCard className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-2xl font-bold">{projeto.nome_projeto}</h1>
          <StatusBadge status={projeto.status} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href={avaliarHref}>{rotuloBotaoAvaliacao}</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/avaliador">Voltar para lista</Link>
          </Button>
        </div>
        <p className="text-sm">
          <strong>Vídeo pitch:</strong>{" "}
          {projeto.url_video_pitch ? (
            <a href={projeto.url_video_pitch} className="text-primary underline" target="_blank" rel="noreferrer">
              abrir link
            </a>
          ) : (
            "Não informado"
          )}
        </p>
        <ProjetoDetalhesSetores projeto={projeto} />
      </SectionCard>
    </div>
  );
}
