import { createServerSupabase } from "@/lib/supabase/server";
import { getProgramaAbertoInscricao } from "@/lib/programa/context";
import { ProjetoInscricaoForm } from "./projeto-manual-form";
import { ImportarCsvCard } from "./importar-csv-card";
import { UFS_BRASIL } from "@/lib/constants/brasil";
import { loadMunicipiosParaInscricao } from "@/lib/data/municipios-inscricao";
import { PageHeader } from "@/components/layout/page-header";

export default async function ImportarPage() {
  const municipios = await loadMunicipiosParaInscricao();
  const supabase = await createServerSupabase();
  const programaAtivo = await getProgramaAbertoInscricao(supabase);

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader
        title="Inscrições"
        description="Cadastre manualmente ou importe planilha exportada do Google Forms."
      />
      <ProjetoInscricaoForm municipios={municipios} ufs={[...UFS_BRASIL]} variant="admin" />
      <ImportarCsvCard
        programaAtivoNome={programaAtivo?.nome ?? null}
        importacaoDisponivel={!!programaAtivo}
      />
    </div>
  );
}
