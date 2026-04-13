import { createServerSupabase } from "@/lib/supabase/server";
import { AvaliadoresClient } from "./avaliadores-client";

export default async function AvaliadoresPage() {
  const supabase = await createServerSupabase();
  const { data: avaliadores } = await supabase.from("avaliadores").select("*").order("nome");

  const comCarga = await Promise.all(
    (avaliadores ?? []).map(async (a) => {
      const { count } = await supabase
        .from("atribuicoes")
        .select("*", { count: "exact", head: true })
        .eq("avaliador_id", a.id)
        .in("status", ["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA"]);
      return { ...a, carga: count ?? 0 };
    })
  );

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold">Avaliadores</h1>
        <p className="text-muted-foreground">Cadastro deve usar o mesmo e-mail do login (magic link).</p>
      </div>
      <AvaliadoresClient initial={comCarga} />
    </div>
  );
}
