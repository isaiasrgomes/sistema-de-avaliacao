import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { ProjetoDetalhesSetores } from "@/components/projeto-detalhes-setores";
import { ProjetoAvaliadoresNotas, type AtribuicaoComAvaliacao } from "@/components/projeto-avaliadores-notas";
import { SectionCard } from "@/components/layout/section-card";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function AdminProjetoDetalhesPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabase();
  const { data: projeto } = await supabase.from("projetos").select("*").eq("id", params.id).single();

  if (!projeto) return <p>Projeto não encontrado.</p>;

  const { data: atribuicoesRaw } = await supabase
    .from("atribuicoes")
    .select(
      `id, ordem, status,
       avaliadores ( nome ),
       avaliacoes ( nota_total_ponderada, nota_equipe, nota_mercado, nota_produto, nota_tecnologia, justificativa_geral, observacoes_gerais )`
    )
    .eq("projeto_id", projeto.id)
    .order("ordem", { ascending: true });

  const atribuicoes = (atribuicoesRaw ?? []) as unknown as AtribuicaoComAvaliacao[];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SectionCard className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-2xl font-bold">{projeto.nome_projeto}</h1>
          <StatusBadge status={projeto.status} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/admin/projetos#${projeto.id}`}>Voltar para lista</Link>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <a href={`/api/relatorios/pdf?tipo=PARECER&projetoId=${encodeURIComponent(projeto.id)}`}>
              <span className="inline-flex items-center gap-2">
                <FileDown className="h-4 w-4" />
                Exportar PDF
              </span>
            </a>
          </Button>
        </div>

        <div className="space-y-3">
          {atribuicoes.length > 0 ? <ProjetoAvaliadoresNotas atribuicoes={atribuicoes} /> : null}
          <ProjetoDetalhesSetores projeto={projeto} />
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
        </div>
      </SectionCard>
    </div>
  );
}
