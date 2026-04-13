import { createServerSupabase } from "@/lib/supabase/server";
import { ProjetosClient } from "./projetos-client";

export default async function AdminProjetosPage() {
  const supabase = await createServerSupabase();
  const { data: projetos } = await supabase.from("projetos").select("*").order("timestamp_submissao", { ascending: false });

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold">Projetos — triagem</h1>
        <p className="text-muted-foreground">Filtre, desclassifique ou reclassifique inscrições.</p>
      </div>
      <ProjetosClient initial={projetos ?? []} />
    </div>
  );
}
