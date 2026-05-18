import { ProjetoInscricaoForm } from "./projeto-manual-form";
import { ImportarCsvCard } from "./importar-csv-card";
import { UFS_BRASIL } from "@/lib/constants/brasil";
import { loadMunicipiosParaInscricao } from "@/lib/data/municipios-inscricao";

export default async function ImportarPage() {
  const municipios = await loadMunicipiosParaInscricao();

  return (
    <div className="max-w-5xl space-y-6">
      <div className="rounded-xl border border-border/70 bg-card/80 p-5 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Inscrições</h1>
        <p className="text-sm text-muted-foreground">Cadastre manualmente ou importe planilha exportada do Google Forms.</p>
      </div>
      <ProjetoInscricaoForm municipios={municipios} ufs={[...UFS_BRASIL]} variant="admin" />
      <ImportarCsvCard />
    </div>
  );
}
