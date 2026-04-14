import { ProjetoManualForm } from "./projeto-manual-form";
import { ImportarCsvCard } from "./importar-csv-card";
import { createServerSupabase } from "@/lib/supabase/server";
import { UFS_BRASIL } from "@/lib/constants/brasil";

export default async function ImportarPage() {
  const supabase = await createServerSupabase();
  const { data: municipiosSertao } = await supabase
    .from("municipios_sertao")
    .select("municipio")
    .order("municipio", { ascending: true });
  const sertaoLista = (municipiosSertao ?? []).map((m) => m.municipio);

  let municipiosBrasil: string[] = [];
  try {
    const resp = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome", {
      next: { revalidate: 86400 },
    });
    if (resp.ok) {
      const data = (await resp.json()) as { nome: string }[];
      municipiosBrasil = data.map((m) => m.nome);
    }
  } catch {
    municipiosBrasil = [];
  }
  const municipios = Array.from(new Set([...municipiosBrasil, ...sertaoLista])).sort((a, b) => a.localeCompare(b, "pt-BR"));

  return (
    <div className="max-w-5xl space-y-6">
      <div className="rounded-xl border border-border/70 bg-card/80 p-5 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Inscricoes</h1>
        <p className="text-sm text-muted-foreground">Cadastre manualmente ou importe planilha exportada do Google Forms.</p>
      </div>
      <ProjetoManualForm municipios={municipios} ufs={[...UFS_BRASIL]} />
      <ImportarCsvCard />
    </div>
  );
}
