import { createServerSupabase } from "@/lib/supabase/server";
import { AtribuicoesClient } from "./atribuicoes-client";

export default async function AtribuicoesPage() {
  const supabase = await createServerSupabase();
  const { data: projetos } = await supabase
    .from("projetos")
    .select("id, nome_projeto, status")
    .in("status", ["INSCRITO", "EM_AVALIACAO", "AGUARDANDO_3O_AVALIADOR"])
    .order("nome_projeto");
  const { data: avaliadores } = await supabase.from("avaliadores").select("id, nome, email").eq("ativo", true).order("nome");

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold">Atribuições</h1>
        <p className="text-muted-foreground">Modo manual (2 avaliadores) ou distribuição automática balanceada.</p>
      </div>
      <AtribuicoesClient projetos={projetos ?? []} avaliadores={avaliadores ?? []} />
    </div>
  );
}
