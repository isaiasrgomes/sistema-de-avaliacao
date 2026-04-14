import { ProjetoManualForm } from "./projeto-manual-form";
import { ImportarCsvCard } from "./importar-csv-card";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function ImportarPage() {
  const supabase = await createServerSupabase();
  const { data: municipiosSertao } = await supabase
    .from("municipios_sertao")
    .select("municipio")
    .order("municipio", { ascending: true });

  return (
    <div className="max-w-5xl space-y-6">
      <div className="rounded-xl border border-border/70 bg-card/80 p-5 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Inscricoes</h1>
        <p className="text-sm text-muted-foreground">Cadastre manualmente ou importe planilha exportada do Google Forms.</p>
      </div>
      <ProjetoManualForm municipiosSertao={(municipiosSertao ?? []).map((m) => m.municipio)} />
      <ImportarCsvCard />
    </div>
  );
}
