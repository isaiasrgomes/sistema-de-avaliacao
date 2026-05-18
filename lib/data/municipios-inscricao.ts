import { createAdminClient } from "@/lib/supabase/admin";

export async function loadMunicipiosParaInscricao(): Promise<string[]> {
  const supabase = createAdminClient();
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

  return Array.from(new Set([...municipiosBrasil, ...sertaoLista])).sort((a, b) => a.localeCompare(b, "pt-BR"));
}
