import { createServerSupabase } from "@/lib/supabase/server";
import { ProjetosAvaliadorClient } from "./projetos-client";

export default async function AvaliadorHomePage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: av } = await supabase
    .from("avaliadores")
    .select("id")
    .ilike("email", (user?.email ?? "").trim().toLowerCase())
    .maybeSingle();

  if (!av) {
    return <p className="text-destructive">Seu e-mail não está cadastrado como avaliador. Solicite inclusão à coordenação.</p>;
  }

  const { data: atribs } = await supabase
    .from("atribuicoes")
    .select("id, status, projeto_id, ordem")
    .eq("avaliador_id", av.id)
    .order("data_atribuicao", { ascending: false });

  const projetoIds = Array.from(new Set((atribs ?? []).map((a) => a.projeto_id)));
  const { data: projetos } =
    projetoIds.length > 0
      ? await supabase.from("projetos").select("id, nome_projeto, status").in("id", projetoIds)
      : { data: [] as { id: string; nome_projeto: string; status: string }[] };

  const mapP = new Map(projetos?.map((p) => [p.id, p]));
  const rows = (atribs ?? []).map((a) => {
    const p = mapP.get(a.projeto_id);
    return {
      id: a.id,
      status: a.status,
      projeto_id: a.projeto_id,
      ordem: a.ordem,
      nome_projeto: p?.nome_projeto ?? a.projeto_id,
      projeto_status: p?.status ?? "INSCRITO",
    };
  });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/70 bg-card/80 p-5 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Meus projetos</h1>
        <p className="text-sm text-muted-foreground">
          Filtre por pendentes, já avaliados ou todos para organizar melhor sua lista.
        </p>
      </div>
      <ProjetosAvaliadorClient rows={rows} />
    </div>
  );
}
