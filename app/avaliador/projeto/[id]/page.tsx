import { createServerSupabase } from "@/lib/supabase/server";
import { podeEnviarAvaliacaoAgora } from "@/lib/prazo-avaliacoes";
import { AvaliacaoForm } from "./avaliacao-form";

export default async function AvaliadorProjetoPage({
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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{projeto.nome_projeto}</h1>
        <p className="text-muted-foreground">
          {projeto.nome_responsavel} — {projeto.municipio} — {projeto.fase}
        </p>
      </div>
      {projeto.url_video_pitch && (
        <div className="aspect-video w-full overflow-hidden rounded-lg border bg-black">
          <iframe title="pitch" className="h-full w-full" src={projeto.url_video_pitch} allowFullScreen />
        </div>
      )}
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
