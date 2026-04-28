import { createServerSupabase } from "@/lib/supabase/server";
import { ProjetosClient } from "./projetos-client";

export default async function AdminProjetosPage() {
  const supabase = await createServerSupabase();
  const { data: projetos } = await supabase.from("projetos").select("*").order("timestamp_submissao", { ascending: false });

  const projetoIds = (projetos ?? []).map((p) => p.id).filter(Boolean);
  const qtdAvaliadoresByProjetoId = new Map<string, number>();

  if (projetoIds.length > 0) {
    const { data: atribs } = await supabase
      .from("atribuicoes")
      .select("id, projeto_id")
      .in("projeto_id", projetoIds)
      .order("id", { ascending: true });

    for (const a of atribs ?? []) {
      const atual = qtdAvaliadoresByProjetoId.get(a.projeto_id) ?? 0;
      qtdAvaliadoresByProjetoId.set(a.projeto_id, atual + 1);
    }
  }

  const projetosEnriquecidos = (projetos ?? []).map((p) => ({
    ...p,
    qtd_avaliadores_atual: qtdAvaliadoresByProjetoId.get(p.id) ?? 0,
  }));

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/70 bg-card/80 p-5 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Projetos - triagem</h1>
        <p className="text-sm text-muted-foreground">Filtre, desclassifique ou reclassifique inscricoes.</p>
      </div>
      <ProjetosClient initial={projetosEnriquecidos} />
    </div>
  );
}
